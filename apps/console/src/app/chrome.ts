import { type AnyPreference, defineWorkContext, standardPreferences } from '@ope/core'

/**
 * **Cómo se ve el marco en esta aplicación.**
 *
 * Lo del marco que decide la aplicación y no una funcionalidad. Hoy son las
 * preferencias del operador y el contexto de trabajo; acá van también las
 * vistas de sesión y la pantalla de «sin permisos» cuando esta aplicación
 * quiera las suyas en vez de las que trae el marco.
 */

/**
 * Las preferencias que esta aplicación ofrece.
 *
 * `standardPreferences` son las dos que trae el marco —el tema y los globos de
 * ayuda—, cambiables por el operador. Al escribir la tuya:
 *
 * ```ts
 * preferences: [theme, tooltips]              // sólo algunas
 * preferences: [fixed(theme, 'dark'), …]      // fija, sin interruptor
 * preferences: [...standardPreferences, mía]  // una propia, en su archivo
 * ```
 *
 * **La lista es la que manda.** Sacar una de acá la saca del menú, y también
 * apaga lo que un operador hubiera elegido antes.
 */
export const preferences: readonly AnyPreference[] = [...standardPreferences]

/**
 * **El merchant sobre el que se opera** (`CU-26`).
 *
 * Un operador de OPE trabaja un rato sobre un merchant —su configuración, sus
 * experimentos, su registro— y después sobre otro. Vive en la pestaña y no en
 * la máquina: cambia varias veces por día, y uno que quedó puesto de ayer
 * manda a mirar el merchant equivocado. Las pantallas del panel lo leen con
 * `useWorkContext(currentMerchant)`; el hola mundo todavía no.
 */
export const currentMerchant = defineWorkContext('merchant', 'tab')
