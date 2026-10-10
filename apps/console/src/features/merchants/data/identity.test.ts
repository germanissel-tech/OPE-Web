import { describe, expect, it } from 'vitest'
import {
  IDENTITY_FIELDS,
  identityConstraints,
  identityValuesOf,
  profileBodyOf,
  withIdentity,
} from './identity'
import type { Merchant } from './merchants'

/**
 * **La identidad viaja como se escribió, y lo vacío no viaja** (`ADR-045`); las
 * restricciones salen emitidas y «si hay contacto, nombre y email van» es capa 1.
 */

const empty = identityValuesOf()

describe('identityConstraints', () => {
  it('trae los siete campos del contrato, con el contacto prefijado y sus largos', () => {
    const constraints = identityConstraints(empty)
    expect(Object.keys(constraints.fields).sort()).toEqual([...IDENTITY_FIELDS].sort())
    expect(constraints.fields.displayName?.maxLength).toBe(120)
    expect(constraints.fields['contact.email']?.format).toBe('email')
    expect(constraints.fields.storeUrl?.pattern).toBe('^https?://')
    expect(constraints.required).toEqual(['displayName'])
  })

  it('con algo en el contacto, nombre y email pasan a ser obligatorios', () => {
    const constraints = identityConstraints({ ...empty, 'contact.phone': '555' })
    expect(constraints.required).toEqual(['displayName', 'contact.name', 'contact.email'])
    /* Un espacio no es algo. */
    expect(identityConstraints({ ...empty, 'contact.name': '  ' }).required).toEqual([
      'displayName',
    ])
  })

  it('withIdentity suma las suyas a las de otro cuerpo sin repetir', () => {
    const base = {
      required: ['origins', 'signature', 'displayName'],
      fields: { origins: { type: 'array' }, signature: { type: 'boolean' } },
    }
    const merged = withIdentity(base, { ...empty, 'contact.name': 'Ana' })
    expect(merged.required).toEqual([
      'origins',
      'signature',
      'displayName',
      'contact.name',
      'contact.email',
    ])
    expect(Object.keys(merged.fields)).toContain('origins')
    expect(Object.keys(merged.fields)).toContain('contact.role')
  })
})

describe('profileBodyOf', () => {
  it('manda sólo lo que tiene algo, y el contacto sólo con nombre o email', () => {
    expect(profileBodyOf({ ...empty, displayName: 'Tienda' })).toEqual({ displayName: 'Tienda' })
    expect(
      profileBodyOf({
        ...empty,
        displayName: 'Tienda',
        storeUrl: 'https://t.example',
        'contact.name': 'Ana',
        'contact.email': 'ana@t.example',
        'contact.role': 'owner',
        notes: 'x',
      }),
    ).toEqual({
      displayName: 'Tienda',
      storeUrl: 'https://t.example',
      contact: { name: 'Ana', email: 'ana@t.example', role: 'owner' },
      notes: 'x',
    })
  })

  it('no recorta nada: un espacio en el borde viaja, y el servidor lo dirá en el campo', () => {
    expect(
      profileBodyOf({ ...empty, displayName: ' Tienda ', storeUrl: ' https://t.example' }),
    ).toEqual({
      displayName: ' Tienda ',
      storeUrl: ' https://t.example',
    })
  })
})

describe('identityValuesOf', () => {
  it('precarga lo que el merchant tiene y deja vacío lo que no', () => {
    const merchant: Merchant = {
      merchantId: 'm',
      status: 'active',
      origins: [],
      createdAt: '2026-10-09T00:00:00Z',
      credentials: [],
      displayName: 'Tienda',
      contact: { name: 'Ana', email: 'ana@t.example' },
    }
    expect(identityValuesOf(merchant)).toEqual({
      displayName: 'Tienda',
      storeUrl: '',
      'contact.name': 'Ana',
      'contact.email': 'ana@t.example',
      'contact.phone': '',
      'contact.role': '',
      notes: '',
    })
    expect(Object.values(identityValuesOf()).every((each) => each === '')).toBe(true)
  })
})
