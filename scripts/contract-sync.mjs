#!/usr/bin/env node

/**
 * **El contrato de OPE llega como artefacto** (`TAN-7`, `OW-5`).
 *
 * Copia a `contracts/ope/` lo que OPE-Backend emite para consumidores en
 * `generated/contract/` (su feature 040, `ADR-044`): el bundle con cabecera, los
 * tipos de `openapi-typescript`, el catálogo de problemas, el módulo de
 * capacidades, las restricciones de cada cuerpo de pedido y la identidad del
 * contrato. **No emite nada**: si el backend no tiene esa carpeta, falla
 * diciendo qué correr allá.
 *
 * Dónde está el backend, en este orden: `--from <carpeta>` (una carpeta
 * descomprimida de un release, con la misma disposición), `OPE_BACKEND_DIR`, o
 * la carpeta hermana `../backend`.
 *
 * **Se versiona lo que deja.** Un clon sin vecino tiene que poder compilar y
 * verificar; por eso `contracts/ope/` va al repositorio y `ope-check conformity`
 * vigila que el módulo y el bundle no se despeguen.
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { parse } from 'yaml'

const ROOT = process.cwd()
const TARGET = join(ROOT, 'contracts', 'ope')

/** El consumidor que esta base describe. El portal pedirá el suyo en otro archivo. */
const CONSUMER = 'admin'

function fail(what, why) {
  console.error('')
  console.error(`  FALLA  ${what}`)
  if (why) console.error(`         ${why}`)
  console.error('')
  process.exit(1)
}

/* ── Dónde está el backend ──────────────────────────────────────────────── */

function backendDir() {
  const at = process.argv.indexOf('--from')
  if (at !== -1) {
    const given = process.argv[at + 1]
    if (!given) fail('`--from` necesita una carpeta', 'npm run contract:sync -- --from <carpeta>')
    return { dir: resolve(ROOT, given), how: `--from ${given}` }
  }
  if (process.env.OPE_BACKEND_DIR) {
    return { dir: resolve(process.env.OPE_BACKEND_DIR), how: 'OPE_BACKEND_DIR' }
  }
  return { dir: resolve(ROOT, '..', 'backend'), how: 'la carpeta hermana ../backend' }
}

const { dir: BACKEND, how } = backendDir()

if (!existsSync(BACKEND)) {
  fail(
    `No encuentro el backend en ${BACKEND} (${how})`,
    'Indicalo con OPE_BACKEND_DIR o con --from <carpeta>',
  )
}

/* ── Lo que el backend emite para consumidores ──────────────────────────── */

/**
 * Los ocho archivos de `generated/contract/`, y ninguno más: el backend los
 * emite juntos y con la misma identidad, y copiar uno que no esté ahí sería
 * sincronizar a medias.
 */
const EMITTED = join(BACKEND, 'generated', 'contract')
const EXPECTED = [
  'openapi.yaml',
  'api.d.ts',
  'problem-types.d.ts',
  'capabilities.js',
  'capabilities.d.ts',
  'constraints.js',
  'constraints.d.ts',
  'identity.json',
]

if (!existsSync(EMITTED) || !statSync(EMITTED).isDirectory()) {
  fail(
    `El backend no tiene generated/contract/ (${BACKEND})`,
    'Corré `npm run contract:types` en el backend: es lo que la emite (OPE-Backend 040, ADR-044)',
  )
}

const present = readdirSync(EMITTED)
const missing = EXPECTED.filter((name) => !present.includes(name))
if (missing.length > 0) {
  fail(
    `A generated/contract/ del backend le falta ${missing.join(', ')}`,
    'Corré `npm run contract:types` en el backend: los ocho archivos se emiten juntos',
  )
}

mkdirSync(TARGET, { recursive: true })

const short = (path) => relative(ROOT, path).split(sep).join('/')

console.log('')
console.log(`  backend: ${BACKEND} (${how})`)

for (const name of EXPECTED) {
  copyFileSync(join(EMITTED, name), join(TARGET, name))
  console.log(`  copiado  generated/contract/${name} → ${short(join(TARGET, name))}`)
}

/* ── Identidad del bundle ───────────────────────────────────────────────── */

/* La copia lleva cabecera: el `sha256` que `identity.json` declara es el de
   estos bytes, que son los que `conformity` hashea. */
const bundleBytes = readFileSync(join(TARGET, 'openapi.yaml'))
const sha256 = createHash('sha256').update(bundleBytes).digest('hex')
const bundle = parse(bundleBytes.toString('utf8'))
const version = bundle?.info?.version

if (typeof version !== 'string' || version.length === 0) {
  fail('El bundle no declara info.version', 'Sin versión no hay con qué identificar el contrato')
}

function backendCommit() {
  try {
    return execFileSync('git', ['-C', BACKEND, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return undefined
  }
}

const commit = backendCommit()
const today = new Date().toISOString().slice(0, 10)

/* ── El README: de qué commit salió, y cuándo ───────────────────────────── */

const readme = `# \`contracts/ope/\` — el contrato de OPE, como artefacto

**No se edita a mano.** Lo deja \`npm run contract:sync\` (\`scripts/contract-sync.mjs\`), que copia
\`generated/contract/\` de OPE-Backend tal cual, y \`ope-check conformity\` verifica que el módulo de
capacidades, las restricciones y el bundle no se hayan despegado.

| | |
|---|---|
| Versión del contrato | \`${version}\` |
| \`sha256\` del bundle copiado | \`${sha256}\` |
| Commit de OPE-Backend | ${commit ? `\`${commit}\`` : '_desconocido: el backend no era un clon de git_'} |
| Sincronizado | ${today} |

## Los archivos

Los ocho salen de \`generated/contract/\` del backend, que los emite con \`npm run contract:types\`
(\`ADR-044\`); la forma es la que este repositorio publica en
\`specs/005-la-base-de-ope/contracts/contract-artifact.md\` y
\`specs/006-el-merchant-completo/contracts/constraints-artifact.md\`.

| archivo | qué es | quién lo lee |
|---|---|---|
| \`openapi.yaml\` | el bundle del contrato, con su cabecera de generado | \`conformity\`; una persona |
| \`api.d.ts\` | los tipos de openapi-typescript | \`openapi-fetch\` en \`apps/*/src/api/ope/\`; \`conformity\` |
| \`problem-types.d.ts\` | el catálogo de problemas | \`@ope/core\` (\`ProblemSlug\`) |
| \`capabilities.js\` + \`capabilities.d.ts\` | el módulo de \`TAN-7\`: operación → capacidades e idempotencia, y el vocabulario del consumidor \`${CONSUMER}\` | \`operation()\`, \`conformity\`, la sesión falsa |
| \`identity.json\` | versión y \`sha256\` del bundle copiado | \`conformity\`; este README |
| \`constraints.js\` + \`constraints.d.ts\` | la capa 1 de \`CU-38\`: qué puede verificar un formulario de cada cuerpo de pedido del consumidor \`${CONSUMER}\` | \`useForm\` desde \`apps/*/src/api/ope/\`; \`conformity\` |
`

writeFileSync(join(TARGET, 'README.md'), readme, 'utf8')

console.log(`  escrito  ${short(join(TARGET, 'README.md'))}`)
console.log('')
console.log(
  `  contrato ${version} · sha256 ${sha256.slice(0, 12)}… · backend ${commit ? commit.slice(0, 7) : '(sin git)'}`,
)
console.log('')
