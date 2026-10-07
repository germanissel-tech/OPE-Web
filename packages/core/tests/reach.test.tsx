// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { defineScreen, toReach } from '../src/base/registry'
import { AuthorizationProvider } from '../src/base/routes'
import { ActionButton } from '../src/ui/action-button'
import { useActionColumn } from '../src/ui/use-action-column'

/**
 * **Lo que un permiso no habilita no se muestra, también cuando navega**
 * (`CU-3`, `CU-23`).
 *
 * Se prueba porque el defecto **no se ve con permisos completos**, que es como
 * se mira una pantalla mientras se la escribe. Aparece el día que alguien entra
 * con menos, y entonces el control lo lleva a un lugar al que no puede entrar.
 */

function Nada() {
  return null
}

/* `` no es opcional acá y el tipo lo exige: una ruta con parámetro
   no tiene con qué completar una entrada de menú (`CU-41`). */
const ficha = defineScreen({
  id: 'articleForm',
  title: 'Ficha',
  path: '/catalog/:id',
  capability: 'catalog:read',
  component: Nada,
})

const suelta = defineScreen({ id: 'home', title: 'Inicio', path: '/', component: Nada })

const withCapabilities =
  (...granted: string[]) =>
  ({ children }: { readonly children: ReactNode }) => (
    <AuthorizationProvider capabilities={new Set(granted)} forbidden={null}>
      {children}
    </AuthorizationProvider>
  )

afterEach(cleanup)

describe('lo que hace falta para llegar a una pantalla', () => {
  it('es su capacidad, con la misma forma que una acción', () => {
    /* La misma forma para que un control que **navega** se filtre con lo mismo
       que uno que **ejecuta**, sin que cada pantalla lo arme a mano. */
    expect(toReach(ficha)).toEqual({ requires: ['catalog:read'] })
  })

  it('y no exige nada si la pantalla no declara capacidad', () => {
    expect(toReach(suelta)).toEqual({ requires: [] })
  })
})

describe('un control que lleva a una pantalla', () => {
  const Abrir = () => (
    <ActionButton {...toReach(ficha)} onClick={() => {}}>
      Ver la ficha
    </ActionButton>
  )

  it('se dibuja si la sesión habilita llegar', () => {
    render(<Abrir />, { wrapper: withCapabilities('catalog:read') })

    expect(screen.queryByText('Ver la ficha')).not.toBeNull()
  })

  it('**no se dibuja** si no', () => {
    /* Un gesto no se puede esconder; un control sí. Ésa es toda la diferencia. */
    render(<Abrir />, { wrapper: withCapabilities('catalog:write') })

    expect(screen.queryByText('Ver la ficha')).toBeNull()
  })
})

describe('la columna de acciones con más de una', () => {
  const useColumn = () =>
    useActionColumn([toReach(ficha), { requires: ['catalog:write'] }], () => null)

  function Grid() {
    return <p>{useColumn().length === 1 ? 'hay columna' : 'no hay'}</p>
  }

  it('existe si **alguna** está habilitada', () => {
    /* Atarla a una sola dejaría la columna atada al permiso equivocado: quien
       puede abrir y no cambiar el estado se quedaría sin ninguna de las dos. */
    render(<Grid />, { wrapper: withCapabilities('catalog:read') })

    expect(screen.getByText('hay columna')).toBeDefined()
  })

  it('y no existe si ninguna', () => {
    /* Si no, queda un encabezado vacío: ruido con otra forma. */
    render(<Grid />, { wrapper: withCapabilities('otra:cosa') })

    expect(screen.getByText('no hay')).toBeDefined()
  })
})

describe('lo que el flujo omite no se dibuja, y no es cuestión de permisos', () => {
  /**
   * **`offered: false` y `requires` dicen cosas distintas** (`CU-47`).
   *
   * `requires` dice «esta sesión no»; `offered: false` dice «acá no». Si se
   * mezclaran, un permiso de más resucitaría un control que el recorrido no
   * tiene — y el operador vería una acción que al apretarla falla.
   *
   * Por eso se prueba **con todas las capacidades**: es la única forma de
   * distinguir un mecanismo del otro.
   */
  it('no se dibuja ni con la capacidad puesta', () => {
    render(
      <ActionButton requires={['catalog:read']} offered={false}>
        ver
      </ActionButton>,
      { wrapper: withCapabilities('catalog:read') },
    )

    expect(screen.queryByText('ver')).toBeNull()
  })

  it('y sin la marca se dibuja como siempre: lo normal es ofrecer', () => {
    /* La marca es opcional a propósito. Si hiciera falta ponerla siempre, cada
       control tendría un `offered` escrito a mano, que es la copia que un día
       queda en `false` por un dedazo. */
    render(<ActionButton requires={['catalog:read']}>ver</ActionButton>, {
      wrapper: withCapabilities('catalog:read'),
    })

    expect(screen.queryByText('ver')).not.toBeNull()
  })
})
