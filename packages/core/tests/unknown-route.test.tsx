// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createApplication } from '../src/app/create-application'
import { defineFlow } from '../src/base/flow'
import { defineScreen } from '../src/base/registry'

/**
 * **Una URL que no existe cae adentro del marco** (`CU-30`, `CU-23`).
 *
 * Se prueba la **estructura** y no lo dibujado, porque lo que se rompe es dónde
 * cuelga la ruta: como hermana de la del marco, la aplicación queda en blanco y
 * el operador sin navegación; como hija, el menú sigue ahí. Las dos formas
 * «andan» —las dos muestran algo— y sólo una deja salir.
 *
 * Y pasa más de lo que parece: un enlace viejo, un favorito de una ruta que se
 * renombró, un dedazo en la barra.
 */

function Nada() {
  return null
}

const home = defineScreen({ id: 'home', title: 'Inicio', path: '/', component: Nada })
const catalog = defineScreen({
  id: 'catalog',
  title: 'Catálogo',
  path: '/catalog',
  component: Nada,
})

/**
 * Las dos pantallas necesitan su flujo: desde `CU-47` **una pantalla que ningún
 * flujo alcanza hace fallar el arranque**, y eso vale también acá. Que una
 * prueba tenga que declararlos es la comprobación funcionando, no un estorbo.
 */
const app = () =>
  createApplication(
    {
      name: 'demo',
      screens: [home, catalog],
      flows: [
        defineFlow({ id: 'home', root: home, steps: [] }),
        defineFlow({ id: 'catalog', root: catalog, steps: [] }),
      ],
      featureRootOf: { home: 'home', catalog: 'catalog' },
      outcomesOf: {},
      toCapabilities: () => new Set<string>(),
      systems: [],
    },
    () => null,
  )

describe('una URL que ninguna pantalla declara', () => {
  it('tiene ruta propia: no queda librada al ruteador', () => {
    /* Sin ella se ve el error de React Router — en inglés, y para un
       desarrollador. En el mostrador de una farmacia no le dice nada a nadie. */
    const { router } = app()
    const children = router.routes[0]?.children ?? []

    expect(children.some((each) => each.path === '*')).toBe(true)
  })

  it('y cuelga **del marco**, no al lado', () => {
    /* Es toda la diferencia: hermana deja la pantalla en blanco y sin salida. */
    const { router } = app()

    expect(router.routes).toHaveLength(1)
    expect(router.routes[0]?.path).toBe('/')
  })

  it('no se come las rutas declaradas', () => {
    /* Un comodín mal ubicado atrapa todo y ninguna pantalla se ve nunca. */
    const { router } = app()
    const children = router.routes[0]?.children ?? []

    expect(children.some((each) => each.path === 'catalog')).toBe(true)
    expect(children.some((each) => each.index)).toBe(true)
  })
})
