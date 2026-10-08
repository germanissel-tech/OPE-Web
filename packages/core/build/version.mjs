import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * **Qué compilación es ésta** (`CU-35`).
 *
 * Un complemento de Vite, y no un `define` copiado en cada `vite.config.ts`:
 * copiado, una aplicación clonada que lo borre **se queda sin versión y nadie se
 * entera**. Acá lo decide cuarzo, una vez.
 *
 * ```ts
 * import { opeBuild } from '@ope/core/build'
 * export default defineConfig({ plugins: [react(), opeBuild()] })
 * ```
 *
 * ## Qué identifica una compilación, y por qué no alcanza el `package.json`
 *
 * La versión sola no sirve: **nadie sube el número de una aplicación privada**, y
 * cuatro despliegues seguidos dicen `0.0.0`. Lo que contesta «¿esto empezó con
 * el último despliegue?» **es el commit**.
 *
 * Entonces `0.0.0+a1b2c3d`: la versión para leer, el commit para precisar.
 *
 * ## Y si no hay git, lo dice
 *
 * Un artefacto compilado desde un `.tar` no tiene repositorio. Sale
 * `0.0.0+sin-commit`, **y no la versión pelada**: una versión que parece precisa
 * y no lo es manda a buscar un commit que no existe. Que falte se ve; que mienta,
 * no.
 *
 * ## Por qué no se lee de la configuración
 *
 * `config.json` es **del despliegue** y esto es **del artefacto** (`CU-17`,
 * `CU-36`). El mismo build promovido de pruebas a producción es la misma
 * compilación, y ésa es justamente la pregunta que la versión existe para
 * contestar.
 */

/** El commit corto, o nada si no hay repositorio. */
function commitOf(root) {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim()
  } catch {
    return undefined
  }
}

/** Lo que dice el `package.json` de quien compila. */
function versionOf(root) {
  try {
    return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  } catch {
    return undefined
  }
}

export function opeBuild() {
  return {
    name: 'ope-build',
    config(_config, { command }) {
      const root = process.cwd()
      const version = versionOf(root) ?? 'sin-version'
      const commit = commitOf(root) ?? 'sin-commit'

      /* En desarrollo el commit cambia a cada rato y recompilar por eso sería
         ruido: alcanza con saber que es el de trabajo. */
      const id = command === 'serve' ? `${version}+dev` : `${version}+${commit}`

      return { define: { __OPE_BUILD__: JSON.stringify(id) } }
    },
  }
}
