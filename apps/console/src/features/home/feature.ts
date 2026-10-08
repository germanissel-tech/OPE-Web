import { defineFeature, outcome } from '@ope/core'
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
     no sabe que los merchants existen, y la comprobación de límites se encarga
     de que siga sin saberlo. */
  outcomes: {
    merchantsRequested: outcome<{ from: string }>('home.merchantsRequested'),
  },
  userMenuEntries: [{ id: 'about', label: aboutScreen.title, screen: aboutScreen }],
})
