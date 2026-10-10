import { Field, Section, Value } from '@granito/ui'
import { TREATMENT_GROUPS } from '../data/groups'
import { present, valueAt } from '../data/present'
import { TREATMENT_PRESENTATION } from '../data/units'
import { configurationStrings } from '../strings'

/** De dónde sale un valor, dicho en voz baja debajo de él; o nada si no hace falta decirlo. */
export type OriginOf = (path: string) => string | undefined

/**
 * **Los valores del tratamiento, de sólo lectura** (`GR-30`).
 *
 * Los usan la configuración del merchant —con el origen de cada valor— y los
 * defaults —sin él, porque ahí todo es propio—. Cada valor es un `Field` con
 * su `Value`, que es lo que le da la línea de base; el origen va en la ayuda
 * del campo, que es el lugar de lo que se dice en voz baja sobre un dato.
 *
 * Lo que no se edita se muestra resumido: la condición de riesgo de devolución
 * en la política comercial, por si está definida; la política de decisión al
 * final, por su versión, su umbral y cuántas reglas tiene.
 */
export function TreatmentValues({
  values,
  originOf,
}: {
  /** Lo efectivo de un merchant, o el contenido de unos defaults: la misma forma. */
  readonly values: unknown
  readonly originOf?: OriginOf
}) {
  return (
    <>
      {TREATMENT_GROUPS.map((group) => (
        <Section key={group.title} title={group.title} why={group.why} columns={2}>
          {group.leaves.map((leaf) => (
            <Field
              key={leaf}
              label={configurationStrings[leaf]}
              size="medium"
              help={originOf?.(leaf)}
            >
              {() => <Value>{present(valueAt(values, leaf), TREATMENT_PRESENTATION[leaf])}</Value>}
            </Field>
          ))}
          {group.title === configurationStrings.commercialSection ? (
            <Field
              label={configurationStrings['commercialPolicy.returnRisk']}
              size="medium"
              help={originOf?.('commercialPolicy.returnRisk')}
            >
              {() => (
                <Value>
                  {valueAt(values, 'commercialPolicy.returnRisk') === undefined
                    ? ''
                    : configurationStrings.defined}
                </Value>
              )}
            </Field>
          ) : null}
        </Section>
      ))}
      <DecisionSummary values={values} originOf={originOf} />
    </>
  )
}

/** La política de decisión, resumida: no se edita acá, y viaja intacta. */
function DecisionSummary({
  values,
  originOf,
}: {
  readonly values: unknown
  readonly originOf?: OriginOf
}) {
  const rules = valueAt(values, 'decisionPolicy.rules')
  return (
    <Section
      title={configurationStrings.decisionSection}
      why={configurationStrings.decisionWhy}
      columns={2}
    >
      <Field
        label={configurationStrings['decisionPolicy.version']}
        size="medium"
        help={originOf?.('decisionPolicy')}
      >
        {() => <Value>{present(valueAt(values, 'decisionPolicy.version'))}</Value>}
      </Field>
      <Field label={configurationStrings['decisionPolicy.threshold']} size="short">
        {() => <Value>{present(valueAt(values, 'decisionPolicy.threshold'))}</Value>}
      </Field>
      <Field label={configurationStrings['decisionPolicy.rules']} size="short">
        {() => (
          <Value>{Array.isArray(rules) ? configurationStrings.rulesCount(rules.length) : ''}</Value>
        )}
      </Field>
    </Section>
  )
}
