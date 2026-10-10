import type { MessageConstraints } from '@ope/core'
import {
  CONSTRAINTS,
  type Merchant,
  type MerchantContact,
  type MerchantProfileInput,
} from '../../../api/ope/client'

/**
 * **La identidad de un merchant, como la escribe un formulario** (feature 007,
 * `ADR-045`): siete campos planos —el contacto con el prefijo `contact.`, que
 * es lo que `fieldNameOf` da para `/body/contact/email`—, armados como el
 * cuerpo entero al enviar. Lo que el contrato exige sale emitido (`CU-38`,
 * capa 1): nada de esto se escribe dos veces.
 */

const CONTACT = 'contact.'
const CONTACT_FIELDS = Object.keys(CONSTRAINTS.MerchantContact.fields).map((each) => CONTACT + each)

export const IDENTITY_FIELDS = [
  'displayName',
  'storeUrl',
  ...CONTACT_FIELDS,
  'notes',
] as const satisfies readonly string[]

export type IdentityValues = Record<string, string>

/** Si algún campo del contacto tiene algo que no es espacio: entonces hay contacto. */
const hasContact = (values: IdentityValues): boolean =>
  CONTACT_FIELDS.some((each) => (values[each] ?? '').trim() !== '')

/**
 * Lo que el contrato le exige a la identidad, **en función de lo escrito**: los
 * campos de `MerchantProfileInput` menos `contact` (que es un objeto), los de
 * `MerchantContact` con el prefijo, y «si hay contacto, nombre y email van» como
 * capa 1 —la regla que `required` del esquema anidado dice y que un formulario
 * plano sólo puede aplicar mirando los valores—.
 */
export function identityConstraints(values: IdentityValues): MessageConstraints {
  const { contact: _nested, ...own } = CONSTRAINTS.MerchantProfileInput.fields
  const contactFields = Object.fromEntries(
    Object.entries(CONSTRAINTS.MerchantContact.fields).map(([name, each]) => [
      CONTACT + name,
      each,
    ]),
  )
  const contactRequired = hasContact(values)
    ? CONSTRAINTS.MerchantContact.required.map((each) => CONTACT + each)
    : []
  return {
    required: [...CONSTRAINTS.MerchantProfileInput.required, ...contactRequired],
    fields: { ...own, ...contactFields },
  }
}

/** Las de otro cuerpo que lleva la identidad adentro (el alta), con las suyas. */
export function withIdentity(base: MessageConstraints, values: IdentityValues): MessageConstraints {
  const identity = identityConstraints(values)
  const { contact: _nested, displayName: _name, ...rest } = base.fields
  return {
    required: [...new Set([...base.required, ...identity.required])],
    fields: { ...rest, ...identity.fields },
  }
}

/** Un valor del formulario, o nada: lo vacío **no se manda** (ausente es vacío, `ADR-045`). */
const given = (values: IdentityValues, name: string): string | undefined => {
  const value = values[name] ?? ''
  return value === '' ? undefined : value
}

/**
 * El cuerpo entero, **como se escribió**: nada se recorta —lo que el esquema no
 * dice, el servidor lo dice en el campo— y lo vacío no viaja. El contacto va
 * sólo si tiene nombre o email; con uno solo, la capa 1 ya no dejó llegar acá.
 */
export function profileBodyOf(values: IdentityValues): MerchantProfileInput {
  const storeUrl = given(values, 'storeUrl')
  const notes = given(values, 'notes')
  const contact = hasContact(values) ? contactOf(values) : undefined
  return {
    displayName: values.displayName ?? '',
    ...(storeUrl === undefined ? {} : { storeUrl }),
    ...(contact === undefined ? {} : { contact }),
    ...(notes === undefined ? {} : { notes }),
  }
}

function contactOf(values: IdentityValues): MerchantContact {
  const phone = given(values, `${CONTACT}phone`)
  const role = given(values, `${CONTACT}role`)
  return {
    name: values[`${CONTACT}name`] ?? '',
    email: values[`${CONTACT}email`] ?? '',
    ...(phone === undefined ? {} : { phone }),
    ...(role === undefined ? {} : { role }),
  }
}

/** La precarga de la edición: lo que el merchant tiene, y `''` donde no tiene. */
export function identityValuesOf(merchant?: Merchant): IdentityValues {
  return {
    displayName: merchant?.displayName ?? '',
    storeUrl: merchant?.storeUrl ?? '',
    [`${CONTACT}name`]: merchant?.contact?.name ?? '',
    [`${CONTACT}email`]: merchant?.contact?.email ?? '',
    [`${CONTACT}phone`]: merchant?.contact?.phone ?? '',
    [`${CONTACT}role`]: merchant?.contact?.role ?? '',
    notes: merchant?.notes ?? '',
  }
}
