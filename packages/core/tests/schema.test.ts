import { describe, expect, it } from 'vitest'
import { baseSchema } from '../src/base/config'
import { mapOf, milliseconds, parse, text, url } from '../src/base/schema'

const completa = {
  issuer: 'http://localhost:8080/realms/siempre',
  clientId: 'cuarzo-esqueleto',
  systems: { 'las-animas': 'http://localhost:4010' },
  waitThresholdMs: 60000,
}

describe('el esquema de configuración', () => {
  it('acepta una configuración completa y devuelve sus valores', () => {
    const read = parse(baseSchema, completa)
    expect(read.ok).toBe(true)
    if (read.ok) expect(read.value.clientId).toBe('cuarzo-esqueleto')
  })

  it('informa TODOS los faltantes de una vez, no el primero', () => {
    /* Descubrirlos de a uno son cuatro despliegues para enterarse de cuatro
       cosas. Es la propiedad que `CU-17` compra. */
    const read = parse(baseSchema, {})
    expect(read.ok).toBe(false)
    if (!read.ok) expect(read.missing).toHaveLength(4)
  })

  it('dice cuál falta, con su nombre', () => {
    const read = parse(baseSchema, { ...completa, clientId: '' })
    expect(read.ok).toBe(false)
    if (!read.ok) expect(read.missing.join()).toMatch(/clientId/)
  })

  it('señala la entrada exacta de un mapa, no el mapa entero', () => {
    const read = parse(baseSchema, {
      ...completa,
      systems: { 'las-animas': 'http://localhost:4010', centinela: 'no-es-una-url' },
    })
    expect(read.ok).toBe(false)
    if (!read.ok) expect(read.missing.join()).toMatch(/systems\.centinela/)
  })

  it('rechaza un mapa de sistemas vacío, y dice qué se pierde', () => {
    const read = parse(baseSchema, { ...completa, systems: {} })
    expect(read.ok).toBe(false)
    if (!read.ok) expect(read.missing.join()).toMatch(/vacío.*a quién preguntarle/)
  })
})

describe('los campos', () => {
  it('un texto en blanco no es un texto', () => {
    expect(text('   ', 'x').ok).toBe(false)
  })

  it('una URL sin protocolo no pasa, aunque `new URL` no falle', () => {
    /* `new URL('localhost:4010')` la lee como un protocolo llamado `localhost`.
       Sin exigir http o https, el error de tipeo más común pasa entero. */
    expect(url('localhost:4010', 'x').ok).toBe(false)
    expect(url('http://localhost:4010', 'x').ok).toBe(true)
  })

  it('un umbral tiene que ser un número positivo', () => {
    expect(milliseconds(0, 'x').ok).toBe(false)
    expect(milliseconds(-1, 'x').ok).toBe(false)
    expect(milliseconds('60000', 'x').ok).toBe(false)
    expect(milliseconds(60000, 'x').ok).toBe(true)
  })

  it('un mapa junta los motivos de todas sus entradas', () => {
    const read = mapOf(url)({ a: 'no', b: 'tampoco' }, 'sistemas')
    expect(read.ok).toBe(false)
    if (!read.ok) expect(read.missing).toHaveLength(2)
  })
})

describe('un campo que se agrega al esquema', () => {
  it('no se puede declarar sin validarlo: el valor sale de su campo', () => {
    /* Es lo que la validación escrita a mano no aseguraba. Con un campo nuevo
       en el esquema, la configuración que no lo trae **no pasa**; antes el tipo
       obligaba a producir un valor y `String(algo)` daba `'undefined'`. */
    const schema = { ...baseSchema, notificationsUrl: url }

    const read = parse(schema, completa)
    expect(read.ok).toBe(false)
    if (!read.ok) expect(read.missing.join()).toMatch(/notificationsUrl/)
  })
})
