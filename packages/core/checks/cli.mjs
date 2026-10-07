#!/usr/bin/env node

/**
 * `cuarzo-check` — las comprobaciones del marco, corriendo sobre el repositorio
 * que las llama.
 *
 * Se publican por la misma razón que el cableado (`CU-42`): son **idénticas en
 * las cuatro aplicaciones**, y copiadas se quedan en la versión del día que
 * alguien clonó. La ironía sería grande: lo que existe para que las garantías no
 * se pudran, pudriéndose.
 *
 * **Corre todas y recién después decide.** Parar en la primera esconde las
 * demás, y quien arregla una quiere saber si quedan otras antes de volver a
 * mirar.
 */

import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { declared } from './context.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

const CHECKS = [
  { name: 'decisions', what: 'las decisiones y sus citas' },
  { name: 'boundaries', what: 'la dirección de las dependencias' },
  { name: 'quality', what: 'lo mecanizable del estándar' },
  { name: 'labels', what: 'que el mismo campo se llame igual en todas las pantallas' },
  { name: 'artifact', what: 'que la sesión falsa no se despache' },
  { name: 'packaging', what: 'que lo publicable exista y esté versionado' },
  { name: 'requests', what: 'los pedidos abiertos de otros repositorios' },
  { name: 'errors', what: 'que se ramifique por error.code y nunca por su mensaje' },
]

/**
 * **Lo que este repositorio se configuró, dicho en voz alta.**
 *
 * Qué se puede declarar está acotado en `context.mjs`, y una clave inválida no
 * llega hasta acá. Lo que esto agrega es que lo declarado **se vea en cada
 * corrida**: una lista de composición que creció de dos a nueve archivos es una
 * decisión de diseño, y una que sólo vive en un `package.json` no la mira nadie.
 *
 * Se imprime desde el corredor y no desde cada comprobación, que corren en su
 * propio proceso: siete veces lo mismo es ruido.
 */
const configured = Object.keys(declared)

if (configured.length > 0) {
  const detail = configured
    .map((key) => (Array.isArray(declared[key]) ? `${key} (${declared[key].length})` : key))
    .join(' · ')

  console.log('')
  console.log(`  configurado por este repositorio:  ${detail}`)
}

let failed = 0

for (const check of CHECKS) {
  const result = spawnSync(process.execPath, [join(HERE, `${check.name}.mjs`)], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  if (result.status !== 0) failed++
}

console.log('')
if (failed > 0) {
  console.log(`${failed} de ${CHECKS.length} comprobaciones no pasaron.`)
  console.log('')
  process.exit(1)
}

console.log(`Las ${CHECKS.length} comprobaciones pasaron.`)
console.log('')
