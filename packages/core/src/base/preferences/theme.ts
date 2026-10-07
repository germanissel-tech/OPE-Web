import { defaultTheme } from '@granito/tokens'
import { applyTheme, THEME_ICONS, type Theme, themeLabel, themes } from '@granito/ui'
import { definePreference } from '../preference'

/**
 * El tema.
 *
 * **Es entero de granito** (`granito#PED-4`, `granito#PED-5`): los nombres
 * salen del mismo lugar que genera los selectores del CSS, `applyTheme` sabe
 * que uno de los temas es la **ausencia** del atributo, y el rótulo y el icono
 * los pone quien conoce sus temas.
 *
 * Acá no se escribe ningún nombre de tema, ningún texto y ningún dibujo. Lo
 * único nuestro es **que el renglón rota**: que elegirlo lleve al siguiente en
 * vez de abrir una lista. Eso sí es del menú de usuario (`CU-27`).
 */

export type { Theme }

export const theme = definePreference<Theme>({
  id: 'theme',
  initial: defaultTheme,
  /* Lo que vuelve del almacén no es un tema hasta que se lo encuentra en la
     lista de granito. Cualquier otra cosa cae al de por omisión. */
  parse: (raw) => themes.find((known) => known === raw) ?? defaultTheme,
  apply: applyTheme,
  choice: (value) => {
    const next = themes[(themes.indexOf(value) + 1) % themes.length] ?? defaultTheme
    return { label: themeLabel(next), icon: THEME_ICONS[next], next }
  },
})
