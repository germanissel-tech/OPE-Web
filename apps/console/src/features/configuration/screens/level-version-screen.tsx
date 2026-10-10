import { Block, Button, Field, Form, Page, Region, Section, Value } from '@granito/ui'
import { defineScreen, Result, useOutcome, useScreenParams } from '@ope/core'
import {
  isLevel,
  type Level,
  type PlatformConfigurationVersion,
  type TreatmentDefaultsVersion,
  useLevelVersion,
} from '../data/levels'
import { PLATFORM_GROUPS } from '../data/platform-groups'
import { present, valueAt } from '../data/present'
import { PLATFORM_PRESENTATION } from '../data/units'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'
import { TreatmentValues } from './treatment-values'
import { VersionFacts } from './version-facts'

/**
 * **Una versión de un nivel global, por su número** (feature 008, escenario 4):
 * quién la publicó y por qué, y lo que contenía, de sólo lectura (`GR-30`). Se
 * llega desde el historial de la plataforma o de los defaults, y se vuelve.
 */
function LevelVersionScreen() {
  const { level, version } = useScreenParams(levelVersionScreen)
  const number = Number(version)
  const known = isLevel(level) && Number.isInteger(number) && number > 0
  const levelName =
    level === 'platform' ? configurationStrings.platform : configurationStrings.defaults

  return (
    <Page title={configurationStrings.versionTitle(levelName, version)}>
      <Region>
        <Block>
          {known ? (
            <Loaded level={level} version={number} />
          ) : (
            <Value>{configurationStrings.versionNotFound}</Value>
          )}
        </Block>
      </Region>
    </Page>
  )
}

function Loaded({ level, version }: { readonly level: Level; readonly version: number }) {
  const loaded = useLevelVersion(level, version)
  return (
    <Result
      query={loaded}
      empty={{ title: configurationStrings.versionNotFound }}
      noMatches={{ title: configurationStrings.versionNotFound }}
      filtered={false}
      isEmpty={(each) => each === undefined}
    >
      {(each) => <VersionView level={level} version={each} />}
    </Result>
  )
}

function VersionView({
  level,
  version,
}: {
  readonly level: Level
  readonly version: PlatformConfigurationVersion | TreatmentDefaultsVersion
}) {
  const { emit } = useOutcome()
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
      <VersionFacts
        version={version}
        stampedAs={version.stampedAs}
        windowsRestarted={version.windowsRestarted}
      />
      {level === 'platform' ? (
        PLATFORM_GROUPS.map((group) => (
          <Section key={group.title} title={group.title} why={group.why} columns={2}>
            {group.leaves.map((leaf) => (
              <Field key={leaf} label={configurationStrings[leaf]} size="medium">
                {() => (
                  <Value>
                    {present(valueAt(version.content, leaf), PLATFORM_PRESENTATION[leaf])}
                  </Value>
                )}
              </Field>
            ))}
          </Section>
        ))
      ) : (
        <TreatmentValues values={version.content} />
      )}
    </Form>
  )
}

export const levelVersionScreen = defineScreen({
  id: 'levelVersion',
  title: configurationStrings.versionSection,
  path: '/configuration/:level/versions/:version',
  capability: 'configuration:read',
  component: LevelVersionScreen,
})
