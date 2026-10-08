/**
 * **Lo que cuarzo publica para probar** — `@ope/core/testing`.
 *
 * Entra por una puerta aparte y no por la principal, y no es prolijidad: lo que
 * se importa desde acá **es para el banco de pruebas**, y una aplicación que lo
 * importe sin querer lo despacharía. Que salga del artefacto por sacudido de
 * árbol funciona hasta que alguien lo referencia de más; una entrada propia lo
 * vuelve una decisión visible.
 */

export { telemetryContract } from './telemetry-contract'
