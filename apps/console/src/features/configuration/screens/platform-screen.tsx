import { Block, Field, Form, Page, Region, Section, Value } from '@granito/ui'
import { defineScreen, Result, useTableQuery } from '@ope/core'
import { VersionHistory } from '../../../components/version-history'
import {
  type PlatformConfiguration,
  usePlatformConfiguration,
  usePlatformVersions,
} from '../data/levels'
import { PLATFORM_GROUPS } from '../data/platform-groups'
import { present, valueAt } from '../data/present'
import { PLATFORM_PRESENTATION } from '../data/units'
import { configurationStrings } from '../strings'

/**
 * **La configuración de plataforma** (feature 008, escenarios 8 y 11): la
 * versión que rige por su nombre, sus valores en su unidad, y el historial.
 *
 * Es la raíz de la funcionalidad: la primera entrada de su menú y a donde cae
 * un cerrar sin pila. Lo mismo para todos los merchants, así que no tiene
 * parámetros.
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
  const table = useTableQuery('versions')
  const versions = usePlatformVersions({ from: table.cursor, onCursor: table.setCursor })

  return (
    <Form onSubmit={(event) => event.preventDefault()}>
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
        extra={[
          {
            id: 'stampedAs',
            header: configurationStrings.versionName,
            width: '130px',
            cell: (row) => row.stampedAs,
          },
          {
            id: 'windowsRestarted',
            header: configurationStrings.windowsRestarted,
            width: '200px',
            cell: (row) => (row.windowsRestarted ?? []).join(', '),
          },
        ]}
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
