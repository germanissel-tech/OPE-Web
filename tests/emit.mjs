/**
 * **Emitir lo generado, o verificar que esté al día** — con el mismo texto.
 *
 * Lo comparten los generadores que leen `contracts/demo.yaml`: los roles de cada
 * operación (`CU-37`) y las restricciones de cada mensaje (`CU-38`).
 *
 * ## Por qué hace falta el modo que verifica
 *
 * `CU-38` promete que **si la regla declarada cambia, la copia local deja de
 * compilar**. Eso es cierto, pero recién **después de regenerar** — y regenerar
 * vivía sólo en `npm run tipos`, que no corre ni en `npm test` ni en
 * `npm run build`. O sea que cambiar una regla del contrato no rompía nada: el
 * compilador nunca llegaba a ver la diferencia, y la pantalla seguía bloqueando
 * con el criterio de antes.
 *
 * Con `--verificar`, el ciclo compara lo generado contra el contrato y **falla
 * diciendo qué correr**. No escribe: una comprobación que arregla lo que
 * encuentra deja de encontrar nada.
 *
 * ## Los finales de línea se normalizan, y no es un detalle
 *
 * Se emite con `\n` y git entrega el archivo con `\r\n` en Windows. Comparando
 * crudo, **esto daría distinto siempre** — una comprobación que falla siempre se
 * apaga a la semana, que es la otra forma de no tener garantía.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { relative, sep } from 'node:path'

import { ROOT } from './raiz.mjs'

/**
 * **La última línea, no el arreglo.**
 *
 * Compara sin mirar el fin de línea, porque un artefacto emitido con `\n` y
 * leído después de un checkout de Windows vuelve con `\r\n`: distinto byte a
 * byte, idéntico en contenido, y la comprobación fallaba pidiendo regenerar
 * algo que ya estaba al día.
 *
 * **La causa se arregla en `.gitattributes`** —`* text=auto eol=lf`—, que hace
 * que ese checkout no ocurra. Esto queda porque no todos los repositorios de la
 * familia lo tienen todavía, y porque un repositorio mal configurado tiene que
 * dar un error de lo suyo y no de fines de línea.
 *
 * Que hace falta se comprueba pasando un artefacto a CRLF a mano: con esto
 * pasa, y sin esto falla.
 */
const sameLines = (text) => text.replaceAll('\r\n', '\n')

/**
 * `fuente` y `comando` se reciben porque **el mensaje de una falla tiene que
 * nombrar la causa correcta**. Con «no coincide con el contrato» fijo, el
 * catálogo —que sale de la prosa, no del contrato— mandaba a mirar el lugar
 * equivocado; y `npm run tipos` no lo regenera.
 */
export function emit(
  target,
  text,
  summary,
  { fuente = 'el contrato', comando = 'npm run tipos' } = {},
) {
  const short = relative(ROOT, target).split(sep).join('/')

  if (!process.argv.includes('--verificar')) {
    writeFileSync(target, text, 'utf8')
    console.log('')
    console.log(`  ${summary} → ${short}`)
    console.log('')
    return
  }

  const onDisk = existsSync(target) ? sameLines(readFileSync(target, 'utf8')) : undefined

  if (onDisk === sameLines(text)) {
    console.log(`  ok     ${short} está al día con ${fuente}`)
    return
  }

  console.log('')
  console.log(`  FALLA  ${short} no coincide con ${fuente}`)
  console.log(
    `         ${onDisk === undefined ? 'no existe' : `${fuente} cambió y no se regeneró`} — corré ${comando}`,
  )
  console.log('')
  process.exit(1)
}
