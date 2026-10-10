import { defineFeature, outcome } from '@ope/core'
import type { Level } from './data/levels'
import { defaultsScreen } from './screens/defaults-screen'
import { levelVersionScreen } from './screens/level-version-screen'
import { merchantConfigurationScreen } from './screens/merchant-configuration-screen'
import { merchantVersionScreen } from './screens/merchant-version-screen'
import { platformScreen } from './screens/platform-screen'
import { publishDefaultsScreen } from './screens/publish-defaults-screen'
import { publishMerchantConfigurationScreen } from './screens/publish-merchant-configuration-screen'
import { publishPlatformScreen } from './screens/publish-platform-screen'

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
  screens: [
    platformScreen,
    merchantConfigurationScreen,
    publishMerchantConfigurationScreen,
    defaultsScreen,
    publishPlatformScreen,
    publishDefaultsScreen,
    levelVersionScreen,
    merchantVersionScreen,
  ],

  /* La plataforma es la raíz: es la primera entrada del menú y no tiene
     parámetros, que es lo que una raíz necesita para que un cerrar sin pila
     tenga a dónde caer. */
  root: platformScreen,

  outcomes: {
    /* La vista de un merchant terminó: vuelve a donde se la pidió. */
    merchantConfigurationClosed: outcome<{ merchantId: string }>(
      'configuration.merchantConfigurationClosed',
    ),

    /* Publicar una versión del merchant: la vista la pide, y la publicación
       termina publicada o se cancela. */
    merchantPublishRequested: outcome<{ merchantId: string }>(
      'configuration.merchantPublishRequested',
    ),
    merchantConfigurationPublished: outcome<{ merchantId: string }>(
      'configuration.merchantConfigurationPublished',
    ),
    merchantPublishCancelled: outcome<{ merchantId: string }>(
      'configuration.merchantPublishCancelled',
    ),

    /* Publicar un nivel global: lo mismo, desde su vista y de vuelta a ella. */
    platformPublishRequested: outcome<{ from: string }>('configuration.platformPublishRequested'),
    platformPublished: outcome<{ from: string }>('configuration.platformPublished'),
    defaultsPublishRequested: outcome<{ from: string }>('configuration.defaultsPublishRequested'),
    defaultsPublished: outcome<{ from: string }>('configuration.defaultsPublished'),
    levelPublishCancelled: outcome<{ from: string }>('configuration.levelPublishCancelled'),

    /* Abrir una versión del historial, de sólo lectura, y volver. El número
       viaja como texto: es un parámetro de la dirección. */
    levelVersionChosen: outcome<{ level: Level; version: string }>(
      'configuration.levelVersionChosen',
    ),
    merchantVersionChosen: outcome<{ merchantId: string; version: string }>(
      'configuration.merchantVersionChosen',
    ),
    versionClosed: outcome<{ from: string }>('configuration.versionClosed'),
  },
})
