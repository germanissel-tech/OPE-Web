import { Block, Field, Form, Page, Region, Section, Value } from '@granito/ui'
import { ActionButton, defineScreen, Result, useFlow, useOutcome, useTableQuery } from '@ope/core'
import { VersionHistory } from '../../../components/version-history'
import {
  ALL_MERCHANTS,
  type PlatformConfiguration,
  usePlatformConfiguration,
  usePlatformVersions,
} from '../data/levels'
import { PLATFORM_GROUPS } from '../data/platform-groups'
import { present, valueAt } from '../data/present'
import { PLATFORM_PRESENTATION } from '../data/units'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'
import { levelHistoryColumns } from './level-history-columns'

/**
 * **La configuración de plataforma** (feature 008, escenarios 8 y 11): la
 * versión que rige por su nombre, sus valores en su unidad, y el historial.
 *
 * Es la raíz de la funcionalidad: la primera entrada de su menú y a donde cae
 * un cerrar sin pila. Lo mismo para todos los merchants, así que no tiene
 * parámetros. Publicar exige alcance sobre todos ellos (research §8): con un
 * alcance acotado se ve y no se publica.
 */
function PlatformScreen() {
  const platform = usePlatformConfiguration()

  return (
    <Page title={configurationStrings.platform}>
      <Region>
        <Block>
          <Result
            query={platform}
            empty={{ title: configurationStrings.levelNotFound }}
            noMatches={{ title: configurationStrings.levelNotFound }}
            filtered={false}
            isEmpty={(loaded) => loaded === undefined}
          >
            {(loaded) => <PlatformView platform={loaded} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function PlatformView({ platform }: { readonly platform: PlatformConfiguration }) {
  const { emit } = useOutcome()
  const flow = useFlow()
  const table = useTableQuery('versions')
  const versions = usePlatformVersions({ from: table.cursor, onCursor: table.setCursor })
  const reach = flow.toReach(configuration.outcomes.platformPublishRequested)

  return (
    <Form
      onSubmit={(event) => event.preventDefault()}
      actions={
        /* Escribir no alcanza: lo que se publica acá alcanza a todo merchant. */
        <ActionButton
          type="button"
          tone="primary"
          {...reach}
          requires={[...reach.requires, ALL_MERCHANTS]}
          onClick={() =>
            emit(configuration.outcomes.platformPublishRequested({ from: 'platform' }))
          }
        >
          {configurationStrings.publishVersion}
        </ActionButton>
      }
    >
      <Section title={configurationStrings.inForce} why={configurationStrings.platformWhy}>
        <Field label={configurationStrings.versionName} size="short">
          {() => <Value>{platform.version}</Value>}
        </Field>
      </Section>

      {PLATFORM_GROUPS.map((group) => (
        <Section key={group.title} title={group.title} why={group.why} columns={2}>
          {group.leaves.map((leaf) => (
            <Field key={leaf} label={configurationStrings[leaf]} size="medium">
              {() => <Value>{present(valueAt(platform, leaf), PLATFORM_PRESENTATION[leaf])}</Value>}
            </Field>
          ))}
        </Section>
      ))}

      <VersionHistory
        versions={versions}
        table={table}
        extra={levelHistoryColumns}
        onOpen={(row) =>
          emit(
            configuration.outcomes.levelVersionChosen({
              level: 'platform',
              version: String(row.version),
            }),
          )
        }
      />
    </Form>
  )
}

export const platformScreen = defineScreen({
  id: 'platform',
  title: configurationStrings.platform,
  path: '/configuration/platform',
  capability: 'configuration:read',
  component: PlatformScreen,
})
