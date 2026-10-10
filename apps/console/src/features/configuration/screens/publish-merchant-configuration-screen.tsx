import { Alert, Block, Button, Field, Form, Page, Region, Section, Value } from '@granito/ui'
import {
  ConflictDialog,
  defineScreen,
  type Presentation,
  Result,
  useAction,
  useForm,
  useLoadedOnce,
  useOutcome,
  useScreenParams,
  useUnsavedWork,
  type Witnessed,
} from '@ope/core'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { CorrectiveSection } from '../../../components/corrective-section'
import { comparableOfContract, comparableOfForm } from '../data/comparable'
import type { OperativeLeaf } from '../data/groups'
import {
  declareFrom,
  kindOfLeaf,
  merchantBodyOf,
  merchantConstraints,
  merchantFormOf,
  mergedMerchantBodyOf,
  nameOf,
  OPERATIVE_LEAVES,
} from '../data/merchant-body'
import {
  type MerchantConfiguration,
  type MerchantConfigurationDeclared,
  publishMerchantConfiguration,
  useMerchantConfiguration,
  useMerchantConfigurationReader,
  useMerchantName,
} from '../data/merchant-configuration'
import { rowsOf } from '../data/treatment-form'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'
import { TreatmentFields } from './treatment-fields'

/**
 * **Publicar una versión de la configuración de un merchant** (feature 008,
 * escenarios 3 a 6).
 *
 * Precargada con lo que declara la versión que rige. Cada valor operativo se
 * hereda o se declara; lo que no se edita no pasa por el formulario y se copia
 * al armar el cuerpo (research §7). Un `409 configuration-frozen` no se pierde:
 * la pantalla pasa a modo correctivo con todo lo cargado (research §10).
 *
 * Si otro publicó mientras tanto, el servidor responde `412` y la puerta
 * relee (feature 009, `CU-29`): sin cruce guarda sola sobre la versión nueva,
 * con lo no editado de esa versión; con cruce muestra el choque, y lo tecleado
 * sigue en el formulario.
 */
