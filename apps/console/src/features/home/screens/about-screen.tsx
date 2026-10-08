import { Alert, Block, Page, Region } from '@granito/ui'
import { defineScreen } from '@ope/core'
import { homeStrings } from '../strings'

/**
 * **Es parte del hola mundo de cuarzo, no una funcionalidad.** Se borra junto
 * con la de inicio — ver el `README.md` de `features/`.
 *
 * Está para mostrar **la otra forma de llegar a una pantalla**: no aparece en el
 * menú lateral —al menú entra un flujo, y el suyo no está en la lista
 * (`CU-48`)— y se abre desde el menú de usuario, que la declara con `screen` y
 * no con `onSelect` (`CU-27`, `CU-41`). Si mañana esta
 * ruta cambiara, el enlace del menú no se puede romper: no compila.
 */
function AboutScreen() {
  return (
    <Page title={homeStrings.about}>
      <Region>
        <Block>
          <Alert severity="info" title={homeStrings.notInSideMenu}>
            {homeStrings.notInSideMenuHelp}
          </Alert>
        </Block>
      </Region>
    </Page>
  )
}

export const aboutScreen = defineScreen({
  id: 'about',
  title: homeStrings.about,
  path: '/about',
  component: AboutScreen,
})
