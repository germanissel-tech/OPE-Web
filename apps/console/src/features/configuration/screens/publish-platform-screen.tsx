import { Block, Page, Region } from '@granito/ui'
import { defineScreen, Result, useOutcome, type Witnessed } from '@ope/core'
import { useState } from 'react'
import { platformBodyOf, platformConstraints, platformFormOf } from '../data/level-body'
import {
  type PlatformConfiguration,
  publishPlatformConfiguration,
  usePlatformConfiguration,
} from '../data/levels'
import { PLATFORM_GROUPS } from '../data/platform-groups'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'
import { PublishLevelForm } from './publish-level-form'
import { ValueFields } from './treatment-fields'

/**
 * **Publicar una versión de la plataforma** (feature 008, escenario 4).
 *
 * Todo propio y todo precargado con lo que rige. Cuatro valores deciden qué se
 * cuenta: cambiarlos con un experimento activo vuelve `409`, y la pantalla
 * pasa a correctiva sin perder nada.
 */
function PublishPlatformScreen() {
  const platform = usePlatformConfiguration()

  return (
    <Page title={configurationStrings.publishPlatformTitle}>
      <Region>
        <Block>
          <Result
            query={platform}
            empty={{ title: configurationStrings.levelNotFound }}
            noMatches={{ title: configurationStrings.levelNotFound }}
            filtered={false}
            isEmpty={(loaded) => loaded === undefined}
          >
            {(loaded) => <PublishPlatform inForce={loaded} />}
          </Result>
        </Block>
      </Region>
    </Page>
  )
}

function PublishPlatform({ inForce }: { readonly inForce: Witnessed<PlatformConfiguration> }) {
  const { emit } = useOutcome()
  /* La precarga se calcula una vez: lo que rige al abrir es contra lo que se
     compara si hay cambios. */
  const [initial] = useState(() => platformFormOf(inForce))

  return (
    <PublishLevelForm
      action={publishPlatformConfiguration}
      initial={initial}
      inForce={inForce.version}
      witness={inForce.witness}
      constraintsOf={platformConstraints}
      bodyOf={platformBodyOf}
      onPublished={() => emit(configuration.outcomes.platformPublished({ from: 'publish' }))}
      onCancel={() => emit(configuration.outcomes.levelPublishCancelled({ from: 'publish' }))}
    >
      {(form, constraints) => (
        <ValueFields
          form={form}
          prefix="content"
          groups={PLATFORM_GROUPS}
          shown={initial.shown}
          constraints={constraints}
        />
      )}
    </PublishLevelForm>
  )
}

export const publishPlatformScreen = defineScreen({
  id: 'publishPlatform',
  title: configurationStrings.publishPlatformTitle,
  path: '/configuration/platform/publish',
  /* Exige escribir; el alcance sobre todos los merchants lo exige el botón que
     lleva acá, y si se llega por la dirección lo rechaza el backend. */
  capability: 'configuration:write',
  component: PublishPlatformScreen,
})
