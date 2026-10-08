/**
 * Verifica que **el módulo de capacidades sea el del contrato sincronizado**
 * (`TAN-7`, `CU-37`).
 *
 * `contracts/ope/` llega por `npm run contract:sync` y se versiona. Son cinco
 * archivos que tienen que hablar del mismo contrato: el bundle, los tipos, el
 * módulo de capacidades y su identidad. Si alguien actualiza uno a mano, o
 * sincroniza a medias, lo que queda es un panel que ofrece un botón con la
 * capacidad de ayer contra una API que exige la de hoy — y nada lo denuncia
 * hasta producción.
 *
 * Lo que se verifica, en orden:
 *
 * 1. `sha256(openapi.yaml)` coincide con `identity.json` y con `CONTRACT.sha256`.
 * 2. `CONTRACT.version` coincide con `info.version` del bundle.
 * 3. Cada operación de `OPERATIONS` existe en `api.d.ts`, y cada operación del
 *    consumidor en el bundle está en `OPERATIONS`. Una de más o de menos falla
 *    nombrándola.
 * 4. `CAPABILITIES` es exactamente la unión ordenada de las de `OPERATIONS`.
 * 5. Cuántas operaciones y capacidades revisó. Con cero, falla: aprobar sin
 *    sujetos es enseñar a no leer los aprobados (`TAN-6`, regla 4).
 *
 * Todo lo que falla termina en la misma instrucción: **corré
 * `npm run contract:sync`**.
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'yaml'

import { ROOT } from './context.mjs'

const DIR = join(ROOT, 'contracts', 'ope')
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']

const fallas = []
const fail = (que, donde) => fallas.push([que, donde])

console.log('')

for (const name of ['openapi.yaml', 'api.d.ts', 'capabilities.js', 'identity.json']) {
  if (!existsSync(join(DIR, name))) {
    console.log(`  FALLA  falta contracts/ope/${name}`)
    console.log('         corré npm run contract:sync')
    console.log('')
    process.exit(1)
  }
}

const bundleBytes = readFileSync(join(DIR, 'openapi.yaml'))
const sha256 = createHash('sha256').update(bundleBytes).digest('hex')
const bundle = parse(bundleBytes.toString('utf8'))
const identity = JSON.parse(readFileSync(join(DIR, 'identity.json'), 'utf8'))
const types = readFileSync(join(DIR, 'api.d.ts'), 'utf8')
const module_ = await import(pathToFileURL(join(DIR, 'capabilities.js')).href)

/* 1 · La identidad */
if (identity.sha256 !== sha256) {
  fail(
    'identity.json no es la del bundle',
    `sha256 ${String(identity.sha256).slice(0, 12)}… ≠ ${sha256.slice(0, 12)}…`,
  )
}
if (module_.CONTRACT?.sha256 !== sha256) {
  fail(
    'capabilities.js no salió de este bundle',
    `CONTRACT.sha256 ${String(module_.CONTRACT?.sha256).slice(0, 12)}… ≠ ${sha256.slice(0, 12)}…`,
  )
}

/* 2 · La versión */
const version = bundle?.info?.version
if (module_.CONTRACT?.version !== version) {
  fail(
    'capabilities.js cita otra versión del contrato',
    `CONTRACT.version ${module_.CONTRACT?.version} ≠ info.version ${version}`,
  )
}
if (identity.version !== version) {
  fail(
    'identity.json cita otra versión del contrato',
    `${identity.version} ≠ info.version ${version}`,
  )
}

/* 3 · Las operaciones: del módulo contra los tipos, y del bundle contra el módulo */
const consumer = module_.CONSUMER
const OPERATIONS = module_.OPERATIONS ?? {}
const declared = Object.keys(OPERATIONS)

const typed = new Set()
const block = /export interface operations \{\n([\s\S]*?)\n\}/.exec(types)
if (block) {
  for (const m of block[1].matchAll(/^ {4}(\w+): \{$/gm)) typed.add(m[1])
}

for (const id of declared) {
  if (!typed.has(id))
    fail(
      `la operación ${id} está en capabilities.js y no en api.d.ts`,
      'los tipos y el módulo salieron de contratos distintos',
    )
}

const inBundle = []
for (const [path, item] of Object.entries(bundle?.paths ?? {})) {
  for (const method of METHODS) {
    const op = item?.[method]
    if (!op || typeof op !== 'object') continue
    if (!Array.isArray(op.tags) || !op.tags.includes(consumer)) continue
    inBundle.push({ id: op.operationId, where: `${method.toUpperCase()} ${path}` })
  }
}

for (const { id, where } of inBundle) {
  if (!(id in OPERATIONS))
    fail(
      `la operación ${id} (${where}) es del consumidor ${consumer} y no está en capabilities.js`,
      'el módulo se emitió de otro bundle, o se editó a mano',
    )
}

/* 4 · El vocabulario */
const expected = [...new Set(declared.flatMap((id) => OPERATIONS[id]?.capabilities ?? []))].sort()
const listed = Array.isArray(module_.CAPABILITIES) ? module_.CAPABILITIES : []
if (JSON.stringify(expected) !== JSON.stringify(listed)) {
  fail(
    'CAPABILITIES no es la unión ordenada de las capacidades de OPERATIONS',
    `esperaba [${expected.join(', ')}], hay [${listed.join(', ')}]`,
  )
}

for (const id of declared) {
  const requirement = OPERATIONS[id]
  if (!Array.isArray(requirement?.capabilities) || requirement.capabilities.length === 0) {
    fail(
      `la operación ${id} no exige ninguna capacidad`,
      'su botón se dibujaría para cualquiera (CU-37)',
    )
  }
  if (typeof requirement?.idempotent !== 'boolean') {
    fail(
      `la operación ${id} no dice si es idempotente`,
      'el módulo no tiene la forma de contract-artifact.md',
    )
  }
}

/* 5 · Sin sujetos no se aprueba */
if (declared.length === 0 || listed.length === 0) {
  fail('el módulo no declara operaciones o capacidades', 'con cero no hay nada que verificar')
}

if (fallas.length > 0) {
  for (const [que, donde] of fallas) {
    console.log(`  FALLA  ${que}`)
    console.log(`         ${donde}`)
  }
  console.log('')
  console.log('EL CONTRATO Y EL MÓDULO SE DESPEGARON: CORRÉ npm run contract:sync')
  console.log('')
  process.exit(1)
}

console.log(
  `  ok     contrato ${version} · sha256 ${sha256.slice(0, 12)}… · identidad y módulo coinciden`,
)
console.log(
  `  ok     ${declared.length} operaciones del consumidor ${consumer}, todas en api.d.ts y todas en el bundle`,
)
console.log(`  ok     ${listed.length} capacidades, la unión ordenada de lo que exigen`)
if (identity.backendCommit) {
  console.log(`  --     sincronizado de OPE-Backend ${String(identity.backendCommit).slice(0, 7)}`)
}
console.log('')
console.log('EL MÓDULO ES EL DEL CONTRATO')
console.log('')
