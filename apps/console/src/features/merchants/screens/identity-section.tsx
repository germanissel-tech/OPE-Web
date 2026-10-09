import { Field, Section, Value } from '@granito/ui'
import { hasIdentity, type Merchant } from '../data/merchants'
import { merchantsStrings } from '../strings'

/**
 * **La identidad del merchant, en la ficha** (feature 007, `ADR-045`): nombre,
 * URL de la tienda, contacto y notas — **lo que tiene y sólo eso**. Es de la
 * relación comercial, no de la operación, y por eso es una sección aparte de
 * «Merchant», antes de ella.
 *
 * La URL es un ancla dentro de `Value`: un enlace que abre en otra pestaña es
 * semántica HTML, no estilo (principio IV); granito no tiene `Link`, y si al
 * mirarlo no compone, es una propuesta. Un merchant sin identidad —creado antes
 * de la 041 y nunca editado— dibuja un solo campo que lo dice, **sin inventar
 * un nombre**.
 */
export function IdentitySection({ merchant }: { readonly merchant: Merchant }) {
  if (!hasIdentity(merchant)) {
    return (
      <Section title={merchantsStrings.identitySection}>
        <Field label={merchantsStrings.name} size="fill">
          {() => <Value>{merchantsStrings.noIdentity}</Value>}
        </Field>
      </Section>
    )
  }

  const { displayName, storeUrl, contact, notes } = merchant
  return (
    <Section title={merchantsStrings.identitySection} columns={2}>
      {displayName === undefined ? null : (
        <Field label={merchantsStrings.name} size="medium">
          {() => <Value>{displayName}</Value>}
        </Field>
      )}
      {storeUrl === undefined ? null : (
        <Field label={merchantsStrings.storeUrl} size="medium">
          {() => (
            <Value>
              <a href={storeUrl} target="_blank" rel="noreferrer">
                {storeUrl}
              </a>
            </Value>
          )}
        </Field>
      )}
      {contact === undefined ? null : (
        <>
          <Field label={merchantsStrings.contactName} size="medium">
            {() => <Value>{contact.name}</Value>}
          </Field>
          <Field label={merchantsStrings.contactEmail} size="medium">
            {() => <Value>{contact.email}</Value>}
          </Field>
          {contact.phone === undefined ? null : (
            <Field label={merchantsStrings.contactPhone} size="short">
              {() => <Value>{contact.phone}</Value>}
            </Field>
          )}
          {contact.role === undefined ? null : (
            <Field label={merchantsStrings.contactRole} size="medium">
              {() => <Value>{contact.role}</Value>}
            </Field>
          )}
        </>
      )}
      {notes === undefined ? null : (
        <Field label={merchantsStrings.notes} size="fill">
          {() => <Value>{notes}</Value>}
        </Field>
      )}
    </Section>
  )
}
