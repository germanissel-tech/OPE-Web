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
import {
  ActionButton,
  defineScreen,
  isEnabled,
  Result,
  useCapabilities,
  useFlow,
  useOutcome,
  useScreenParams,
} from '@ope/core'
import type { ReactNode } from 'react'
import {
  type CredentialKind,
  dayOf,
  displayNameOf,
  type Merchant,
  STATUS_TONE,
  useMerchant,
} from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'
import { DeactivateButton } from './deactivate-button'
import { IdentitySection } from './identity-section'
import { KillSwitchButton } from './kill-switch-button'
import { MerchantLog } from './merchant-log'

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
  /* El encabezado es el nombre (feature 007); mientras carga, o sin nombre, el
     identificador: nunca uno inventado. El contexto es el identificador siempre. */
  const title =
    (merchant.data === undefined ? undefined : displayNameOf(merchant.data)) ?? merchantId

  return (
    <Page title={title} context={merchantId}>
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
            {(loaded) => <MerchantCard merchant={loaded} refresh={() => merchant.refetch()} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function MerchantCard({
  merchant,
  refresh,
}: {
  readonly merchant: Merchant
  /** Volver a pedir la ficha: lo que hace un `409` —el estado cambió debajo—. */
  readonly refresh: () => void
}) {
  const { emit } = useOutcome()
  const flow = useFlow()
  const alive = merchant.status !== 'deactivated'
  const requestRotation = (kind: CredentialKind) =>
    emit(merchants.outcomes.rotationRequested({ merchantId: merchant.merchantId, kind }))
  const hasSigning = merchant.credentials.some((each) => each.kind === 'signing')

  return (
    <Form
      /* **No es `readOnly`**: en granito ese modo esconde el pie entero —quien
         no puede editar no ve botones—, y acá el pie tiene las dos salidas de
         la ficha. Los datos son valores, no controles: cada campo dibuja un
         `Value`, que es lo mismo que el modo sólo lectura dibuja. */
      /* Un `<form>` de verdad: `Enter` enviaría, y acá no hay nada que enviar. */
      onSubmit={(event) => event.preventDefault()}
      /* **Las salidas, y la ficha no sabe a dónde lleva ninguna**: apagar y
         desactivar son acciones que exigen capacidad y confirman, y volver es
         un desenlace que el flujo resuelve (`CU-47`). La más grave va última
         (`GR-27`). Las dos acciones refrescan la ficha si el servidor dijo que
         no: el estado cambió debajo. */
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
          <KillSwitchButton merchant={merchant} onRejected={refresh} />
          <DeactivateButton merchant={merchant} onRejected={refresh} />
        </>
      }
    >
      {/* La identidad va primero: es lo que reconoce al merchant (`ADR-045`). */}
      <IdentitySection merchant={merchant} />

      <Section title={merchantsStrings.merchant} columns={2}>
        <Field label={merchantsStrings.merchantId} size="code">
          {() => <Value>{merchant.merchantId}</Value>}
        </Field>
        {/* Un estado **cerrado** va como pastilla (`GR-67`), también en la ficha. */}
        <Field label={merchantsStrings.status} size="short">
          {() => (
            <Badge tone={STATUS_TONE[merchant.status]}>{merchantsStrings[merchant.status]}</Badge>
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
            /* **Rotar es un desenlace**: la fila no sabe que la rotación es una
               pantalla ni cuál; qué exige llegar se lo pregunta al flujo
               (`CU-47`, `CU-3`). Sobre un desactivado no se ofrece. */
            {
              id: 'rotate',
              header: '',
              width: '120px',
              cell: (credential) =>
                alive ? (
                  <ActionButton
                    type="button"
                    size="compact"
                    {...flow.toReach(merchants.outcomes.rotationRequested)}
                    onClick={() => requestRotation(credential.kind)}
                  >
                    {merchantsStrings.rotate}
                  </ActionButton>
                ) : null,
            },
          ]}
          caption={merchantsStrings.credentials}
        />
        {/* Un merchant creado sin firma puede empezar a firmar: rotar el
            secreto que no tiene lo acuña (contrato de `rotatePlatformSecret`). */}
        {alive && !hasSigning ? (
          <Field
            label={merchantsStrings.platformSecret}
            size="fill"
            help={merchantsStrings.noSigning}
          >
            {() => (
              <ActionButton
                type="button"
                {...flow.toReach(merchants.outcomes.rotationRequested)}
                onClick={() => requestRotation('signing')}
              >
                {merchantsStrings.createSigning}
              </ActionButton>
            )}
          </Field>
        ) : null}
      </Section>

      {/* Quién hizo qué sobre este merchant, debajo de lo que se le puede
          hacer: se lee junto a su estado (`GR-38`). Sin `log:read`, la sección
          no se dibuja y la ficha sí. */}
      <Visible requires={['log:read']}>
        <MerchantLog merchantId={merchant.merchantId} />
      </Visible>
    </Form>
  )
}

/** Lo que una capacidad no habilita, no se muestra (`CU-3`); acá, una sección. */
function Visible({
  requires,
  children,
}: {
  readonly requires: readonly string[]
  readonly children: ReactNode
}) {
  const capabilities = useCapabilities()
  return isEnabled({ requires }, capabilities) ? children : null
}

export const merchantScreen = defineScreen({
  id: 'merchant',
  title: merchantsStrings.merchant,
  path: '/merchants/:merchantId',
  /* No hay con qué completar la URL en el menú: se llega desde la grilla. */
  capability: 'merchants:read',
  component: MerchantScreen,
})
