// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { defineScreen } from '../src/base/registry'
import { AuthorizationProvider, buildRoutes } from '../src/base/routes'
import { type Recorded, TelemetryProvider } from '../src/base/telemetry'
import { StringsProvider } from '../src/base/use-strings'

/**
 * **Una pantalla se anota una vez por apertura, no por montaje** (`CU-35`).
 *
 * Se prueba en `StrictMode` **porque es donde el síntoma aparece**: React ejecuta
 * los efectos dos veces a propósito, y con eso destapa que anotar la apertura no
 * es idempotente. No es un detalle de desarrollo — un remontaje real, como el
 * del reintento de `CU-30`, produce exactamente lo mismo en producción.
 */

const recorded: Recorded[] = []

afterEach(() => {
  cleanup()
  recorded.length = 0
})

function Nada() {
  return <p>algo</p>
}

const screen = defineScreen({ id: 'catalogGrid', title: 'C', path: '/catalog', component: Nada })

function mount() {
  const [route] = buildRoutes([screen])

  render(
    <StrictMode>
      <StringsProvider>
        <TelemetryProvider
          value={{
            port: { record: (each) => recorded.push(each) },
            app: 'demo',
            version: 'v1',
            envelope: {},
          }}
        >
          <AuthorizationProvider capabilities={new Set()} forbidden={<p>no</p>}>
            {route?.element}
          </AuthorizationProvider>
        </TelemetryProvider>
      </StringsProvider>
    </StrictMode>,
  )
}

describe('anotar que una pantalla se abrió', () => {
  it('pasa una sola vez aunque el efecto corra dos', () => {
    /* Sin la marca sale duplicado, y un tablero cuenta el doble de aperturas de
       las que hubo. */
    mount()

    expect(recorded.filter((each) => each.event.kind === 'screenOpened')).toHaveLength(1)
  })

  it('y lo que anota es la pantalla, con su sobre', () => {
    mount()

    expect(recorded[0]).toMatchObject({ screen: 'catalogGrid', app: 'demo' })
  })
})
