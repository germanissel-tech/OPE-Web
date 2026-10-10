import { Alert, Block, Button, Form, Page, Region } from '@granito/ui'
import {
  ConflictDialog,
  defineScreen,
  Result,
  useAction,
  useForm,
  useLoadedOnce,
  useOutcome,
  useScreenParams,
  type Witnessed,
} from '@ope/core'
import { type FormEvent, useRef, useState } from 'react'
import {
  identityConstraints,
  identityValuesOf,
  identityValuesOfMerged,
  profileBodyOf,
} from '../data/identity'
import { displayNameOf, type Merchant, useMerchant, useMerchantReader } from '../data/merchants'
import { updateMerchantProfile } from '../data/update-merchant-profile'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'
import { IdentityFields, identityLabel } from './identity-fields'

/**
 * **Editar la identidad de un merchant, entera** (feature 007, `ADR-045`).
 *
 * Es pantalla y no diálogo (`GR-37`): siete campos, uno de ellos un objeto, y
 * un `422` que explicar en su campo. Precarga lo que el merchant tiene —para
 * que nada se borre sin verse— y guarda la identidad completa: lo que se vacía
 * se borra, y la sección lo dice. Guardar o cancelar informan `identityClosed`,
 * y el flujo termina en la ficha (`CU-47`).
 */
function EditIdentityScreen() {
  const { merchantId } = useScreenParams(editIdentityScreen)
  const merchant = useMerchant(merchantId)
  const title =
    (merchant.data === undefined ? undefined : displayNameOf(merchant.data)) ?? merchantId

  return (
    <Page title={merchantsStrings.editIdentityTitle(title)} context={merchantId}>
      <Region>
        <Block>
          <Result
            query={merchant}
            empty={{ title: merchantsStrings.merchantNotFound }}
            noMatches={{ title: merchantsStrings.merchantNotFound }}
            filtered={false}
            isEmpty={(loaded) => loaded === undefined}
          >
            {(loaded) => <IdentityForm merchant={loaded} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function IdentityForm({ merchant: live }: { readonly merchant: Witnessed<Merchant> }) {
  const { emit } = useOutcome()
  /* Lo que se leyó al abrir, quieto: la consulta se mueve sola, y con ella se
     correrían el testigo y la referencia del choque (`CU-29`). */
  const merchant = useLoadedOnce(live)
  /* Los siete campos ya son texto plano, uno por clave: se comparan tal cual
     (research §5). Un cambio del interruptor o una rotación mueve el testigo y
     ningún campo, así que no es choque: la puerta guarda sola. */
  const opened = useLoadedOnce(identityValuesOf(live))
  const reread = useMerchantReader(live.merchantId)
  /* Lo que hay en pantalla cuando llega el rechazo: por una referencia, porque
     la puerta guarda las opciones del dibujo en que se apretó «Guardar». */
  const now = useRef(opened)
  const close = () => emit(merchants.outcomes.identityClosed({ merchantId: merchant.merchantId }))
  /* Un rechazo que no señala ningún campo va al pie, con lo que el servidor dijo. */
  const [rejected, setRejected] = useState<string | undefined>(undefined)
  const action = useAction(updateMerchantProfile, {
    concurrency: {
      loaded: opened,
      onScreen: () => now.current,
      reread: async () => {
        const current = await reread()
        return { values: identityValuesOf(current), version: current.witness }
      },
      retryWith: (merged, witness) => ({
        merchantId: merchant.merchantId,
        body: profileBodyOf(identityValuesOfMerged(merged)),
        witness,
      }),
    },
    onDone: close,
    onRejected: (failed) => setRejected(failed.errors.length === 0 ? failed.message : undefined),
  })
  const form = useForm(opened, identityConstraints, merchantsStrings.shape, action.fields)
  now.current = form.values

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setRejected(undefined)
    if (!form.attempt()) return
    void action.run({
      merchantId: merchant.merchantId,
      body: profileBodyOf(form.values),
      witness: merchant.witness,
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
          <Button type="button" onClick={close}>
            {merchantsStrings.cancel}
          </Button>
          <Button type="submit" tone="primary" disabled={action.running}>
            {merchantsStrings.saveIdentity}
          </Button>
        </>
      }
    >
      <ConflictDialog clash={action.clash} onClose={action.dismissClash} labelOf={identityLabel} />

      <IdentityFields
        form={form}
        constraints={identityConstraints(form.values)}
        why={merchantsStrings.editIdentityWhy}
      />
    </Form>
  )
}

export const editIdentityScreen = defineScreen({
  id: 'edit-identity',
  title: merchantsStrings.editIdentity,
  path: '/merchants/:merchantId/identity',
  /* Exige escribir: sin eso la ruta responde «sin permisos» y el botón que
     lleva acá no se dibuja (`CU-3`). No está en el menú: se llega desde la ficha. */
  capability: 'merchants:write',
  component: EditIdentityScreen,
})