function PublishMerchantConfigurationScreen() {
  const { merchantId } = useScreenParams(publishMerchantConfigurationScreen)
  const served = useMerchantConfiguration(merchantId)
  const merchantName = useMerchantName(merchantId)

  return (
    <Page
      title={configurationStrings.publishTitle(merchantName.data ?? merchantId)}
      context={merchantId}
    >
      <Region>
        <Block>
          <Result
            query={served}
            empty={{ title: configurationStrings.merchantNotFound }}
            noMatches={{ title: configurationStrings.merchantNotFound }}
            filtered={false}
            isEmpty={(loaded) => loaded === undefined}
          >
            {(loaded) => <PublishForm merchantId={merchantId} served={loaded} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function PublishForm({
  merchantId,
  served: live,
}: {
  readonly merchantId: string
  readonly served: Witnessed<MerchantConfiguration>
}) {
  const { emit } = useOutcome()
  /* Lo que rige al abrir, quieto: la consulta se mueve sola, y con ella se
     correrían el testigo y la referencia del choque (`CU-29`). */
  const served = useLoadedOnce(live)
  const inForce = served.declared
  /* La precarga se calcula una vez: lo que rige al abrir es contra lo que se
     compara si hay cambios, y de donde sale lo que no se edita. */
  const [initial] = useState(() => merchantFormOf(inForce))
  const [shown, setShown] = useState<Readonly<Record<string, Presentation | undefined>>>(
    initial.shown,
  )
  const [frozen, setFrozen] = useState(false)
  const [rejected, setRejected] = useState<string | undefined>(undefined)
  /**
   * **Publicada, y recién entonces se sale.** Emitir el desenlace en `onDone`
   * navegaba en el mismo dibujo en que la pantalla todavía decía tener trabajo
   * sin guardar, y el marco preguntaba si descartarlo —sobre una versión ya
   * publicada—.
   *
   * **Hacen falta dos dibujos, no uno.** La pantalla le avisa al marco con un
   * cambio de estado del proveedor, que recién vale en el dibujo siguiente de
   * ese proveedor; navegar en el mismo pase de efectos lo encontraba todavía
   * en «hay cambios». Así que publicar marca `published` —la pantalla deja de
   * decir que tiene cambios—, eso marca `leaving` en el pase siguiente, y recién
   * con `leaving` se sale, cuando el marco ya se enteró.
   */
  const [published, setPublished] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const reread = useMerchantConfigurationReader(merchantId)
  /* Lo que la puerta lee cuando llega el rechazo, que no es el dibujo en que se
     apretó «Publicar»: la puerta guarda las opciones de ese dibujo, así que lo
     de ahora tiene que llegarle por una referencia. */
  const now = useRef<{
    values: Readonly<Record<string, string>>
    shown: Readonly<Record<string, Presentation | undefined>>
  }>({ values: initial.values, shown })
  /* Lo que rige según la relectura: de ahí sale lo no editado del reintento, y
     su número es contra el que se dice si no cambió nada. */
  const fresh = useRef<{ declared: MerchantConfigurationDeclared; merchant: number | undefined }>({
    declared: inForce,
    merchant: served.versions.merchant,
  })
  /* Lo cargado, en hojas del contrato: la referencia contra la que se compara. */
  const opened = useLoadedOnce(comparableOfContract(inForce, OPERATIVE_LEAVES))

  const action = useAction(publishMerchantConfiguration, {
    concurrency: {
      loaded: opened,
      onScreen: () =>
        comparableOfForm(now.current.values, OPERATIVE_LEAVES, {
          nameOf,
          kindOf: kindOfLeaf,
          shownOf: (leaf) => now.current.shown[leaf],
        }),
      reread: async () => {
        const current = await reread()
        fresh.current = { declared: current.declared, merchant: current.versions.merchant }
        return {
          values: comparableOfContract(current.declared, OPERATIVE_LEAVES),
          version: current.witness,
        }
      },
      retryWith: (merged, witness) => ({
        merchantId,
        body: mergedMerchantBodyOf(merged, fresh.current.declared, now.current.values),
        inForce: fresh.current.merchant,
        witness,
      }),
    },
    onDone: () => setPublished(true),
    onRejected: (failed) => {
      /* Por el tipo y no con `failedWith`: `failed` ya es un rechazo, y la guarda
         lo dejaría en `never` en la rama de abajo. */
      if (failed.type === 'configuration-frozen') {
        setFrozen(true)
        form.set('corrective', 'true')
        return
      }
      setRejected(failed.errors.length === 0 ? failed.message : undefined)
    },
  })
  const form = useForm<Readonly<Record<string, string>>>(
    initial.values,
    (values) => merchantConstraints(values, shown, inForce),
    configurationStrings.shape,
    action.fields,
  )
  const constraints = merchantConstraints(form.values, shown, inForce)
  now.current = { values: form.values, shown }
  useUnsavedWork(!published && JSON.stringify(form.values) !== JSON.stringify(initial.values))
  useEffect(() => {
    if (published) setLeaving(true)
  }, [published])
  useEffect(() => {
    if (leaving) emit(configuration.outcomes.merchantConfigurationPublished({ merchantId }))
  }, [leaving, emit, merchantId])

  const declare = (leaf: OperativeLeaf) => {
    const loaded = declareFrom(leaf, served.effective)
    setShown((current) => ({ ...current, [leaf]: loaded.shown }))
    for (const [name, value] of Object.entries(loaded.entries)) form.set(name, value)
  }
  const inherit = (leaf: OperativeLeaf) => {
    const name = nameOf(leaf)
    for (const row of rowsOf(form.values, name)) form.unset(row)
    form.unset(name)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setRejected(undefined)
    if (!form.attempt()) return
    void action.run({
      merchantId,
      body: merchantBodyOf(form.values, shown, inForce),
      inForce: served.versions.merchant,
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
          <Button
            type="button"
            onClick={() => emit(configuration.outcomes.merchantPublishCancelled({ merchantId }))}
          >
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

      <TreatmentFields
        form={form}
        prefix="declared"
        shown={shown}
        constraints={constraints}
        inheritance={{
          effective: served.effective,
          inheritedFrom: configurationStrings.inherited(served.versions.defaults),
          declare,
          inherit,
        }}
      />

      {/* Lo que no se edita acá, dicho: viaja tal cual rige, y quien publica
          tiene que saber que lo está mandando (research §7). */}
      <Section
        title={configurationStrings.carriedSection}
        why={configurationStrings.carriedWhy}
        columns={2}
      >
        <Field label={configurationStrings.decisionSection} size="medium">
          {() => <Value>{inForce.decisionPolicy?.version ?? ''}</Value>}
        </Field>
        <Field label={configurationStrings['commercialPolicy.returnRisk']} size="medium">
          {() => (
            <Value>
              {inForce.commercialPolicy?.returnRisk === undefined
                ? ''
                : configurationStrings.defined}
            </Value>
          )}
        </Field>
        <Field label={configurationStrings.anchors} size="medium">
          {() => <Value>{Object.keys(inForce.anchors ?? {}).join(', ')}</Value>}
        </Field>
        <Field label={configurationStrings.attributeLabels} size="medium">
          {() => (
            <Value>
              {configurationStrings.labelsCount((inForce.attributeLabels ?? []).length)}
            </Value>
          )}
        </Field>
      </Section>
    </Form>
  )
}

/** El rótulo de una hoja en el choque: el mismo que tiene su campo. */
function leafLabel(field: string): string {
  const leaf = OPERATIVE_LEAVES.find((each) => each === field)
  return leaf === undefined ? field : configurationStrings[leaf]
}

export const publishMerchantConfigurationScreen = defineScreen({
  id: 'publishMerchantConfiguration',
  title: configurationStrings.publishVersion,
  path: '/merchants/:merchantId/configuration/publish',
  /* Exige escribir: sin eso la ruta responde «sin permisos» y el botón que
     lleva acá no se dibuja (`CU-3`). */
  capability: 'configuration:write',
  component: PublishMerchantConfigurationScreen,
})
