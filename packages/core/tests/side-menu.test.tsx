// @vitest-environment jsdom

import { cleanup, screen as dom, fireEvent, render } from '@testing-library/react'
import { act, useState } from 'react'
import { RouterProvider, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApplication } from '../src/app/create-application'
import { defineFlow, opens } from '../src/base/flow'
import { FLOW_KEY } from '../src/base/here'
import { outcome } from '../src/base/outcome'
import { defineScreen } from '../src/base/registry'
import { AuthorizationProvider } from '../src/base/routes'
import { PreferencesProvider } from '../src/base/use-preferences'
import { FlowProvider } from '../src/data/use-flow'
import { Frame } from '../src/ui/frame'
import { useUnsavedWork } from '../src/ui/unsaved-work'
import { NoticesProvider } from '../src/ui/use-notices'

/**
 * **El menú lateral abandona el flujo y empieza el nuevo** (`CU-47`).
 *
 * Lo que hay que sostener: el `Leaf` de granito es un `<a href>` de verdad, así
 * que sin un manejador que haga `preventDefault` cada clic del menú **recarga la
 * aplicación entera**. Y eso no se ve mirando: una recarga se parece bastante a
 * una navegación que funciona.
 *
 * Lo que se rompía detrás no se parecía a nada: el ruteador nunca se enteraba,
 * así que el bloqueo que sostiene el aviso de trabajo sin guardar **no llegaba
 * a dispararse**. `CU-47` promete ese aviso «en los dos abandonos», y el menú
 * lateral es uno de los dos.
 *
 * Por eso se prueba **contra el `NavList` de granito** y no contra un doble: lo
 * que fallaba era justamente que el enlace era un enlace.
 */

/**
 * La sesión se sustituye porque la barra de usuario la pide y acá no se prueba:
 * lo que importa es que el `Frame` de verdad esté en el medio.
 */
vi.mock('@ope/session', () => ({
  useSession: () => ({ claims: { name: 'Ana Operadora' }, capabilities: new Set<string>() }),
  useSessionControl: () => ({ signOut: () => {}, reenter: () => {} }),
}))

afterEach(cleanup)

function Nada() {
  return null
}

/** Una pantalla con algo escrito, para el aviso. */
function Form() {
  const [typed, setTyped] = useState('')
  useUnsavedWork(typed !== '')
  return <input aria-label="dato" value={typed} onChange={(e) => setTyped(e.target.value)} />
}

function Where() {
  const { pathname, state } = useLocation()
  return (
    <>
      <span data-testid="donde">{pathname}</span>
      <span data-testid="pila">
        {JSON.stringify(
          (state as Record<string, { stack: { screen: string }[] } | undefined>)?.[
            FLOW_KEY
          ]?.stack.map((each) => each.screen) ?? null,
        )}
      </span>
      <Form />
    </>
  )
}

const home = defineScreen({ id: 'home', title: 'Inicio', path: '/', component: Nada })
const articles = defineScreen({
  id: 'articles',
  title: 'Catálogo',
  path: '/catalog',
  component: Where,
})
const article = defineScreen({
  id: 'article',
  title: 'Artículo',
  path: '/catalog/:id',
  component: Where,
})

const chose = outcome<{ id: string }>('catalog.chose')

const homeFlow = defineFlow({ id: 'home', root: home, steps: [] })
const catalogFlow = defineFlow({
  id: 'catalog',
  root: articles,
  steps: [opens(chose, article, ({ id }) => ({ id }))],
})

/**
 * Se monta **la aplicación de verdad**, con un chrome que dibuja el `NavList`
 * con lo que el marco le pasa. Si el marco no arma el manejador, o el chrome no
 * lo reenvía, acá no llega — que son las dos formas en que esto ya se rompió.
 */
