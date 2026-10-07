/**
 * Lee el **historial legado** de pedidos de este repositorio (`TAN-5`).
 *
 * `PEDIDOS.md` fue la fuente hasta que `TAN-5` se enmendó: el sobre de un pedido
 * pasó a vivir en `tandilia/pedidos/<receptor>/`, porque escribirlo adentro del
 * repositorio que lo recibe obliga a quien pide a entrar a un repositorio que no
 * gobierna.
 *
 * **Así que acá ya no puede aparecer un pedido nuevo**, y esto no lo espera. Lo
 * que sigue haciendo es cuidar lo que quedó escrito: que se lea entero, que no
 * haya una entrada con un estado que no existe, y que ninguna desaparezca por un
 * renglón mal puesto — que fue el defecto que tuvo.
 *
 * **No falla por un pedido sin cerrar**: los que quedaron abiertos son historia,
 * no trabajo pendiente de acá.
 *
 * ## Lo que ya no cubre, y hay que saberlo
 *
 * Que un pedido nuevo **no se pueda ignorar sin haberlo visto** era su razón de
 * ser, y esa garantía ahora es de Tandilia, que mantiene la vista central. Desde
 * este repositorio no se vigila: decirlo es lo único que evita que alguien
 * suponga que sí.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ROOT } from './context.mjs'

const REQUESTS_FILE = join(ROOT, 'PEDIDOS.md')

if (!existsSync(REQUESTS_FILE)) {
  console.log('')
  console.log('  --     no hay PEDIDOS.md: nadie le pidió nada a este repositorio todavía')
  console.log('')
  process.exit(0)
}

/**
 * Se normalizan los finales de línea antes de leer.
 *
 * **Este archivo lo escribe otro repositorio**, y en Windows llega con CRLF. Que
 * un pedido no se lea por eso sería la peor forma de fallar: `TAN-5` dice que se
 * lee al empezar la sesión, y una lista vacía se confunde con «no hay nada».
 */
const text = readFileSync(REQUESTS_FILE, 'utf8').replaceAll('\r\n', '\n')

/** Los cuatro que fija `TAN-5`. */
const STATES = ['abierto', 'aceptado', 'rechazado', 'hecho']

/**
 * La forma la fija TAN-5: `### PED-n · Título` y después la línea de estado.
 *
 * **El estado se acepta con o sin negritas.** granito escribe `**hecho**` para
 * que se vea de un vistazo en una lista larga, y pelear esa diferencia sería
 * hacer que la comprobación mande sobre la redacción — que no es lo que vigila.
 * Lo que sí importa es que la palabra sea una de las cuatro, y **eso sí se
 * verifica**: un `echo` con un dedazo se leería como «no abierto», y el pedido
 * desaparecería de la lista sin que nadie lo hubiera cerrado.
 */
const entries = [
  ...text.matchAll(
    /^### (PED-\d+) · (.+)\n\n\*\*Estado\*\*: \*{0,2}(\w+)\*{0,2}(?: · \*\*Pide\*\*: ([^·\n]+))?(?:.*\*\*Bloquea\*\*: (\w+))?/gm,
  ),
].map(([, id, title, status, asker, blocks]) => ({
  id,
  title,
  status,
  asker: asker?.trim() ?? '?',
  blocks: blocks === 'sí',
}))

/**
 * **Cuántos pedidos hay, contados por su cabecera y no por lo que se pudo leer.**
 *
 * Es lo único que distingue «no hay más» de «no lo entendí». El patrón de
 * arriba exige la línea de estado pegada a la cabecera, así que **un renglón en
 * blanco de más hace desaparecer un pedido entero** — y desaparecer es
 * exactamente lo que `TAN-5` existe para impedir: un pedido que no se lee no es
 * un pedido.
 */
const headings = [...text.matchAll(/^### (PED-\d+) ·/gm)].map(([, id]) => id)
const parsed = new Set(entries.map((e) => e.id))
const unreadable = headings.filter((id) => !parsed.has(id))

const open = entries.filter((e) => e.status === 'abierto')
const blocking = open.filter((e) => e.blocks)
const unknown = entries.filter((e) => !STATES.includes(e.status))

console.log('')
if (entries.length === 0) {
  console.log('  FALLA  hay PEDIDOS.md pero no pude leer ninguna entrada')
  console.log('         ¿Cambió el formato que fija TAN-5?')
  console.log('')
  process.exit(1)
}

if (unreadable.length > 0) {
  console.log(`  FALLA  ${unreadable.length} pedido(s) con cabecera y sin estado legible`)
  console.log(`         ${unreadable.join(' · ')} — la línea **Estado** va pegada al título`)
  console.log('')
  process.exit(1)
}

if (unknown.length > 0) {
  console.log(`  FALLA  ${unknown[0].id} declara un estado que no existe: "${unknown[0].status}"`)
  console.log(`         Los de TAN-5 son: ${STATES.join(' · ')}`)
  console.log('')
  process.exit(1)
}

for (const e of open) {
  console.log(`  ${e.blocks ? 'BLOQUEA' : 'abierto'}  ${e.id}  ${e.title}`)
  console.log(`           lo pide ${e.asker}`)
}

const closed = entries.length - open.length
console.log('')
console.log(
  `  ${entries.length} en el historial legado · ${closed} resueltos` +
    (open.length > 0 ? ` · ${open.length} quedaron sin cerrar` : '') +
    (blocking.length > 0 ? ` · ${blocking.length} declaraban bloqueo` : ''),
)
console.log('         los pedidos nuevos viven en tandilia/pedidos/, y los vigila Tandilia')
console.log('')
