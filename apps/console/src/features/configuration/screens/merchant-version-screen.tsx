import { Block, Button, Form, Page, Region, Value } from '@granito/ui'
import { defineScreen, Result, useOutcome, useScreenParams } from '@ope/core'
import {
  type MerchantConfigurationVersion,
  useMerchantName,
  useMerchantVersion,
} from '../data/merchant-configuration'
import { valueAt } from '../data/present'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'
import { TreatmentValues } from './treatment-values'
import { VersionFacts } from './version-facts'

/**
 * **Una versión de la configuración de un merchant** (feature 008, research
 * §11): quién la publicó y por qué, y lo que **declaraba**, de sólo lectura.
 *
 * Lo que no declaraba lo heredaba de los defaults que regían entonces, y eso
 * no se reconstruye: la versión no dice cuáles eran. Se dice «heredado» y no se
 * inventa un valor.
 */
function MerchantVersionScreen() {
  const { merchantId, version } = useScreenParams(merchantVersionScreen)
  const merchantName = useMerchantName(merchantId)
  const number = Number(version)

  return (
    <Page
      title={configurationStrings.merchantVersionTitle(merchantName.data ?? merchantId, version)}
      context={merchantId}
    >
      <Region>
        <Block>
          {Number.isInteger(number) && number > 0 ? (
            <Loaded merchantId={merchantId} version={number} />
          ) : (
            <Value>{configurationStrings.versionNotFound}</Value>
          )}
        </Block>
      </Region>
    </Page>
  )
}

function Loaded({
  merchantId,
  version,
}: {
  readonly merchantId: string
  readonly version: number
}) {
  const loaded = useMerchantVersion(merchantId, version)
  return (
    <Result
      query={loaded}
      empty={{ title: configurationStrings.versionNotFound }}
      noMatches={{ title: configurationStrings.versionNotFound }}
      filtered={false}
      isEmpty={(each) => each === undefined || each === null}
    >
      {(each) => (each === null ? null : <VersionView version={each} />)}
    </Result>
  )
}

function VersionView({ version }: { readonly version: MerchantConfigurationVersion }) {
  const { emit } = useOutcome()
  const { declared } = version
  return (
    <Form
      onSubmit={(event) => event.preventDefault()}
      actions={
        <Button
          type="button"
          onClick={() => emit(configuration.outcomes.versionClosed({ from: 'version' }))}
        >
          {configurationStrings.back}
        </Button>
      }
    >
      <VersionFacts version={version} windowsRestarted={version.windowsRestarted} />
      <TreatmentValues
        values={declared}
        originOf={(path) =>
          valueAt(declared, path) === undefined ? configurationStrings.inheritedThen : undefined
        }
      />
    </Form>
  )
}

export const merchantVersionScreen = defineScreen({
  id: 'merchantVersion',
  title: configurationStrings.versionSection,
  path: '/merchants/:merchantId/configuration/versions/:version',
  capability: 'configuration:read',
  component: MerchantVersionScreen,
})
