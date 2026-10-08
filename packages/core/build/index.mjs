/**
 * **Lo que cuarzo aporta al compilar** — `@ope/core/build`.
 *
 * Entra por una puerta aparte porque **corre en Node y no en el navegador**:
 * lee el `package.json` y llama a `git`. Importarlo desde la aplicación no
 * compilaría, y ésa es la idea.
 */

export { opeBuild } from './version.mjs'
