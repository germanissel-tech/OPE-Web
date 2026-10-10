import { Alert, Checkbox, Field, Section, TextArea } from '@granito/ui'
import type { Form } from '@ope/core'
import { useEffect, useRef } from 'react'
import { sharedStrings } from './strings'

/**
 * **La versión correctiva y su motivo** (feature 008, research §10).
 *
 * Con un experimento activo que el cambio alcanza, el backend sólo acepta una
 * versión correctiva, con su motivo, y reinicia la medición. La pantalla no lo
 * puede saber antes de intentar: lo sabe con el \`409\`, y entonces esta sección
 * pasa a decir por qué y marca la correctiva sola. El operador también la puede
 * marcar desde el principio.
 *
 * El motivo es un campo del mismo cuerpo, y por eso vive en el formulario y no
 * en un diálogo: un \`422\` sobre él cae acá (\`GR-37\`).
 */
export function CorrectiveSection({
  form,
  required,
  frozen,
}: {
  readonly form: Form<Readonly<Record<string, string>>>
  readonly required: boolean
  /** El backend dijo que hay una medición en curso. */
  readonly frozen: boolean
}) {
  const corrective = form.values['corrective'] === 'true'
  /* **El motivo, a la vista cuando el 409 lo pide.** La sección va arriba del
     formulario y el operador publicó desde el pie: sin esto la pantalla cambia
     de modo fuera de la vista y el único rastro es el aviso. Enfocarlo trae el
     campo a la pantalla, y es justo lo que hay que escribir. */
  const reason = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (frozen) reason.current?.focus()
  }, [frozen])
  return (
    <Section title={sharedStrings.correctiveSection} why={sharedStrings.correctiveWhy}>
      {frozen ? (
        <Alert severity="warning" title={sharedStrings.frozenTitle}>
          {sharedStrings.frozenDetail}
        </Alert>
      ) : null}
      <Field label={sharedStrings.correctiveSection} size="fill">
        {(props) => (
          <Checkbox
            {...props}
            label={sharedStrings.correctiveMark}
            checked={corrective}
            onChange={(event) => form.set('corrective', String(event.target.checked))}
          />
        )}
      </Field>
      {corrective ? (
        <Field
          label={sharedStrings.reasonLabel}
          size="fill"
          required={required}
          help={sharedStrings.reasonHelp}
          error={form.errorOf('reason')}
        >
          {(props) => (
            <TextArea
              {...props}
              ref={reason}
              value={form.values['reason'] ?? ''}
              onChange={(event) => form.set('reason', event.target.value)}
              onBlur={() => form.blur('reason')}
            />
          )}
        </Field>
      ) : null}
    </Section>
  )
}
