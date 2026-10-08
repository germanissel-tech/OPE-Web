import { baseSchema, baseUrl, because, mapOf, readConfigWith, type ValueOf } from '@ope/core'

/**
 * **Qué configuración necesita esta aplicación** (`CU-17`).
 *
 * Es el piso del marco más lo suyo. Acá lo suyo es **contra qué sistemas
 * habla**: `ope` es obligatorio, así que `config.systems.ope` es un texto y no
 * `string | undefined`. `demo` es el del hola mundo y se va con él en el tramo
 * 5 de la 005.
 *
 * Eso no es comodidad de tipos: sin declararlo, quien lo use termina poniéndole
 * un `?? ''` y **la configuración faltante se descubre en una llamada a una URL
 * vacía**, lejos de su causa. Declarado, la aplicación no arranca y dice cuál
 * falta.
 *
 * **Ningún emisor, ningún client, ninguna credencial**: el bearer no necesita
 * configuración, y un `config.json` con un token adentro sería una puerta
 * trasera. El esquema no tiene dónde ponerlo.
 */
const schema = {
  ...baseSchema,
  systems: because(mapOf(baseUrl, ['ope', 'demo']), 'La aplicación no tendría a quién preguntarle'),
}

export type Config = ValueOf<typeof schema>

export const readConfig = (): Promise<Config> => readConfigWith(schema)
