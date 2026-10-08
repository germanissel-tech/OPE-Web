import { Badge, Block, Button, Page, Region, Table } from '@granito/ui'
import { defineScreen, Result, useOutcome, useScreenParams } from '@ope/core'
import { type Merchant, useMerchant } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'
import { DeactivateButton } from './deactivate-button'

/**
 * La ficha de un merchant, alcanzada desde la grilla con el parámetro
 * **tipado** (`CU-41`): `merchantId` sale de la ruta y el compilador lo verifica.
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
      </Region>
    </Page>
  )
}

function MerchantCard({ merchant }: { readonly merchant: Merchant }) {
  const { emit } = useOutcome()

  return (
    <Block>
      <dl>
        <dt>{merchantsStrings.status}</dt>
        <dd>
          <Badge tone={merchant.status === 'active' ? 'success' : 'neutral'}>
            {merchantsStrings[merchant.status]}
          </Badge>
        </dd>
        <dt>{merchantsStrings.origins}</dt>
        <dd>{merchant.origins.join(', ')}</dd>
        <dt>{merchantsStrings.createdAt}</dt>
        <dd>{merchant.createdAt}</dd>
      </dl>

      {/* Las credenciales, **por clase e instante y nunca por valor**: es lo que
          el contrato devuelve, y es lo que un operador necesita para saber qué
          rotar. */}
      <Table
        rows={[...merchant.credentials]}
        state={merchant.credentials.length > 0 ? 'ready' : 'empty'}
        empty={{ title: merchantsStrings.noCredentials }}
        noResults={{ title: merchantsStrings.noCredentials }}
        error={{ title: merchantsStrings.noCredentials }}
        rowId={(credential) => credential.kind}
        columns={[
          { id: 'kind', header: merchantsStrings.kind, cell: (credential) => credential.kind },
          {
            id: 'issuedAt',
            header: merchantsStrings.issuedAt,
            format: 'date',
            cell: (credential) => credential.issuedAt,
          },
        ]}
        caption={merchantsStrings.credentials}
      />

      {/* **Dos salidas, y la ficha no sabe a dónde lleva ninguna**: desactivar
          es una acción que exige capacidad, y volver es un desenlace que el
          flujo resuelve (`CU-47`). */}
      <DeactivateButton merchant={merchant} />
      <Button
        onClick={() => emit(merchants.outcomes.merchantClosed({ merchantId: merchant.merchantId }))}
      >
        {merchantsStrings.backToMerchants}
      </Button>
    </Block>
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
