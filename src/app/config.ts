import { baseSchema, because, mapOf, readConfigWith, url, type ValueOf } from '@cuarzo/core'

/**
 * **Qué configuración necesita esta aplicación** (`CU-17`).
 *
 * Es el piso del marco más lo suyo. Acá lo suyo es **contra qué sistemas
 * habla**: `demo` es obligatorio, así que `config.systems.demo` es un texto y
 * no `string | undefined`.
 *
 * Eso no es comodidad de tipos: sin declararlo, quien lo use termina poniéndole
 * un `?? ''` y **la configuración faltante se descubre en una llamada a una URL
 * vacía**, lejos de su causa. Declarado, la aplicación no arranca y dice cuál
 * falta.
 */
const schema = {
  ...baseSchema,
  systems: because(mapOf(url, ['demo']), 'La aplicación no tendría a quién preguntarle'),
}

export type Config = ValueOf<typeof schema>

export const readConfig = (): Promise<Config> => readConfigWith(schema)
