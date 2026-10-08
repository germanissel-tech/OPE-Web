import {
  type ApplicationManifest,
  type BaseConfig,
  composeFeatures,
  defineApplication,
} from '@ope/core'
import { currentBranch, preferences } from './chrome'
import { features } from './features'
import { flows, menu } from './flows'
import { identity } from './identity'

/**
 * **Por dónde se empieza a leer una aplicación de Tandilia** (`CU-42`).
 *
 * Junta las partes y **no decide nada por su cuenta**: cada una vive en su
 * archivo porque cambian por razones distintas y en momentos distintos.
 *
 * **Qué decide cada archivo está en [`README.md`](README.md)**, y en un solo
 * lugar: una tabla de archivos repetida acá se despega la primera vez que se
 * agrega uno, porque nadie viene a este comentario a actualizarla.
 *
 * **Esto no crece con el sistema.** Una funcionalidad nueva es un renglón de
 * `features.ts`, y sus pantallas, rutas, menú y entradas propias salen de lo
 * que ella declara.
 *
 * Recibe la configuración porque la traducción de capacidades necesita saber
 * cuál es el client de esta aplicación, y eso se lee al arrancar (`CU-17`).
 */
export function createManifest(config: BaseConfig): ApplicationManifest {
  const { screens, featureRootOf, userMenuEntries, outcomes, outcomesOf } =
    composeFeatures(features)

  return defineApplication({
    name: 'Cuarzo',
    screens,
    systems: Object.keys(config.systems),
    ...identity(config),
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
    contexts: [currentBranch],

    /* **Qué contexto propio acompaña a cada evento del registro** (`CU-35`).
       Los eventos los declara cuarzo; el contexto que los describe, no — una
       terminal de mostrador y un panel no se describen igual.

       El valor es **un contexto de trabajo y no un texto**, así que meter acá un
       dato de una persona necesita un paso deliberado. */
    telemetry: { envelope: { branch: currentBranch } },
  })
}
