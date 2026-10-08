import {
  type ApplicationManifest,
  type BaseConfig,
  composeFeatures,
  defineApplication,
} from '@ope/core'
import { currentMerchant, preferences } from './chrome'
import { features } from './features'
import { flows, menu } from './flows'
import { identity } from './identity'

/**
 * **Por dónde se empieza a leer OPE-Console** (`CU-42`).
 *
 * Junta las partes y **no decide nada por su cuenta**: cada una vive en su
 * archivo porque cambian por razones distintas y en momentos distintos.
 *
 * **Qué decide cada archivo está en [`README.md`](README.md)**, y en un solo
 * lugar.
 *
 * **Esto no crece con el sistema.** Una funcionalidad nueva es un renglón de
 * `features.ts`, y sus pantallas, rutas, menú y entradas propias salen de lo
 * que ella declara.
 *
 * Recibe la configuración porque la identidad necesita saber contra qué
 * sistema preguntar quién es el operador, y eso se lee al arrancar (`CU-17`).
 */
export function createManifest(config: BaseConfig): ApplicationManifest {
  const { screens, featureRootOf, userMenuEntries, outcomes, outcomesOf } =
    composeFeatures(features)

  const { toCapabilities, userCaption } = identity(config)

  return defineApplication({
    name: 'OPE-Console',
    screens,
    systems: Object.keys(config.systems),
    toCapabilities,
    userCaption,
    outcomes,
    featureRootOf,
    outcomesOf,

    /* Cómo se atraviesa esta aplicación (`CU-47`), y qué ofrece el menú
       lateral (`CU-48`). */
    flows,
    menu,
    userMenu: { entries: userMenuEntries, preferences },

    /* Los contextos de trabajo de esta aplicación (`CU-26`). Lo que no está
       acá no existe. */
    contexts: [currentMerchant],

    /* **Qué contexto propio acompaña a cada evento del registro** (`CU-35`).
       El valor es **un contexto de trabajo y no un texto**, así que meter acá un
       dato de una persona necesita un paso deliberado. */
    telemetry: { envelope: { merchant: currentMerchant } },
  })
}
