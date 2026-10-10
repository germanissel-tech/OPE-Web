import {
  Block,
  Button,
  Field,
  Form,
  NumberInput,
  Page,
  Region,
  Section,
  StateMessage,
  Value,
} from '@granito/ui'
import {
  defineScreen,
  SecretOnce,
  useAction,
  useForm,
  useOutcome,
  useScreenParams,
} from '@ope/core'
import { type FormEvent, useState } from 'react'
import { type CredentialIssued, type CredentialKind, isCredentialKind } from '../data/merchants'
import { rotateCredential, rotationConstraints } from '../data/rotate-credential'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'
import { When } from './when'

/**
 * **Rotar una credencial, en dos pasos y en una pantalla** (`GR-37`, `OW-8`).
 *
 * Es pantalla y no diálogo porque tiene consecuencia propia (la anterior deja
 * de valer), un error de negocio que explicar (`422 rotation-grace-too-long`,
 * que cae en el campo) y devuelve algo que hay que leer con calma: el valor
 * nuevo, **una sola vez**. El segundo paso vive en el estado de este
 * componente y se va con él.
 *
 * La clase llega por la ruta como texto y se valida contra las del contrato:
 * lo que no es una clase se trata como «no existe», igual que un merchant
 * fuera del alcance. Una pantalla por clase serían tres copias del mismo
 * formulario.
 */
type Step =
  | { readonly kind: 'form' }
  | { readonly kind: 'issued'; readonly issued: CredentialIssued }

function RotateScreen() {
  const { merchantId, kind } = useScreenParams(rotateScreen)
  const [step, setStep] = useState<Step>({ kind: 'form' })

  if (!isCredentialKind(kind)) {
    return (
      <Page title={merchantsStrings.rotate} context={merchantId}>
        <Region>
          <Block>
            <StateMessage kind="empty" title={merchantsStrings.rotateNotFound} />
          </Block>
        </Region>
      </Page>
    )
  }

  return (
    <Page title={merchantsStrings.rotateTitle(kind)} context={merchantId}>
      <Region>
        <Block>
          {step.kind === 'form' ? (
            <RotationForm
              merchantId={merchantId}
              kind={kind}
              onIssued={(issued) => setStep({ kind: 'issued', issued })}
            />
          ) : (
            <Issued merchantId={merchantId} issued={step.issued} />
          )}
        </Block>
      </Region>
    </Page>
  )
}

function BackButton({ merchantId }: { readonly merchantId: string }) {
  const { emit } = useOutcome()
  return (
    <Button type="button" onClick={() => emit(merchants.outcomes.rotationClosed({ merchantId }))}>
      {merchantsStrings.backToMerchant}
    </Button>
  )
}

function RotationForm({
  merchantId,
  kind,
  onIssued,
}: {
  readonly merchantId: string
  readonly kind: CredentialKind
  readonly onIssued: (issued: CredentialIssued) => void
}) {
  const action = useAction(rotateCredential, { onDone: onIssued })
  /* La omisión del contrato es cero —revocar en el acto—, y se muestra para
     que el operador la vea antes de apretar. */
  const form = useForm(
    { graceSeconds: '0' },
    rotationConstraints,
    merchantsStrings.shape,
    action.fields,
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.attempt()) return
    void action.run({ merchantId, kind, graceSeconds: Number(form.values.graceSeconds) })
  }

  return (
    <Form
      onSubmit={submit}
      saving={action.running}
      actions={
        <>
          <BackButton merchantId={merchantId} />
          <Button type="submit" tone="primary" disabled={action.running}>
            {merchantsStrings.rotate}
          </Button>
        </>
      }
    >
      <Section
        title={merchantsStrings.rotateTitle(kind)}
        why={merchantsStrings.rotateConsequence(kind)}
      >
        <Field label={merchantsStrings.credentialLabel(kind)} size="medium">
          {() => <Value>{merchantId}</Value>}
        </Field>
      </Section>

      <Section title={merchantsStrings.graceSection} why={merchantsStrings.graceWhy}>
        <Field
          label={merchantsStrings.graceSeconds}
          size="short"
          required
          error={form.errorOf('graceSeconds')}
        >
          {(props) => (
            <NumberInput
              {...props}
              value={form.values.graceSeconds}
              decimals={0}
              suffix="s"
              onChange={(value) => form.set('graceSeconds', value)}
              onBlur={() => form.blur('graceSeconds')}
            />
          )}
        </Field>
      </Section>
    </Form>
  )
}

function Issued({
  merchantId,
  issued,
}: {
  readonly merchantId: string
  readonly issued: CredentialIssued
}) {
  return (
    <Form
      onSubmit={(event) => event.preventDefault()}
      actions={<BackButton merchantId={merchantId} />}
    >
      <Section title={merchantsStrings.rotated(issued.kind)} why={merchantId}>
        <SecretOnce
          warning={merchantsStrings.issuedWarning}
          secrets={[{ label: merchantsStrings.credentialLabel(issued.kind), value: issued.value }]}
        />
        <Field label={merchantsStrings.issuedAtOf} size="medium">
          {() => (
            <Value>
              <When instant={issued.issuedAt} />
            </Value>
          )}
        </Field>
        <Field label={merchantsStrings.previousExpiresAt} size="medium">
          {() => (
            <Value>
              {issued.previousExpiresAt === undefined ? (
                merchantsStrings.noPrevious
              ) : (
                <When instant={issued.previousExpiresAt} />
              )}
            </Value>
          )}
        </Field>
      </Section>
    </Form>
  )
}

export const rotateScreen = defineScreen({
  id: 'rotate',
  title: merchantsStrings.rotate,
  path: '/merchants/:merchantId/rotate/:kind',
  /* Exige rotar: sin eso la ruta responde «sin permisos» y el botón que lleva
     acá no se dibuja (`CU-3`). Sin entrada de menú: se llega desde la ficha. */
  capability: 'credentials:rotate',
  component: RotateScreen,
})