function mount() {
  const application = createApplication(
    {
      name: 'demo',
      screens: [home, articles, article],
      flows: [homeFlow, catalogFlow],
      /* Plano a propósito: dentro de un grupo el ítem va `hidden` hasta que
         alguien lo despliega, y lo que se prueba acá es la navegación. */
      menu: [homeFlow, catalogFlow],
      featureRootOf: { home: 'home', articles: 'articles', article: 'articles' },
      outcomesOf: { home: [], articles: [chose.id] },
      outcomes: [chose],
      toCapabilities: () => new Set<string>(),
      systems: [],
    },
    /* **El `Frame` de verdad**, y no un doble que dibuje el `NavList` por su
       cuenta: el defecto vivía justamente en que `Frame` no le pasaba el
       manejador. Una prueba que arma el menú por su lado no lo habría visto. */
    (props) => <Frame {...props} />,
  )

  render(
    <PreferencesProvider subject="quien" preferences={[]}>
      <NoticesProvider>
        <FlowProvider value={application.wiring}>
          <AuthorizationProvider capabilities={new Set<string>()} forbidden={null}>
            <RouterProvider router={application.router} />
          </AuthorizationProvider>
        </FlowProvider>
      </NoticesProvider>
    </PreferencesProvider>,
  )

  return application
}

/** El ítem del flujo, que granito dibuja como enlace. */
const itemFor = (label: string) => dom.getByRole('link', { name: label })

describe('un clic en el menú lateral', () => {
  it('navega del lado del cliente, y no recarga', async () => {
    /* La prueba de que no recarga es que el ruteador se movió: sin
       `preventDefault`, jsdom se come la navegación del `<a>` y el ruteador
       se queda donde estaba. */
    const application = mount()
    /* Dentro de `act`: si no, el dibujo de la navegación se descarga en el
       evento siguiente y remonta la pantalla — que fue exactamente cómo esta
       prueba se mintió a sí misma la primera vez. */
    await act(async () => {
      await application.router.navigate('/catalog/7')
    })

    fireEvent.click(itemFor('Catálogo'))

    expect(dom.getByTestId('donde').textContent).toBe('/catalog')
  })

  it('abandona el flujo: la pila queda con la raíz del nuevo, y nada más', async () => {
    /* Es la otra mitad de `CU-47`. El menú de usuario apila; el lateral
       abandona, y esa es la única diferencia entre los dos. */
    const application = mount()
    /* Dentro de `act`: si no, el dibujo de la navegación se descarga en el
       evento siguiente y remonta la pantalla — que fue exactamente cómo esta
       prueba se mintió a sí misma la primera vez. */
    await act(async () => {
      await application.router.navigate('/catalog/7')
    })

    fireEvent.click(itemFor('Catálogo'))

    expect(dom.getByTestId('pila').textContent).toBe(JSON.stringify(['articles']))
  })

  it('y con trabajo sin guardar, pregunta antes de descartarlo', async () => {
    /* La garantía que `CU-47` declara y que este camino no cumplía. Con la
       recarga no había forma: el aviso lo sostiene el ruteador, y el navegador
       se llevaba la página antes de que el ruteador se enterara. */
    const application = mount()
    /* Dentro de `act`: si no, el dibujo de la navegación se descarga en el
       evento siguiente y remonta la pantalla — que fue exactamente cómo esta
       prueba se mintió a sí misma la primera vez. */
    await act(async () => {
      await application.router.navigate('/catalog/7')
    })

    fireEvent.change(dom.getByLabelText('dato'), { target: { value: 'algo' } })
    fireEvent.click(itemFor('Catálogo'))

    expect(dom.getByRole('dialog')).toBeDefined()
    /* Y no se movió: el aviso pregunta, no informa. */
    expect(dom.getByTestId('donde').textContent).toBe('/catalog/7')
  })
  it('y cancela el enlace, que es lo que evita la recarga', async () => {
    /* **Esta prueba existe porque jsdom no puede ver el defecto.**
       Acá no hay navegación de verdad: sacar el `preventDefault` deja pasar
       las otras tres, porque el ruteador igual se mueve y la recarga que en un
       navegador se lleva todo, en jsdom no ocurre.

       Así que se afirma lo único observable: que el clic quedó cancelado.
       `dispatchEvent` devuelve `false` cuando alguien llamó a `preventDefault`. */
    const application = mount()
    await act(async () => {
      await application.router.navigate('/catalog/7')
    })

    expect(fireEvent.click(itemFor('Catálogo'))).toBe(false)
  })
})
