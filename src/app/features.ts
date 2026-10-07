import type { Feature } from '@cuarzo/core'
import { catalog } from '../features/catalog/feature'
import { home } from '../features/home/feature'

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
 * Al clonar se borran las dos y queda la primera propia.
 */
export const features: readonly Feature[] = [home, catalog]
