/**
 * **Se ramifica por `error.code`, y nunca por `error.message`** (`CU-14`).
 *
 * El `code` es un identificador del contrato: lo elige el backend, está
 * documentado y no cambia sin que alguien lo decida. El `message` es
 * **castellano para una persona** — se corrige una tilde, se suaviza una
 * frase, se traduce— y ninguna de esas correcciones se anuncia, porque
 * ninguna es un cambio de contrato.
 *
 * ## Por qué existe
 *
 * Es una de las cinco reglas que `CU-21` enumera como **no inferibles del
 * ejemplo**: ninguna está escrita en el archivo que una aplicación nueva va a
 * copiar, y las cinco se olvidan. Ésta es la que falla peor.
 *
 * Un `if` que compara el texto de un mensaje **anda perfectamente el día que se
 * escribe**. Se rompe meses después, del otro lado del sistema, cuando alguien
 * arregla una redacción — y lo que se ve entonces es una rama que dejó de
 * tomarse, sin error, sin excepción y sin nada que apunte a la causa. El
 * commit que lo rompió no tocó este repositorio.
 *
 * ## Qué NO es una falla
 *
 * **Mostrar el mensaje.** Para eso está: `resultOf` y `failureNotice` lo ponen
 * en la descripción del error, y eso es exactamente su trabajo.
 *
 * **Preguntar de qué tipo es.** `typeof body.message === 'string'` mira la
 * forma de lo que llegó, no su contenido, y es lo que hace falta para armar el
 * error antes de que exista.
 *
 * La regla es una sola y se puede decir en un renglón: **el contenido del
 * mensaje no decide nada.**
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { apps, ROOT } from './context.mjs'

/**
 * **Se miran las que estén, y no las que deberían estar.**
 *
 * El `src/` de cada aplicación declarada, y el de cada paquete. Que no haya
 * **ninguna** sí es una falla, y se trata abajo.
 */
const CANDIDATAS = [...apps.map((app) => `${app}/src`), 'packages/core/src', 'packages/session/src']

function filesIn(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...filesIn(path))
    else if (/\.tsx?$/.test(name)) out.push(path)
  }
  return out
}

/**
 * Las cuatro formas de dejar que el texto decida.
 *
 * Se buscan por forma y no por intención, que es lo único que se puede
 * mecanizar: comparar el mensaje, buscar adentro del mensaje, medirlo contra
 * una expresión regular, o abrir un `switch` sobre él.
 */
const RAMIFICA = [
  [
    /\.message\s*\??\.\s*(?:includes|startsWith|endsWith|indexOf|search|match)\s*\(/g,
    'busca adentro del mensaje',
  ],
  [/\.message\s*[!=]==?/g, 'compara el texto del mensaje'],
  [/[!=]==?\s*[A-Za-z_$][\w$.]*\.message\b/g, 'compara el texto del mensaje'],
  [/\.test\(\s*[A-Za-z_$][\w$.]*\.message\b/g, 'mide el mensaje contra una expresión regular'],
  [/switch\s*\([^)]*\.message\b/g, 'abre un `switch` sobre el mensaje'],
]

/** `typeof x.message === 'string'` mira la forma, no el contenido. */
const esTypeof = (text, at) => /\btypeof\s+[\w$.]*$/.test(text.slice(Math.max(0, at - 40), at))

const fallas = []
let archivos = 0
let usos = 0
/** Archivos de prueba: comparar un mensaje ahí es afirmar, no decidir. */
let pruebas = 0

const raices = CANDIDATAS.filter((each) => existsSync(join(ROOT, ...each.split('/'))))

for (const raiz of raices) {
  for (const file of filesIn(join(ROOT, ...raiz.split('/')))) {
    const short = relative(ROOT, file).split(sep).join('/')

    if (/\.test\.tsx?$/.test(short)) {
      pruebas++
      continue
    }

    archivos++
    const text = readFileSync(file, 'utf8')

    usos += [...text.matchAll(/\.message\b/g)].length

    for (const [pattern, que] of RAMIFICA) {
      for (const match of text.matchAll(pattern)) {
        if (esTypeof(text, match.index)) continue
        const linea = text.slice(0, match.index).split('\n').length
        fallas.push([`${que} (CU-14)`, `${short}:${linea}  —  ${match[0].trim()}`])
      }
    }
  }
}

console.log('')

/**
 * **Sin una sola carpeta de fuentes no hay nada que revisar** (`TAN-6`, regla
 * 4). Aprobar acá sería enseñar a no leer los aprobados de esta comprobación.
 */
if (raices.length === 0) {
  console.log('  FALLA  no encontré ninguna carpeta de fuentes, y esto existe para revisarlas')
  console.log(`         buscadas: ${CANDIDATAS.join(', ')} — ¿se renombró alguna?`)
  console.log('')
  process.exit(1)
}

if (fallas.length > 0) {
  for (const [que, donde] of fallas) {
    console.log(`  FALLA  ${que}`)
    console.log(`         ${donde}`)
  }
  console.log('')
  console.log('EL CONTENIDO DE UN MENSAJE NO DECIDE NADA: RAMIFICÁ POR error.code')
  console.log('')
  process.exit(1)
}

/* Se dice cuántos usos se clasificaron y no sólo que no hubo fallas: con cero,
   este «ok» sería el de una comprobación que no encontró contra qué correr. */
console.log(`  ok     ${usos} usos de \`.message\` en ${archivos} archivos, todos de presentación`)

if (pruebas > 0) {
  console.log(
    `  --     ${pruebas} archivos de prueba: ahí comparar un mensaje es afirmar, no decidir`,
  )
}
console.log('')
