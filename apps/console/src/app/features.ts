import type { Feature } from '@ope/core'
import { home } from '../features/home/feature'
import { merchants } from '../features/merchants/feature'

/**
 * **Las funcionalidades de esta aplicación. Un renglón cada una.**
 *
 * Es el único archivo que se toca al agregar una: sus pantallas, sus rutas, su
 * lugar en el menú, sus entradas del menú de usuario y sus desenlaces salen de
 * lo que ella declara en su `feature.ts`.
 *
 * **Se escriben a mano; no se descubren solas.** Un `import.meta.glob` ahorra
 * este renglón y a cambio nadie puede leer qué entra en el artefacto — el
 * porqué completo está en `CU-42`.
 *
 * `merchants` es el hola mundo de OPE-Console: la primera colección real del
 * backend, de la que se copian las pantallas del panel.
 */
export const features: readonly Feature[] = [home, merchants]
