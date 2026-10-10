import { Alert, Button, Form } from '@granito/ui'
import {
  type Action,
  type Form as FormState,
  type MessageConstraints,
  type Operations,
  useAction,
  useForm,
  useUnsavedWork,
} from '@ope/core'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { CorrectiveSection } from '../../../components/corrective-section'
import type { PublishLevelInput } from '../data/levels'
import type { Shown } from '../data/treatment-form'
import { configurationStrings } from '../strings'

type Values = Readonly<Record<string, string>>

/**
 * **Publicar una versión de un nivel global** (feature 008, escenario 4): lo
 * común a la plataforma y a los defaults.
 *
 * Todo precargado con lo que rige; un `409 configuration-frozen` deja la
 * pantalla en modo correctivo con lo cargado (research §10); un `422` cae en
 * su campo, o al pie si es de algo que la pantalla no edita. Lo que cambia
 * entre los dos niveles —qué se edita y cómo se arma el cuerpo— llega de
 * afuera.
 */
export function PublishLevelForm<Body, Output, Ops extends Operations>({
  action: definition,
  initial,
  inForce,
  constraintsOf,
  bodyOf,
  onPublished,
  onCancel,
  children,
}: {
  readonly action: Action<PublishLevelInput<Body>, Output, Ops>
  /** La precarga y en qué unidad quedó cada número: se calculan una vez, al abrir. */
  readonly initial: { readonly values: Values; readonly shown: Shown }
  /** El nombre de la versión que rige al abrir: con él se sabe si no cambió nada. */
  readonly inForce: string
  readonly constraintsOf: (values: Values, shown: Shown) => MessageConstraints
  readonly bodyOf: (values: Values, shown: Shown) => Body
  readonly onPublished: () => void
  readonly onCancel: () => void
  /** Los campos, con el formulario y lo que se exige ya armados. */
  readonly children: (form: FormState<Values>, constraints: MessageConstraints) => ReactNode
}) {
  const { shown } = initial
  const [frozen, setFrozen] = useState(false)
  const [rejected, setRejected] = useState<string | undefined>(undefined)
  /* Publicada, y recién en el dibujo siguiente se sale: el marco tiene que
     enterarse antes de que ya no hay cambios sin guardar. El porqué completo,
     en la publicación del merchant. */
  const [published, setPublished] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const action = useAction(definition, {
    onDone: () => setPublished(true),
    onRejected: (failed) => {
      if (failed.type === 'configuration-frozen') {
        setFrozen(true)
        form.set('corrective', 'true')
        return
      }
      setRejected(failed.errors.length === 0 ? failed.message : undefined)
    },
  })
  const form = useForm<Values>(
    initial.values,
    (values) => constraintsOf(values, shown),
    configurationStrings.shape,
    action.fields,
  )
  const constraints = constraintsOf(form.values, shown)
  useUnsavedWork(!published && JSON.stringify(form.values) !== JSON.stringify(initial.values))
  useEffect(() => {
    if (published) setLeaving(true)
  }, [published])
  /* Por una referencia y no como dependencia: quien llama pasa una función
     nueva en cada dibujo, y salir dos veces apilaría la vista dos veces. */
  const leave = useRef(onPublished)
  leave.current = onPublished
  useEffect(() => {
    if (leaving) leave.current()
  }, [leaving])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setRejected(undefined)
    if (!form.attempt()) return
    void action.run({ body: bodyOf(form.values, shown), inForce })
  }

  return (
    <Form
      onSubmit={submit}
      saving={action.running}
      note={
        rejected ? (
          <Alert severity="warning" title={configurationStrings.rejectedTitle}>
            {rejected}
          </Alert>
        ) : undefined
      }
      actions={
        <>
          <Button type="button" onClick={onCancel}>
            {configurationStrings.cancel}
          </Button>
          <Button type="submit" tone="primary" disabled={action.running}>
            {configurationStrings.publish}
          </Button>
        </>
      }
    >
      <CorrectiveSection
        form={form}
        required={constraints.required.includes('reason')}
        frozen={frozen}
      />
      {children(form, constraints)}
    </Form>
  )
}
