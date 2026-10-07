// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type TelemetryEvent, TelemetryProvider } from '../src/base/telemetry'
import { StringsProvider } from '../src/base/use-strings'
import { ScreenError } from '../src/ui/screen-error'

/**
 * **Cuando una pantalla revienta, el marco sobrevive** (`CU-30`).
 *
 * Se prueba acá porque **provocarlo a mano es difícil de repetir**: hay que
 * romper una pantalla a propósito, y una vez arreglada nadie vuelve a ensayarlo.
 * Y lo que más importa —qué llega al registro— no se ve en la pantalla.
 */

afterEach(cleanup)

/* Un límite de error escribe en consola por diseño de React. Se silencia para
   que la salida de las pruebas no parezca rota. */
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function Reventada({ failing }: { readonly failing: boolean }): React.ReactNode {
  if (failing) throw new Error('Cannot read properties of undefined')
  return <p>La pantalla anda</p>
}

const recorded: TelemetryEvent[] = []

/** El último que registró, ya angostado al que esta prueba mira. */
const lastFailure = () => {
  const event = recorded.at(-1)
  return event?.kind === 'screenFailed' ? event : undefined
}

function Marco({ children }: { readonly children: React.ReactNode }) {
  return (
    <StringsProvider>
      <TelemetryProvider
        value={{
          port: { record: (each) => recorded.push(each.event) },
          app: 'demo',
          version: 'v1',
          envelope: {},
        }}
      >
        <nav>El menú, que tiene que sobrevivir</nav>
        {children}
      </TelemetryProvider>
    </StringsProvider>
  )
}

describe('una pantalla que revienta', () => {
  it('se reemplaza sola, y el marco queda en pie', () => {
    /* Tapar todo le sacaría al operador justo el control que necesita: sin
       navegación la única salida es recargar a mano. */
    render(
      <Marco>
        <ScreenError screen="catalogGrid">
          <Reventada failing />
        </ScreenError>
      </Marco>,
    )

    expect(screen.queryByText('La pantalla anda')).toBeNull()
    expect(screen.getByText('El menú, que tiene que sobrevivir')).toBeDefined()
  })

  it('muestra un identificador, porque no hubo pedido que lo trajera', () => {
    /* Sin algo que mencionar, «no anda» no se puede encontrar después. */
    render(
      <Marco>
        <ScreenError screen="catalogGrid">
          <Reventada failing />
        </ScreenError>
      </Marco>,
    )

    const shown = lastFailure()?.id
    expect(shown).toBeDefined()
    expect(screen.getByText(String(shown))).toBeDefined()
  })

  it('registra qué pantalla y qué error, **y nada más**', () => {
    /* Un error de programación arrastra adentro lo que la pantalla estaba
       mostrando. Lo que va al registro es el puntero, no el contenido. */
    recorded.length = 0
    render(
      <Marco>
        <ScreenError screen="catalogGrid">
          <Reventada failing />
        </ScreenError>
      </Marco>,
    )

    const event = lastFailure()
    expect(event).toBeDefined()
    expect(event?.screen).toBe('catalogGrid')
    expect(event?.error).toContain('Cannot read properties of undefined')
    expect(Object.keys(event ?? {}).sort()).toEqual(['error', 'id', 'kind', 'screen'])
  })

  it('deja algo que apretar', () => {
    /* `CU-30`: nunca queda sin nada. */
    render(
      <Marco>
        <ScreenError screen="catalogGrid">
          <Reventada failing />
        </ScreenError>
      </Marco>,
    )

    /* Dos: reintentar, y el de copiar el identificador que granito le pone al
       lado. Que el segundo exista es del mismo problema — uno que hay que
       transcribir a mano se transcribe mal. */
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeDefined()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1)
  })
})

describe('reintentar', () => {
  it('remonta la pantalla de cero, en vez de restaurar lo que quedó roto', () => {
    /* El estado que sobrevivió a un error de programación es justamente el que
       no se puede dar por bueno. */
    function Intermitente() {
      const [failing, setFailing] = useState(true)
      return (
        <Marco>
          <button type="button" onClick={() => setFailing(false)}>
            arreglar
          </button>
          <ScreenError screen="catalogGrid">
            <Reventada failing={failing} />
          </ScreenError>
        </Marco>
      )
    }

    render(<Intermitente />)
    expect(screen.queryByText('La pantalla anda')).toBeNull()

    fireEvent.click(screen.getByText('arreglar'))
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(screen.getByText('La pantalla anda')).toBeDefined()
  })
})
