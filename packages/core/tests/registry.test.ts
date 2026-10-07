import { describe, expect, it } from 'vitest'
import { buildUrl } from '../src/base/go-to'
import { createRegistry, defineScreen, isVisible } from '../src/base/registry'

const Nada = () => null

describe('el registro de pantallas', () => {
  it('falla al construir si dos pantallas declaran la misma ruta', () => {
    const a = defineScreen({ id: 'uno', title: 'Uno', path: '/catalog', component: Nada })
    const b = defineScreen({ id: 'dos', title: 'Dos', path: '/catalog', component: Nada })

    /* No elige una en silencio: el ganador dependería del orden en que se
       juntaron las funcionalidades, y ése es el defecto que aparece meses
       después y en una sola máquina. */
    expect(() => createRegistry([a, b])).toThrow(/misma ruta "\/catalog".*uno.*dos/s)
  })

  it('deja pasar rutas distintas', () => {
    const a = defineScreen({ id: 'uno', title: 'Uno', path: '/catalog', component: Nada })
    const b = defineScreen({
      id: 'dos',
      title: 'Dos',
      path: '/catalog/:id',
      component: Nada,
    })
    expect(createRegistry([a, b])).toHaveLength(2)
  })
})

describe('el filtrado por capacidad', () => {
  const conCapacidad = defineScreen({
    id: 'x',
    title: 'X',
    path: '/x',
    capability: 'catalog:read',
    component: Nada,
  })
  const sinCapacidad = defineScreen({ id: 'y', title: 'Y', path: '/y', component: Nada })

  it('esconde lo que la sesión no habilita', () => {
    expect(isVisible(conCapacidad, new Set())).toBe(false)
    expect(isVisible(conCapacidad, new Set(['catalog:read']))).toBe(true)
  })

  it('una pantalla sin capacidad declarada la ve cualquier sesión', () => {
    expect(isVisible(sinCapacidad, new Set())).toBe(true)
  })
})

describe('armar la URL', () => {
  const detalle = defineScreen({
    id: 'detalle',
    title: 'Detalle',
    path: '/companies/:id/statement',
    component: Nada,
  })

  it('reemplaza los parámetros', () => {
    expect(buildUrl(detalle, { id: '1234' })).toBe('/companies/1234/statement')
  })

  it('escapa lo que podría romper la URL', () => {
    expect(buildUrl(detalle, { id: 'a/b' })).toBe('/companies/a%2Fb/statement')
  })

  it('falla si falta un parámetro, en vez de dejar el :nombre crudo', () => {
    /* Una URL con `:id` adentro no da 404: da una pantalla que busca un
       registro llamado ":id" y muestra un error de datos, que manda a buscar
       el problema donde no está. */
    const sinParametro = {} as { id: string }
    expect(() => buildUrl(detalle, sinParametro)).toThrow(/Falta el parámetro "id"/)
  })
})
