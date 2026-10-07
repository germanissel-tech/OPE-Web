/**
 * **Las decisiones viajan con el paquete** (deuda 1 de `../../docs/deuda.md`).
 *
 * Una aplicación clonada hereda comentarios que citan `CU-n`, y `decisions.mjs`
 * no tenía contra qué compararlos: los documentos viven en `docs/`, arriba de
 * `packages/`, y npm no empaqueta hacia arriba. La comprobación lo decía —*«no
 * encontré las de cuarzo: sus citas no se verificaron»*— y ahí se quedaba.
 *
 * Lo que restringía es preciso: una aplicación puede citar una decisión
 * inexistente y **completar lo que cree que dice**, que es exactamente el modo
 * de falla que la comprobación existe para cerrar.
 *
 * ## Por qué copiar y no mudar
 *
 * **La fuente sigue en `docs/`**, que es donde `CLAUDE.md` manda a todos y
 * donde se edita. Mudarla adentro del paquete dejaría el mapa del repositorio
 * mintiendo, y además las decisiones **no son de `core`**: `CU-11` es de
 * sesión, y en el mismo texto conviven `GR-n` y `TAN-n`.
 *
 * La copia está ignorada por git, así que no hay dos versiones que editar.
 *
 * ## Por qué éstos dos y no el índice
 *
 * `decisiones.md` es una **tabla** —`| **CU-8** | decidida | …`— y quien lee
 * busca encabezados `### CU-n ·`. Publicarlo sería peor que no publicar nada:
 * daría cero identificadores, y cero no es «no encontré» sino «ninguna existe»,
 * o sea que **fallarían todas las citas del clon**.
 */

import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..')

/** Los que tienen los encabezados reales. La numeración es corrida entre ambos. */
const DOCUMENTS = ['arquitectura.md', 'seguridad.md']

const into = join(HERE, 'docs')
mkdirSync(into, { recursive: true })

for (const name of DOCUMENTS) {
  copyFileSync(join(REPO, 'docs', name), join(into, name))
}

console.log(`  ok     ${DOCUMENTS.length} documentos de decisiones copiados al paquete`)
