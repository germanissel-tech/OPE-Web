import { Badge, Field, Section, Value } from '@granito/ui'
import { sharedStrings } from '../../../components/strings'
import type { VersionRow } from '../../../components/version-history'
import { When } from '../../../components/when'
import { configurationStrings } from '../strings'

/**
 * **Quién publicó una versión, cuándo y por qué** (feature 008, research §11):
 * lo que el historial dice en una fila, dicho como campos de sólo lectura
 * (`GR-30`) al abrir esa versión. En los niveles globales, además, el nombre
 * que estampan las decisiones y qué mediciones reinició.
 */
export function VersionFacts({
  version,
  stampedAs,
  windowsRestarted,
}: {
  readonly version: VersionRow
  readonly stampedAs?: string | undefined
  readonly windowsRestarted?: readonly string[] | undefined
}) {
  return (
    <Section
      title={configurationStrings.versionSection}
      why={configurationStrings.versionWhy}
      columns={3}
    >
      <Field label={sharedStrings.version} size="short">
        {() => <Value>{String(version.version)}</Value>}
      </Field>
      {stampedAs === undefined ? null : (
        <Field label={configurationStrings.versionName} size="medium">
          {() => <Value>{stampedAs}</Value>}
        </Field>
      )}
      <Field label={sharedStrings.publishedAtUtc} size="medium">
        {() => (
          <Value>
            <When instant={version.publishedAt} />
          </Value>
        )}
      </Field>
      <Field label={sharedStrings.operator} size="medium">
        {() => <Value>{version.operatorId}</Value>}
      </Field>
      <Field label={sharedStrings.kind} size="short">
        {() => (
          <Value>
            {version.corrective ? (
              <Badge tone="warning">{sharedStrings.corrective}</Badge>
            ) : (
              <Badge tone="neutral">{sharedStrings.regular}</Badge>
            )}
          </Value>
        )}
      </Field>
      {version.reason === undefined ? null : (
        <Field label={sharedStrings.reason} size="fill">
          {() => <Value>{version.reason}</Value>}
        </Field>
      )}
      {windowsRestarted === undefined || windowsRestarted.length === 0 ? null : (
        <Field label={configurationStrings.windowsRestarted} size="fill">
          {() => <Value>{windowsRestarted.join(', ')}</Value>}
        </Field>
      )}
    </Section>
  )
}
