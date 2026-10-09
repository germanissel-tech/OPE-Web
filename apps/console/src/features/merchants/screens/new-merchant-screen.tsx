import {
  Alert,
  Block,
  Button,
  Checkbox,
  Field,
  Form,
  Page,
  Region,
  Section,
  TextInput,
} from '@granito/ui'
import { defineScreen, SecretOnce, useAction, useForm, useOutcome } from '@ope/core'
import { type FormEvent, useState } from 'react'
import { createMerchant, merchantConstraints } from '../data/create-merchant'
import type { MerchantCredentials } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'

/**
 * **El alta de un merchant, en dos pasos y en una pantalla** (`GR-70`, `OW-8`).
 *
 * El primer paso es el formulario: los orígenes, uno por renglón, y si la
 * plataforma firma. El segundo es lo que el backend devuelve **una sola vez**:
 * las credenciales, con su advertencia y «copiar». Es la misma pantalla y no
 * una con ruta propia porque no hay con qué volver a armarla: el secreto vive
 * en el estado de este componente y se va con él.
 *
 * Lo que sale de acá son dos desenlaces —se creó, o se canceló— y a dónde
 * lleva cada uno lo dice el flujo (`CU-47`): «continuar» termina el alta en la
 * ficha del merchant nuevo, así que volver desde ella no vuelve a un
 * formulario vacío.
 */
type Step =
  | { readonly kind: 'form' }
  | { readonly kind: 'issued'; readonly created: MerchantCredentials }

function NewMerchantScreen() {
  const [step, setStep] = useState<Step>({ kind: 'form' })

  return (
    <Page title={merchantsStrings.newMerchant}>
      <Region>
        <Block>
          {step.kind === 'form' ? (
            <NewMerchantForm onCreated={(created) => setStep({ kind: 'issued', created })} />
          ) : (
            <IssuedCredentials created={step.created} />
          )}
        </Block>
      </Region>
    </Page>
  )
}

/** Los renglones de la lista son campos `origins.N`; el formulario los lee así. */
const ROW = 'origins.'
const indexOf = (key: string) => Number(key.slice(ROW.length))
const rowsOf = (values: Readonly<Record<string, string>>) =>
  Object.keys(values)
    .filter((key) => key.startsWith(ROW))
    .sort((a, b) => indexOf(a) - indexOf(b))

function NewMerchantForm({
  onCreated,
}: {
  readonly onCreated: (created: MerchantCredentials) => void
}) {
  const { emit } = useOutcome()
  const [signature, setSignature] = useState(false)
  /* Un rechazo que no señala ningún campo —`origin-already-registered` sin
     `errors[]`, hasta la 040 del backend— se muestra al pie, con lo que el
     servidor dijo: el operador tiene que encontrar cuál es, y necesita el texto
     a la vista mientras busca. */
  const [rejected, setRejected] = useState<string | undefined>(undefined)
  const action = useAction(createMerchant, {
    onDone: onCreated,
    onRejected: (failed) => setRejected(failed.errors.length === 0 ? failed.message : undefined),
  })
  const form = useForm<Record<string, string>>(
    { [`${ROW}0`]: '' },
    merchantConstraints,
    merchantsStrings.shape,
    action.fields,
  )

  const rows = rowsOf(form.values)
  const list = merchantConstraints.fields.origins
  const canAdd = list?.maxItems === undefined || rows.length < list.maxItems
  const canRemove = rows.length > (list?.minItems ?? 1)
  const addRow = () => {
    const last = rows.at(-1)
    form.set(`${ROW}${last === undefined ? 0 : indexOf(last) + 1}`, '')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setRejected(undefined)
    if (!form.attempt()) return
    void action.run({
      origins: rows.map((key) => (form.values[key] ?? '').trim()),
      signature,
    })
  }

  return (
    <Form
      onSubmit={submit}
      saving={action.running}
      note={
        rejected ? (
          <Alert severity="warning" title={merchantsStrings.rejectedTitle}>
            {rejected}
          </Alert>
        ) : undefined
      }
      actions={
        <>
          <Button
            type="button"
            onClick={() => emit(merchants.outcomes.newMerchantCancelled({ from: 'form' }))}
          >
            {merchantsStrings.cancel}
          </Button>
          <Button type="submit" tone="primary" disabled={action.running}>
            {merchantsStrings.save}
          </Button>
        </>
      }
    >
      <Section title={merchantsStrings.originsSection} why={merchantsStrings.originsWhy}>
        {rows.map((key, at) => (
          <Field
            key={key}
            label={merchantsStrings.originRow(at + 1)}
            size="fill"
            required
            error={form.errorOf(key)}
          >
            {(props) => (
              <>
                <TextInput
                  {...props}
                  value={form.values[key] ?? ''}
                  onChange={(event) => form.set(key, event.target.value)}
                  onBlur={() => form.blur(key)}
                />
                {canRemove ? (
                  <Button type="button" size="compact" onClick={() => form.unset(key)}>
                    {merchantsStrings.removeOrigin}
                  </Button>
                ) : null}
              </>
            )}
          </Field>
        ))}
        {canAdd ? (
          <Button type="button" onClick={addRow}>
            {merchantsStrings.addOrigin}
          </Button>
        ) : null}
      </Section>

      <Section title={merchantsStrings.signatureSection} why={merchantsStrings.signatureWhy}>
        <Checkbox
          label={merchantsStrings.signature}
          checked={signature}
          onChange={(event) => setSignature(event.target.checked)}
        />
      </Section>
    </Form>
  )
}

function IssuedCredentials({ created }: { readonly created: MerchantCredentials }) {
  const { emit } = useOutcome()
  const { merchant, credentials } = created
  const secrets = [
    { label: merchantsStrings.ingestKey, value: credentials.ingestKey },
    { label: merchantsStrings.platformKey, value: credentials.platformKey },
    ...(credentials.platformSecret === undefined
      ? []
      : [{ label: merchantsStrings.platformSecret, value: credentials.platformSecret }]),
  ]

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        emit(merchants.outcomes.merchantCreated({ merchantId: merchant.merchantId }))
      }}
      actions={
        <Button type="submit" tone="primary">
          {merchantsStrings.continueToMerchant}
        </Button>
      }
    >
      <Section title={merchantsStrings.issuedTitle} why={merchant.merchantId}>
        <SecretOnce warning={merchantsStrings.issuedWarning} secrets={secrets} />
      </Section>
    </Form>
  )
}

export const newMerchantScreen = defineScreen({
  id: 'new-merchant',
  title: merchantsStrings.newMerchant,
  path: '/merchants/new',
  /* Exige escribir: sin eso la ruta responde «sin permisos», y el botón que
     lleva acá tampoco se dibuja (`CU-3`). No está en el menú: se llega desde
     la grilla. */
  capability: 'merchants:write',
  component: NewMerchantScreen,
})
