// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_STRINGS } from '../src/base/strings'
import { StringsProvider } from '../src/base/use-strings'
import { defaultSessionViews } from '../src/ui/session-views'
import { SignIn } from '../src/ui/sign-in'

/**
 * **La vista de ingreso entrega la credencial y no la ve más** (`CU-10`).
 *
 * Se prueba sin adaptador: `signIn` es lo que recibe, y acá se le da una que
 * contesta lo que cada caso necesita. Lo que se afirma es lo de la vista — qué
 * manda, qué dice cuando no entra, y que no se dibuja cuando no hay entrada.
 */

afterEach(cleanup)

const strings = DEFAULT_STRINGS

function typeAndSubmit(credential: string) {
  fireEvent.change(screen.getByLabelText(strings.credentialLabel), {
    target: { value: credential },
  })
  fireEvent.click(screen.getByRole('button', { name: strings.signIn }))
}

describe('la vista de ingreso', () => {
  it('llama a signIn con lo tecleado, y nada más', async () => {
    const received: (string | undefined)[] = []
    render(
      <SignIn
        signIn={async (credential) => {
          received.push(credential)
          return { ok: true }
        }}
        strings={strings}
      />,
    )

    await act(async () => typeAndSubmit('ope_at_secreta'))

    expect(received).toEqual(['ope_at_secreta'])
  })

  it('no manda una credencial vacía: el botón no se puede apretar', () => {
    render(<SignIn signIn={async () => ({ ok: true })} strings={strings} />)

    expect(screen.getByRole('button', { name: strings.signIn }).getAttribute('aria-disabled')).toBe(
      'true',
    )
  })

  it('dice que la rechazaron, y vacía el campo', async () => {
    render(<SignIn signIn={async () => ({ ok: false, reason: 'rejected' })} strings={strings} />)

    await act(async () => typeAndSubmit('inventada'))

    expect(screen.getByText(strings.signInRejected)).toBeDefined()
    expect((screen.getByLabelText(strings.credentialLabel) as HTMLInputElement).value).toBe('')
  })

  it('dice que no hubo servidor, con el texto del marco', async () => {
    render(<SignIn signIn={async () => ({ ok: false, reason: 'unreachable' })} strings={strings} />)

    await act(async () => typeAndSubmit('ope_at_secreta'))

    expect(screen.getByText(strings.serverUnreachable)).toBeDefined()
  })

  it('el campo no muestra lo que se escribe', () => {
    render(<SignIn signIn={async () => ({ ok: true })} strings={strings} />)

    expect(screen.getByLabelText(strings.credentialLabel).getAttribute('type')).toBe('password')
  })
})

describe('la vista de anonymous', () => {
  const context = {
    waitThresholdMs: 0,
    endReason: undefined,
    application: null,
    reenter: () => {},
    strings,
  }

  it('es el ingreso cuando el adaptador tiene entrada', () => {
    render(
      <StringsProvider>
        {defaultSessionViews.anonymous({ ...context, signIn: async () => ({ ok: true }) })}
      </StringsProvider>,
    )

    expect(screen.getByLabelText(strings.credentialLabel)).toBeDefined()
  })

  it('y el aviso de «no hay sesión» cuando entra solo', () => {
    render(
      <StringsProvider>
        {defaultSessionViews.anonymous({ ...context, signIn: undefined })}
      </StringsProvider>,
    )

    expect(screen.queryByLabelText(strings.credentialLabel)).toBeNull()
    expect(screen.getByText(strings.noSession)).toBeDefined()
  })

  it('ended con la credencial rechazada en vuelo dice por qué', () => {
    render(
      <StringsProvider>
        {defaultSessionViews.ended({ ...context, signIn: undefined, endReason: 'token-rejected' })}
      </StringsProvider>,
    )

    expect(screen.getByText(strings.sessionEndedTokenRejected)).toBeDefined()
  })
})
