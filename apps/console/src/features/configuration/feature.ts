import { defineFeature, outcome } from '@ope/core'
import { merchantConfigurationScreen } from './screens/merchant-configuration-screen'
import { platformScreen } from './screens/platform-screen'

/**
 * **La configuración versionada** (feature 008): los tres niveles —la de cada
 * merchant, la de plataforma y los defaults de tratamiento—, vistos, recorridos
 * y publicados.
 *
 * No sabe que la ficha de un merchant existe: la ficha emite su desenlace, y
 * `app/flows.ts` dice que abre la configuración. Las funcionalidades se componen
 * allá, no importándose (`CU-15`).
 */
export const configuration = defineFeature({
  screens: [platformScreen, merchantConfigurationScreen],

  /* La plataforma es la raíz: es la primera entrada del menú y no tiene
     parámetros, que es lo que una raíz necesita para que un cerrar sin pila
     tenga a dónde caer. */
  root: platformScreen,

  outcomes: {
    /* La vista de un merchant terminó: vuelve a donde se la pidió. */
    merchantConfigurationClosed: outcome<{ merchantId: string }>(
      'configuration.merchantConfigurationClosed',
    ),
  },
})
