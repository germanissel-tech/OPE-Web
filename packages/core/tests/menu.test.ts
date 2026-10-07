import { describe, expect, it } from 'vitest'
import { defineFlow, group } from '../src/base/flow'
import { defineScreen } from '../src/base/registry'
import { verifyFlows } from '../src/base/verify-flows'
import { buildMenu } from '../src/ui/menu'

/**
 * **El menú lateral se declara** (`CU-48`).
 *
 * Lo que se prueba es lo que la forma nueva tiene que garantizar y la vieja no
 * podía: **el orden es el de la lista**, un grupo lleva su icono, y lo que no
 * está en la lista no se ofrece.
 */

const Nada = () => null

const screen = (id: string, capability?: string) =>
  defineScreen({ id, title: id, path: `/${id}`, capability, component: Nada })

const flow = (id: string, capability?: string) =>
  defineFlow({ id, root: screen(id, capability), steps: [] })

const home = flow('home')
const catalog = flow('catalog')
const suppliers = flow('suppliers', 'suppliers:read')
const invoicing = flow('invoicing')

const todo = new Set(['suppliers:read'])
const labels = (items: readonly { label: string }[]) => items.map((each) => each.label)

describe('el orden es el de la lista, y nada más', () => {
  it('respeta el orden declarado, sueltos y grupos mezclados', () => {
    /* Antes salía del orden de los flujos: mover uno reordenaba el menú, en
       silencio. Acá el orden **es** la declaración. */
    const menu = buildMenu(
      [group('Operación', [invoicing]), home, group('Maestros', [catalog, suppliers])],
      todo,
    )

    expect(labels(menu)).toEqual(['Operación', 'home', 'Maestros'])
  })

  it('y el de adentro de cada grupo también', () => {
    const menu = buildMenu([group('Maestros', [suppliers, catalog])], todo)

    expect(labels(menu[0]?.children ?? [])).toEqual(['suppliers', 'catalog'])
  })
})

describe('lo que no está en la lista, no se ofrece', () => {
  it('un flujo que no figura simplemente no aparece', () => {
    /* Es lo que reemplaza a `inMenu: false`: la presencia es la declaración. */
    const menu = buildMenu([home], todo)

    expect(labels(menu)).toEqual(['home'])
  })
})

describe('los iconos son opcionales en los dos', () => {
  it('un grupo sin icono se dibuja igual', () => {
    const menu = buildMenu([group('Maestros', [catalog])], todo)

    expect(menu[0]?.icon).toBeUndefined()
    expect(menu[0]?.label).toBe('Maestros')
  })
})

describe('un grupo sin ningún ítem visible desaparece', () => {
  it('no deja el encabezado colgado', () => {
    /* Un grupo vacío parece un error de carga, y a quien tiene menos permisos
       le muestra la forma de lo que no puede hacer (`CU-3`). */
    const menu = buildMenu([home, group('Maestros', [suppliers])], new Set<string>())

    expect(labels(menu)).toEqual(['home'])
  })

  it('pero con uno visible se dibuja, y sólo con ése', () => {
    const menu = buildMenu([group('Maestros', [catalog, suppliers])], new Set<string>())

    expect(labels(menu[0]?.children ?? [])).toEqual(['catalog'])
  })
})

describe('lo que no arranca', () => {
  const base = {
    flows: [home, catalog],
    screens: [home.root, catalog.root],
    featureRootOf: { home: 'home', catalog: 'catalog' },
    outcomesOf: {},
    outcomes: [],
  }

  it('un flujo listado dos veces', () => {
    /* Cuál gana dependería del orden, y ése es el defecto que aparece meses
       después y en una sola máquina. */
    const problems = verifyFlows({ ...base, menu: [home, group('Maestros', [catalog, home])] })

    expect(problems.join(' ')).toContain('dos veces en el menú')
  })

  it('un grupo declarado y vacío', () => {
    const problems = verifyFlows({ ...base, menu: [home, catalog, group('Maestros', [])] })

    expect(problems.join(' ')).toContain('no tiene ningún flujo')
  })

  it('y lo sano no dice nada', () => {
    expect(verifyFlows({ ...base, menu: [home, group('Maestros', [catalog])] })).toEqual([])
  })
})
