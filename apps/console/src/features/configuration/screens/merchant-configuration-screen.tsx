import { Block, Button, Field, Form, Page, Region, Section, Value } from '@granito/ui'
import {
  ActionButton,
  defineScreen,
  Result,
  useFlow,
  useOutcome,
  useScreenParams,
  useTableQuery,
} from '@ope/core'
import { VersionHistory } from '../../../components/version-history'
import {
  type MerchantConfiguration,
  originOf,
  useConfigurationVersions,
  useMerchantConfiguration,
  useMerchantName,
} from '../data/merchant-configuration'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'
import { TreatmentValues } from './treatment-values'

/**
 * **Con qué se sirve a un merchant** (feature 008, escenarios 1, 2 y 7).
 *
 * Una pantalla aparte de la ficha y alcanzada desde ella: la configuración son
 * diez grupos de valores, y la ficha ya tiene identidad, credenciales y
 * registro. Es un formulario de sólo lectura (`GR-30`) con tres partes: las
 * versiones que cada decisión del merchant estampa, cada valor con lo efectivo
 * y **de dónde sale**, y el historial de las versiones que publicó.
 */
function MerchantConfigurationScreen() {
  const { merchantId } = useScreenParams(merchantConfigurationScreen)
  const merchantName = useMerchantName(merchantId)
  const configuration = useMerchantConfiguration(merchantId)
  const name = merchantName.data ?? merchantId

  return (
    <Page title={configurationStrings.configurationTitle(name)} context={merchantId}>
      <Region>
        <Block>
          <Result
            query={configuration}
            empty={{ title: configurationStrings.merchantNotFound }}
            noMatches={{ title: configurationStrings.merchantNotFound }}
            filtered={false}
            isEmpty={(loaded) => loaded === undefined}
          >
            {(loaded) => <ConfigurationView merchantId={merchantId} served={loaded} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function ConfigurationView({
  merchantId,
  served,
}: {
  readonly merchantId: string
  /** Con qué se lo sirve: lo efectivo, lo declarado y las versiones. */
  readonly served: MerchantConfiguration
}) {
  const { emit } = useOutcome()
  const flow = useFlow()
  const table = useTableQuery('versions')
  const versions = useConfigurationVersions(merchantId, {
    from: table.cursor,
    onCursor: table.setCursor,
  })
  const { effective, declared, versions: inForce } = served
  const anchors = Object.keys(declared.anchors ?? {})

  return (
    <Form
      onSubmit={(event) => event.preventDefault()}
      actions={
        <>
          <Button
            type="button"
            onClick={() => emit(configuration.outcomes.merchantConfigurationClosed({ merchantId }))}
          >
            {configurationStrings.backToMerchant}
          </Button>
          {/* Publicar exige `configuration:write`; qué pantalla es lo dice el flujo. */}
          <ActionButton
            type="button"
            tone="primary"
            {...flow.toReach(configuration.outcomes.merchantPublishRequested)}
            onClick={() => emit(configuration.outcomes.merchantPublishRequested({ merchantId }))}
          >
            {configurationStrings.publishVersion}
          </ActionButton>
        </>
      }
    >
      {/* Las tres versiones que cada decisión estampa (`ADR-031`): es lo que
          dice, en un registro, con qué se decidió. */}
      <Section
        title={configurationStrings.versionsInForce}
        why={configurationStrings.versionsInForceWhy}
        columns={3}
      >
        <Field label={configurationStrings.platformVersion} size="short">
          {() => <Value>{inForce.platform}</Value>}
        </Field>
        <Field label={configurationStrings.defaultsVersion} size="short">
          {() => <Value>{inForce.defaults}</Value>}
        </Field>
        <Field label={configurationStrings.merchantVersion} size="medium">
          {() => (
            <Value>
              {inForce.merchant === undefined
                ? configurationStrings.noOwnVersion
                : configurationStrings.versionNumber(inForce.merchant)}
            </Value>
          )}
        </Field>
      </Section>

      <TreatmentValues values={effective} originOf={originOf(declared, inForce.defaults)} />

      {/* Lo que el merchant declara y no tiene default: dónde se dibuja cada
          anclaje y qué significan sus etiquetas. Se ve; no se edita acá. */}
      <Section
        title={configurationStrings.ownSection}
        why={configurationStrings.ownWhy}
        columns={2}
      >
        <Field label={configurationStrings.anchors} size="medium">
          {() => <Value>{anchors.join(', ')}</Value>}
        </Field>
        <Field label={configurationStrings.attributeLabels} size="short">
          {() => (
            <Value>
              {configurationStrings.labelsCount((declared.attributeLabels ?? []).length)}
            </Value>
          )}
        </Field>
      </Section>

      <VersionHistory
        versions={versions}
        table={table}
        onOpen={(row) =>
          emit(
            configuration.outcomes.merchantVersionChosen({
              merchantId,
              version: String(row.version),
            }),
          )
        }
      />
    </Form>
  )
}

export const merchantConfigurationScreen = defineScreen({
  id: 'merchantConfiguration',
  title: configurationStrings.configuration,
  path: '/merchants/:merchantId/configuration',
  capability: 'configuration:read',
  component: MerchantConfigurationScreen,
})
