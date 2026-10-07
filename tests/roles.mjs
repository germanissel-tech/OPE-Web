/**
 * **Lo que el contrato le exige a cada operación** (`CU-37`, `CU-34`).
 *
 * Dos cosas: qué roles pide, y si pide clave de idempotencia.
 *
 * `openapi-typescript` no emite las extensiones `x-`, así que `x-required-roles`
 * no llega a los tipos. Y `CU-37` dice que la capacidad se **deriva** del
 * contrato: escribirla a mano sería la copia que un día no coincide, que es
 * justo lo que esa decisión existe para cerrar.
 *
 * Entonces se genera, al lado de los tipos y con el mismo comando.
 *
 * Se lee con expresiones y no con un analizador de YAML **a propósito**: es lo
 * mismo que hace el simulado del ejemplo, y no vale sumar una dependencia para
 * esto. Si el contrato cambia de forma, **falla**: no emite un mapa a medias.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { emit } from './emit.mjs'
import { ROOT } from './raiz.mjs'

const CONTRACT = join(ROOT, 'contracts', 'demo.yaml')
const OUTPUT = join(ROOT, 'src', 'api', 'demo', 'roles.ts')

const yaml = readFileSync(CONTRACT, 'utf8')

/**
 * Cada operación con sus roles.
 *
 * El `operationId` y los `x-required-roles` viven en el mismo bloque y en ese
 * orden, así que se los toma juntos: si aparecieran separados, esto no
 * encuentra el par y falla, en vez de emitir una operación sin roles —que
 * dibujaría el botón para cualquiera.
 */
const found = [...yaml.matchAll(/operationId: (\w+)[\s\S]*?x-required-roles: \[([^\]]*)\]/g)]

if (found.length === 0) {
  throw new Error(`No encontré operaciones con x-required-roles en ${CONTRACT}. ¿Cambió su forma?`)
}

const operations = yaml.match(/operationId: \w+/g) ?? []
if (found.length !== operations.length) {
  throw new Error(
    `El contrato tiene ${operations.length} operaciones y sólo ${found.length} declaran ` +
      'x-required-roles. Una operación sin roles dibujaría su botón para cualquiera.',
  )
}

/**
 * Cuáles exigen clave de idempotencia (`CU-34`).
 *
 * Se mira **el bloque de cada operación y no el archivo entero**: cortando por
 * el `operationId` siguiente, la referencia de una no se le atribuye a la de al
 * lado. Marcada de más, mandaría una clave que el servidor ignora; marcada de
 * menos no compila, porque el contrato la declara requerida.
 */
const blocks = yaml.split(/(?=\n\s+operationId: )/)
const idempotent = new Set()
/**
 * **Y las que exigen testigo** (`CU-29`).
 *
 * Sale del contrato por el mismo camino y por la misma razón: una operación que
 * pide `If-Match` y se escribe sin él manda un cambio a ciegas, y el servidor lo
 * rechaza con `412` recién en producción. Declararlo a mano sería la copia que
 * un día no coincide — que es lo que `CU-37` cierra para los roles.
 */
const versioned = new Set()
for (const block of blocks) {
  const id = block.match(/operationId: (\w+)/)?.[1]
  if (!id) continue
  if (block.includes('parameters/IdempotencyKey')) idempotent.add(id)
  if (block.includes('parameters/IfMatch')) versioned.add(id)
}

const entries = found
  .map(([, id, roles]) => {
    const list = roles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean)
    return (
      `  ${id}: { roles: [${list.map((role) => `'${role}'`).join(', ')}], ` +
      `idempotent: ${idempotent.has(id)}, versioned: ${versioned.has(id)} },`
    )
  })
  .join('\n')

emit(
  OUTPUT,
  `/**
 * Generado por \`npm run tipos\` desde \`contracts/demo.yaml\` — no editar a mano.
 * This file was auto-generated. Do not make direct changes to the file.
 *
 * Qué le exige el contrato a cada operación: sus roles, si pide clave de
 * idempotencia, y si exige el testigo del recurso. De acá salen la capacidad de
 * una acción (\`CU-37\`), su clave (\`CU-34\`) y la versión sobre la que escribe
 * (\`CU-29\`), y por eso se genera: escribirlo a mano sería la copia que un día
 * no coincide con lo que la API permite.
 */

export const contractRequires = {
${entries}
} as const

/** Los identificadores que el contrato declara. Un typo no compila. */
export type OperationId = keyof typeof contractRequires
`,
  `${found.length} operaciones con lo que el contrato les exige ` +
    `(${idempotent.size} con clave, ${versioned.size} con testigo)`,
)
