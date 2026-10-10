import { Field, Section, TextArea, TextInput } from '@granito/ui'
import type { Form, MessageConstraints } from '@ope/core'
import type { IdentityValues } from '../data/identity'
import { merchantsStrings } from '../strings'

/**
 * **Los siete campos de la identidad**, en tres secciones: nombre y URL, el
 * contacto, las notas. Los comparten el alta y la edición (feature 007,
 * `ADR-045`); cada uno dibuja su rótulo, su obligatoriedad —que sale de las
 * restricciones, incluida la condicional del contacto— y su error, local o del
 * servidor. Las notas son un `TextArea`: texto plano de varios renglones.
 */
export function IdentityFields({
  form,
  constraints,
  why = merchantsStrings.identityWhy,
}: {
  readonly form: Form<IdentityValues>
  readonly constraints: MessageConstraints
  /** Lo que la primera sección explica: el alta dice qué es; la edición, que se guarda entera. */
  readonly why?: string
}) {
  const required = (name: string) => constraints.required.includes(name)
  const text = (name: string, label: string, size: 'medium' | 'short') => (
    <Field label={label} size={size} required={required(name)} error={form.errorOf(name)}>
      {(props) => (
        <TextInput
          {...props}
          value={form.values[name] ?? ''}
          onChange={(event) => form.set(name, event.target.value)}
          onBlur={() => form.blur(name)}
        />
      )}
    </Field>
  )

  return (
    <>
      <Section title={merchantsStrings.identitySection} why={why}>
        {text('displayName', merchantsStrings.name, 'medium')}
        {text('storeUrl', merchantsStrings.storeUrl, 'medium')}
      </Section>

      <Section title={merchantsStrings.contact} why={merchantsStrings.contactWhy} columns={2}>
        {text('contact.name', merchantsStrings.contactName, 'medium')}
        {text('contact.email', merchantsStrings.contactEmail, 'medium')}
        {text('contact.phone', merchantsStrings.contactPhone, 'short')}
        {text('contact.role', merchantsStrings.contactRole, 'medium')}
      </Section>

      <Section title={merchantsStrings.notes} why={merchantsStrings.notesWhy}>
        <Field
          label={merchantsStrings.notes}
          size="fill"
          required={required('notes')}
          error={form.errorOf('notes')}
        >
          {(props) => (
            <TextArea
              {...props}
              value={form.values.notes ?? ''}
              onChange={(event) => form.set('notes', event.target.value)}
              onBlur={() => form.blur('notes')}
            />
          )}
        </Field>
      </Section>
    </>
  )
}
