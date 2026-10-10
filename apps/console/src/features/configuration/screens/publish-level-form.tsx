import { Alert, Button, Form } from '@granito/ui'
import {
  type Action,
  ConflictDialog,
  type Form as FormState,
  type MessageConstraints,
  type Operations,
  useAction,
  useForm,
  useLoadedOnce,
  useUnsavedWork,
} from '@ope/core'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { CorrectiveSection } from '../../../components/corrective-section'
import { leafLabel } from '../data/leaf-label'
import type { LevelComparison } from '../data/level-body'
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
 *
 * Si otro publicó mientras tanto, el servidor responde `412` y la puerta
 * relee (feature 009, `CU-29`): sin cruce guarda sola sobre la versión nueva,
 * con lo no editado de esa versión; con cruce muestra el choque, y lo tecleado
 * sigue en el formulario.
 */
export function PublishLevelForm<
  Body,
  Read extends { readonly version: string; readonly witness: string },
  Output,
  Ops extends Operations,
>({
  action: definition,
  initial,
  served: live,
  comparison,
  reread,
  constraintsOf,
  bodyOf,
  mergedBodyOf,
  onPublished,
  onCancel,
  children,
}: {
  readonly action: Action<PublishLevelInput<Body>, Output, Ops>
  /** La precarga y en qué unidad quedó cada número: se calculan una vez, al abrir. */
  readonly initial: { readonly values: Values; readonly shown: Shown }
  /**
   * Lo que rige al abrir, con su testigo: el nombre dice si no cambió nada, y el
   * testigo vuelve en `If-Match` (`CU-29`).
   */
  readonly served: Read
  readonly comparison: LevelComparison
  /** Cómo volver a pedir lo que rige, por fuera de la consulta. */
  readonly reread: () => Promise<Read>
  readonly constraintsOf: (values: Values, shown: Shown) => MessageConstraints
  /** El cuerpo del formulario; lo no editado sale de lo que rige al abrir. */
  readonly bodyOf: (values: Values, shown: Shown, inForce: Read) => Body
  /** El cuerpo del reintento: las hojas fusionadas, y lo no editado de la relectura. */
  readonly mergedBodyOf: (
    merged: Readonly<Record<string, unknown>>,
    reread: Read,
    values: Values,
  ) => Body
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
  /* Lo que rige al abrir, quieto: la consulta se mueve sola, y con ella se
     correrían el testigo y la referencia del choque (`CU-29`). */
  const served = useLoadedOnce(live)
  const opened = useLoadedOnce(comparison.ofContent(live))
  /* Lo que la puerta lee cuando llega el rechazo, que no es el dibujo en que se
     apretó «Publicar»: le llega por una referencia. */
  const now = useRef<Values>(initial.values)
  /* Lo que rige según la relectura: de ahí sale lo no editado del reintento. */
  const fresh = useRef<Read>(served)

  const action = useAction(definition, {
    concurrency: {
      loaded: opened,
      onScreen: () => comparison.ofForm(now.current, shown),
      reread: async () => {
        const current = await reread()
        fresh.current = current
        return { values: comparison.ofContent(current), version: current.witness }
      },
      retryWith: (merged, witness) => ({
        body: mergedBodyOf(merged, fresh.current, now.current),
        inForce: fresh.current.version,
        witness,
      }),
    },
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
  now.current = form.values
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
    void action.run({
      body: bodyOf(form.values, shown, served),
      inForce: served.version,
      witness: served.witness,
    })
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
      <ConflictDialog clash={action.clash} onClose={action.dismissClash} labelOf={leafLabel} />

      <CorrectiveSection
        form={form}
        required={constraints.required.includes('reason')}
        frozen={frozen}
      />
      {children(form, constraints)}
    </Form>
  )
}
