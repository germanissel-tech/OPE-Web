import { Block, Field, Form, Page, Region, Section, Value } from '@granito/ui'
import { ActionButton, defineScreen, Result, useFlow, useOutcome, useTableQuery } from '@ope/core'
import { VersionHistory } from '../../../components/version-history'
import {
  ALL_MERCHANTS,
  type TreatmentDefaults,
  useDefaultsVersions,
  useTreatmentDefaults,
} from '../data/levels'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'
import { levelHistoryColumns } from './level-history-columns'
import { TreatmentValues } from './treatment-values'

/**
 * **Los defaults de tratamiento** (feature 008, escenario 4): la versión que
 * rige por su nombre, sus valores en su unidad —los mismos que se ven en la
 * configuración de un merchant—, la política de decisión resumida, y el
 * historial.
 *
 * Igual para todos los merchants: lo hereda todo el que no declara su propio
 * valor. Publicar exige alcance sobre todos (research §8).
 */
function DefaultsScreen() {
  const defaults = useTreatmentDefaults()

  return (
    <Page title={configurationStrings.defaults}>
      <Region>
        <Block>
          <Result
            query={defaults}
            empty={{ title: configurationStrings.levelNotFound }}
            noMatches={{ title: configurationStrings.levelNotFound }}
            filtered={false}
            isEmpty={(loaded) => loaded === undefined}
          >
            {(loaded) => <DefaultsView defaults={loaded} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function DefaultsView({ defaults }: { readonly defaults: TreatmentDefaults }) {
  const { emit } = useOutcome()
  const flow = useFlow()
  const table = useTableQuery('versions')
  const versions = useDefaultsVersions({ from: table.cursor, onCursor: table.setCursor })
  const reach = flow.toReach(configuration.outcomes.defaultsPublishRequested)

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
            emit(configuration.outcomes.defaultsPublishRequested({ from: 'defaults' }))
          }
        >
          {configurationStrings.publishVersion}
        </ActionButton>
      }
    >
      <Section title={configurationStrings.inForce} why={configurationStrings.defaultsWhy}>
        <Field label={configurationStrings.versionName} size="short">
          {() => <Value>{defaults.version}</Value>}
        </Field>
      </Section>

      <TreatmentValues values={defaults} />

      <VersionHistory
        versions={versions}
        table={table}
        extra={levelHistoryColumns}
        onOpen={(row) =>
          emit(
            configuration.outcomes.levelVersionChosen({
              level: 'defaults',
              version: String(row.version),
            }),
          )
        }
      />
    </Form>
  )
}

export const defaultsScreen = defineScreen({
  id: 'defaults',
  title: configurationStrings.defaults,
  path: '/configuration/defaults',
  capability: 'configuration:read',
  component: DefaultsScreen,
})
