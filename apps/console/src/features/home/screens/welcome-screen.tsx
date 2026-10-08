import { Alert, Block, Button, Page, Region } from '@granito/ui'
import { defineScreen, useOutcome } from '@ope/core'
import { home } from '../feature'
import { homeStrings } from '../strings'

/**
 * **Es el hola mundo de cuarzo, no una funcionalidad.** Se borra cuando la
 * aplicación escribe su primera pantalla propia — ver el `README.md` de
 * `features/`.
 *
 * La pantalla de inicio. Declara la ruta raíz, así que el marco no dibuja la
 * suya.
 *
 * **Enlaza a los merchants sin conocerlos** (`CU-44`): informa un desenlace, y a
 * dónde lleva lo dice el paso del flujo activo, en `app/flows.ts` (`CU-47`).
 * `CU-15` sigue prohibiendo que una funcionalidad importe de otra, y acá no
 * hace falta.
 */
function WelcomeScreen() {
  const { emit } = useOutcome()

  return (
    <Page title={homeStrings.navigates}>
      <Region>
        <Block>
          <Alert severity="success" title={homeStrings.menuFromRegistry}>
            {homeStrings.menuFromRegistryHelp}
          </Alert>
          <Button onClick={() => emit(home.outcomes.merchantsRequested({ from: 'home' }))}>
            {homeStrings.goToMerchants}
          </Button>
        </Block>
      </Region>
    </Page>
  )
}

export const welcomeScreen = defineScreen({
  id: 'welcome',
  title: homeStrings.home,
  path: '/',
  component: WelcomeScreen,
})
