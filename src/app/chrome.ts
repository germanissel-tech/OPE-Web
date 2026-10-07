import { type AnyPreference, defineWorkContext, standardPreferences } from '@cuarzo/core'

/**
 * **Cómo se ve el marco en esta aplicación.**
 *
 * Lo del marco que decide la aplicación y no una funcionalidad. Hoy son las
 * preferencias del operador; acá van también las vistas de sesión y la pantalla
 * de «sin permisos» cuando esta aplicación quiera las suyas en vez de las que
 * trae el marco.
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
 * **La sucursal con la que se opera** (`CU-26`).
 *
 * Vive en la máquina porque casi nunca cambia, y volver a elegirla cada mañana
 * es fricción diaria. Al clonar, cada aplicación declara los suyos: una terminal
 * de mostrador y un panel de administración no trabajan sobre lo mismo.
 */
export const currentBranch = defineWorkContext('branch', 'machine')
