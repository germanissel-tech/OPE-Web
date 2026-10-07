import { describe, expect, it, vi } from 'vitest'
import { isFailure } from '../src/base/failure'
import { consoleTelemetry, type TelemetryPort } from '../src/base/telemetry'
import { telemetryContract } from '../src/testing/telemetry-contract'

/**
 * **La prueba de la prueba de contrato** (`CU-35`).
 *
 * Una suite que no agarra nada es peor que ninguna: da la garantía sin darla, y
 * quien escriba el adaptador de un tablero la va a correr en verde creyendo que
 * está cubierto. Así que acá se le pasan las tres formas de romper el contrato,
 * una por una.
 */

const thrown = (port: TelemetryPort) => {
  try {
    telemetryContract(port)
  } catch (error) {
    return error
  }
  return undefined
}

describe('el contrato del registro', () => {
  it('lo cumple el de desarrollo', () => {
    /* Si el que viene en la caja no lo cumpliera, el contrato estaría midiendo
       otra cosa. */
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})

    expect(() => telemetryContract(consoleTelemetry)).not.toThrow()
  })

  it('rechaza uno que tira', () => {
    /* Es el que más duele: quien lo llamó estaba tratando un error, y el
       original se pierde atrás de éste. */
    const broken: TelemetryPort = {
      record: () => {
        throw new Error('el tablero no responde')
      },
    }

    expect(isFailure(thrown(broken), 'declaration.brokenTelemetry')).toBe(true)
  })

  it('rechaza uno que devuelve una promesa', () => {
    /* El tipo dice `void`, y una función `async` es asignable a `void`: el
       compilador no lo agarra y **esto sí**. */
    const blocking: TelemetryPort = { record: async () => {} }

    expect(isFailure(thrown(blocking), 'declaration.brokenTelemetry')).toBe(true)
  })

  it('rechaza uno que modifica el evento', () => {
    /* Quien lo mandó puede seguir usándolo, y lo agregado viaja con él. */
    const meddling: TelemetryPort = {
      record: (event) => {
        Object.assign(event, { tenant: 'las-animas' })
      },
    }

    expect(isFailure(thrown(meddling), 'declaration.brokenTelemetry')).toBe(true)
  })

  it('dice cuál fue el problema, no sólo que hubo uno', () => {
    /* Quien lo corre está escribiendo un adaptador: «falló» sin decir qué lo
       manda a leer el código de la prueba. */
    const blocking: TelemetryPort = { record: async () => {} }
    const failure = thrown(blocking)

    expect(String(failure)).toContain('promesa')
  })
})
