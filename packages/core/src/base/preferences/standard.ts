import type { AnyPreference } from '../preference'
import { theme } from './theme'
import { tooltips } from './tooltips'

/**
 * Las dos que trae el marco, para que una aplicación no las escriba de nuevo.
 *
 * **No son un valor por omisión.** Una aplicación que no declara preferencias
 * no tiene ninguna, y eso es deliberado: `CU-27` pide que quitar se declare, y
 * la otra mitad es que tener también se declare. Un menú con un interruptor que
 * nadie decidió poner es el mismo problema con el signo cambiado.
 *
 * ```ts
 * preferences: [...standardPreferences]        // las dos, cambiables
 * preferences: [fixed(theme, 'dark'), tooltips] // el tema fijo, los globos no
 * preferences: [theme]                          // sin globos: no existe la preferencia
 * ```
 */
export const standardPreferences: readonly AnyPreference[] = [theme, tooltips]
