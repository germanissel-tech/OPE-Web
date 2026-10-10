import { Block, Field, Page, Region, Section, Value } from '@granito/ui'
import { defineScreen, Result, useOutcome, type Witnessed } from '@ope/core'
import { useState } from 'react'
import { defaultsBodyOf, defaultsConstraints, defaultsFormOf } from '../data/level-body'
import {
  publishTreatmentDefaults,
  type TreatmentDefaults,
  useTreatmentDefaults,
} from '../data/levels'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'
import { PublishLevelForm } from './publish-level-form'
import { TreatmentFields } from './treatment-fields'

/**
 * **Publicar una versión de los defaults de tratamiento** (feature 008,
 * escenario 4).
 *
 * Todo propio y todo precargado. La política de decisión y el riesgo de
 * devolución no se editan acá: se dicen, y viajan tal cual rigen al abrir
 * (data-model §3).
 */
function PublishDefaultsScreen() {
  const defaults = useTreatmentDefaults()

  return (
    <Page title={configurationStrings.publishDefaultsTitle}>
      <Region>
        <Block>
          <Result
            query={defaults}
            empty={{ title: configurationStrings.levelNotFound }}
            noMatches={{ title: configurationStrings.levelNotFound }}
            filtered={false}
            isEmpty={(loaded) => loaded === undefined}
          >
            {(loaded) => <PublishDefaults inForce={loaded} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function PublishDefaults({ inForce }: { readonly inForce: Witnessed<TreatmentDefaults> }) {
  const { emit } = useOutcome()
  const [initial] = useState(() => defaultsFormOf(inForce))

  return (
    <PublishLevelForm
      action={publishTreatmentDefaults}
      initial={initial}
      inForce={inForce.version}
      witness={inForce.witness}
      constraintsOf={defaultsConstraints}
      bodyOf={(values, shown) => defaultsBodyOf(values, shown, inForce)}
      onPublished={() => emit(configuration.outcomes.defaultsPublished({ from: 'publish' }))}
      onCancel={() => emit(configuration.outcomes.levelPublishCancelled({ from: 'publish' }))}
    >
      {(form, constraints) => (
        <>
          <TreatmentFields
            form={form}
            prefix="content"
            shown={initial.shown}
            constraints={constraints}
          />
          {/* Lo que no se edita acá, dicho: viaja tal cual rige. */}
          <Section
            title={configurationStrings.carriedSection}
            why={configurationStrings.carriedDefaultsWhy}
            columns={2}
          >
            <Field label={configurationStrings.decisionSection} size="medium">
              {() => <Value>{inForce.decisionPolicy.version}</Value>}
            </Field>
            <Field label={configurationStrings['commercialPolicy.returnRisk']} size="medium">
              {() => <Value>{configurationStrings.defined}</Value>}
            </Field>
          </Section>
        </>
      )}
    </PublishLevelForm>
  )
}

export const publishDefaultsScreen = defineScreen({
  id: 'publishDefaults',
  title: configurationStrings.publishDefaultsTitle,
  path: '/configuration/defaults/publish',
  /* Igual que la plataforma: el alcance total lo exige el botón que lleva acá. */
  capability: 'configuration:write',
  component: PublishDefaultsScreen,
})
