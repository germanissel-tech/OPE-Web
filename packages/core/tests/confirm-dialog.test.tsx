// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_STRINGS } from '../src/base/strings'
import { StringsProvider } from '../src/base/use-strings'
import { ConfirmDialog } from '../src/ui/confirm-dialog'

/**
 * **Una confirmación dice la consecuencia y se apaga mientras corre**
 * (`GR-37`, `GR-65`).
 *
 * Lo que se afirma es lo que una pantalla olvidaría al armarlo por tercera vez:
 * que la consecuencia esté a la vista, que el botón lleve el verbo que se le
 * dio, y que mientras corre no se pueda apretar dos veces.
 */

afterEach(cleanup)

const strings = DEFAULT_STRINGS

function mount(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const calls = { confirmed: 0, closed: 0 }
  render(
    <StringsProvider>
      <ConfirmDialog
        open
        title="Apagar"
        consequence="Desde el pedido siguiente no se decide nada."
        confirmLabel="Apagar"
        onConfirm={() => {
          calls.confirmed += 1
        }}
        onClose={() => {
          calls.closed += 1
        }}
        {...props}
      />
    </StringsProvider>,
  )
  return calls
}

describe('la confirmación', () => {
  it('muestra la consecuencia y el verbo, no un «aceptar»', () => {
    mount()

    expect(screen.getByText('Desde el pedido siguiente no se decide nada.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Apagar' })).toBeDefined()
    expect(screen.getByRole('button', { name: strings.cancel })).toBeDefined()
  })

  it('confirma con el botón, y cerrar es de quien la abrió', () => {
    const calls = mount()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    })

    expect(calls.confirmed).toBe(1)
    /* No se cierra sola: si lo confirmado falla, la explicación tiene dónde
       quedarse. */
    expect(calls.closed).toBe(0)
  })

  it('mientras corre, el confirmar está apagado y dice por qué', () => {
    const calls = mount({ running: true })
    const button = screen.getByRole('button', { name: 'Apagar' })

    expect(button.getAttribute('aria-disabled')).toBe('true')

    act(() => {
      fireEvent.click(button)
    })

    expect(calls.confirmed).toBe(0)
  })

  it('cancelar cierra sin confirmar', () => {
    const calls = mount()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: strings.cancel }))
    })

    expect(calls.closed).toBe(1)
    expect(calls.confirmed).toBe(0)
  })
})
