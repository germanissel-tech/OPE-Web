// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_STRINGS } from '../src/base/strings'
import { StringsProvider } from '../src/base/use-strings'
import { SecretOnce } from '../src/ui/secret-once'

/**
 * **Un valor que se muestra una vez: se ve, se copia, y no queda en ningún
 * lado** (`OW-8`).
 *
 * Se prueba sin aplicación: lo que recibe son rótulos y valores, y lo que se
 * afirma es que los dibuja, que copiar copia, que un portapapeles que falla se
 * dice, y que desmontar no deja rastro en el documento.
 */

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const strings = DEFAULT_STRINGS

function mount() {
  return render(
    <StringsProvider>
      <SecretOnce
        warning="No vuelve a verse."
        secrets={[
          { label: 'Llave del tag', value: 'ope_ik_UNA' },
          { label: 'Llave de la plataforma', value: 'ope_pk_OTRA' },
        ]}
      />
    </StringsProvider>,
  )
}

function withClipboard(writeText: (text: string) => Promise<void>) {
  vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } })
}

describe('un secreto que se muestra una vez', () => {
  it('dibuja la advertencia y cada valor con su rótulo', () => {
    mount()

    expect(screen.getByText('No vuelve a verse.')).toBeDefined()
    expect(screen.getByText(strings.copyOnceTitle)).toBeDefined()
    expect(screen.getByText('ope_ik_UNA')).toBeDefined()
    expect(screen.getByText('ope_pk_OTRA')).toBeDefined()
    expect(screen.getAllByRole('button', { name: strings.copy })).toHaveLength(2)
  })

  it('copiar manda el valor al portapapeles y lo dice', async () => {
    const copied: string[] = []
    withClipboard(async (text) => {
      copied.push(text)
    })
    mount()

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: strings.copy })[1] as HTMLElement)
    })

    expect(copied).toEqual(['ope_pk_OTRA'])
    expect(screen.getByText(strings.copied)).toBeDefined()
  })

  it('si el portapapeles falla, lo dice en vez de fingir que copió', async () => {
    withClipboard(async () => {
      throw new Error('not allowed')
    })
    mount()

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: strings.copy })[0] as HTMLElement)
    })

    expect(screen.getByText(strings.copyFailed)).toBeDefined()
    expect(screen.queryByText(strings.copied)).toBeNull()
  })

  it('sin portapapeles también lo dice', async () => {
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: undefined })
    mount()

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: strings.copy })[0] as HTMLElement)
    })

    expect(screen.getByText(strings.copyFailed)).toBeDefined()
  })

  it('al desmontar no queda el valor en ningún lado del documento', () => {
    const { unmount } = mount()
    unmount()

    expect(document.body.innerHTML).not.toContain('ope_ik_UNA')
    expect(document.body.innerHTML).not.toContain('ope_pk_OTRA')
  })
})
