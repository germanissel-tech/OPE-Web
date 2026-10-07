import { defineFeature, outcome } from '@cuarzo/core'
import { aboutScreen } from './screens/about-screen'
import { welcomeScreen } from './screens/welcome-screen'

/**
 * Lo que esta funcionalidad aporta.
 *
 * **La entrada del menú de usuario vive acá, con la pantalla que abre.** Si
 * estuviera en el manifiesto, agregar la funcionalidad y agregar su entrada
 * serían dos pasos, y el segundo es el que se olvida.
 */
export const home = defineFeature({
  screens: [welcomeScreen, aboutScreen],
  root: welcomeScreen,

  /* El nombre dice **qué pasó**, no a dónde ir (`CU-44`). Esta funcionalidad
     no sabe que el catálogo existe, y la comprobación de límites se encarga
     de que siga sin saberlo. */
  outcomes: {
    catalogRequested: outcome<{ from: string }>('home.catalogRequested'),
  },
  userMenuEntries: [{ id: 'about', label: aboutScreen.title, screen: aboutScreen }],
})
