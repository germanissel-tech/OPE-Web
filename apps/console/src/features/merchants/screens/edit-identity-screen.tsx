import { Alert, Block, Button, Form, Page, Region } from '@granito/ui'
import {
  defineScreen,
  Result,
  useAction,
  useForm,
  useOutcome,
  useScreenParams,
  type Witnessed,
} from '@ope/core'
import { type FormEvent, useState } from 'react'
import { identityConstraints, identityValuesOf, profileBodyOf } from '../data/identity'
import { displayNameOf, type Merchant, useMerchant } from '../data/merchants'
import { updateMerchantProfile } from '../data/update-merchant-profile'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'
import { IdentityFields } from './identity-fields'

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

function IdentityForm({ merchant }: { readonly merchant: Witnessed<Merchant> }) {
  const { emit } = useOutcome()
  const close = () => emit(merchants.outcomes.identityClosed({ merchantId: merchant.merchantId }))
  /* Un rechazo que no señala ningún campo va al pie, con lo que el servidor dijo. */
  const [rejected, setRejected] = useState<string | undefined>(undefined)
  const action = useAction(updateMerchantProfile, {
    onDone: close,
    onRejected: (failed) => setRejected(failed.errors.length === 0 ? failed.message : undefined),
  })
  const form = useForm(
    identityValuesOf(merchant),
    identityConstraints,
    merchantsStrings.shape,
    action.fields,
  )

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
