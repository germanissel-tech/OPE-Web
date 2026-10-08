import {
  Badge,
  Block,
  Button,
  Field,
  Form,
  FormattedValue,
  Page,
  Region,
  Section,
  Table,
  Value,
} from '@granito/ui'
import { defineScreen, Result, useOutcome, useScreenParams } from '@ope/core'
import { dayOf, type Merchant, useMerchant } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'
import { DeactivateButton } from './deactivate-button'

/**
 * La ficha de un merchant, alcanzada desde la grilla con el parámetro
 * **tipado** (`CU-41`): `merchantId` sale de la ruta y el compilador lo verifica.
 *
 * **Es un formulario de sólo lectura** (`GR-30`): quien no puede editar ve todo
 * y no ve controles muertos. Cada dato es un `Field` con su rótulo y su tamaño
 * semántico, agrupado en secciones con la cabecera al costado (`GR-24`), y
 * **las acciones van al pie del formulario** (`GR-38`): desactivar, que exige
 * capacidad, y volver.
 *
 * Muestra lo que el contrato devuelve y **nada más**: identificador, estado,
 * orígenes, alta, y las credenciales **por clase e instante, nunca su valor**
 * (`ADR-031` del backend). No tiene entrada de menú: su ruta lleva parámetro, y
 * una entrada de menú no tendría con qué completarlo.
 */
function MerchantScreen() {
  const { merchantId } = useScreenParams(merchantScreen)
  const merchant = useMerchant(merchantId)

  return (
    <Page title={merchantsStrings.merchant} context={merchantId}>
      <Region>
        <Block>
          {/* Los cuatro estados. El vacío **no se parte en dos** acá y está bien:
              un `GET` individual no tiene «los filtros no dan», tiene «no existe».
              Y fuera del alcance el backend responde `403` sin decir si existe:
              para el operador es lo mismo, y el texto lo dice. */}
          <Result
            query={merchant}
            empty={{ title: merchantsStrings.merchantNotFound }}
            noMatches={{ title: merchantsStrings.merchantNotFound }}
            filtered={false}
            isEmpty={(loaded) => loaded === undefined}
          >
            {(loaded) => <MerchantCard merchant={loaded} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function MerchantCard({ merchant }: { readonly merchant: Merchant }) {
  const { emit } = useOutcome()

  return (
    <Form
      /* **No es `readOnly`**: en granito ese modo esconde el pie entero —quien
         no puede editar no ve botones—, y acá el pie tiene las dos salidas de
         la ficha. Los datos son valores, no controles: cada campo dibuja un
         `Value`, que es lo mismo que el modo sólo lectura dibuja. */
      /* Un `<form>` de verdad: `Enter` enviaría, y acá no hay nada que enviar. */
      onSubmit={(event) => event.preventDefault()}
      /* **Dos salidas, y la ficha no sabe a dónde lleva ninguna**: desactivar es
         una acción que exige capacidad, y volver es un desenlace que el flujo
         resuelve (`CU-47`). La primaria va última (`GR-27`). */
      actions={
        <>
          <Button
            type="button"
            onClick={() =>
              emit(merchants.outcomes.merchantClosed({ merchantId: merchant.merchantId }))
            }
          >
            {merchantsStrings.backToMerchants}
          </Button>
          <DeactivateButton merchant={merchant} />
        </>
      }
    >
      <Section title={merchantsStrings.merchant} columns={2}>
        <Field label={merchantsStrings.merchantId} size="code">
          {() => <Value>{merchant.merchantId}</Value>}
        </Field>
        {/* Un estado **cerrado** va como pastilla (`GR-67`), también en la ficha. */}
        <Field label={merchantsStrings.status} size="short">
          {() => (
            <Badge tone={merchant.status === 'active' ? 'success' : 'neutral'}>
              {merchantsStrings[merchant.status]}
            </Badge>
          )}
        </Field>
        <Field label={merchantsStrings.origins} size="fill">
          {() => <Value>{merchant.origins.join(', ')}</Value>}
        </Field>
        {/* El mismo formato que la grilla: un formato se define una vez (`GR-31`). */}
        <Field label={merchantsStrings.createdAt} size="date">
          {() => <FormattedValue format="date" value={dayOf(merchant.createdAt)} />}
        </Field>
      </Section>

      {/* Las credenciales, **por clase e instante y nunca por valor**: es lo que
          el contrato devuelve, y es lo que un operador necesita para saber qué
          rotar. Una grilla y no campos, porque son varias y de la misma forma. */}
      <Section title={merchantsStrings.credentials}>
        <Table
          rows={[...merchant.credentials]}
          state={merchant.credentials.length > 0 ? 'ready' : 'empty'}
          empty={{ title: merchantsStrings.noCredentials }}
          noResults={{ title: merchantsStrings.noCredentials }}
          error={{ title: merchantsStrings.noCredentials }}
          rowId={(credential) => credential.kind}
          columns={[
            {
              id: 'kind',
              header: merchantsStrings.kind,
              width: '200px',
              cell: (credential) => credential.kind,
            },
            {
              id: 'issuedAt',
              header: merchantsStrings.issuedAt,
              width: '160px',
              format: 'date',
              cell: (credential) => dayOf(credential.issuedAt),
            },
          ]}
          caption={merchantsStrings.credentials}
        />
      </Section>
    </Form>
  )
}

export const merchantScreen = defineScreen({
  id: 'merchant',
  title: merchantsStrings.merchant,
  path: '/merchants/:merchantId',
  /* No hay con qué completar la URL en el menú: se llega desde la grilla. */
  capability: 'merchants:read',
  component: MerchantScreen,
})
