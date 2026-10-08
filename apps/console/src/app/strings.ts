/**
 * **Lo que dice esta aplicación**, y no una de sus funcionalidades (`CU-43`).
 *
 * Acá van los textos del marco que la aplicación aporta. Los de una
 * funcionalidad **no**: viven con ella, en `features/<x>/strings.ts`, porque
 * `CU-15` no la deja importar de `app/` y porque se borran con ella.
 *
 * Los mensajes de `throw` tampoco: los lee un desarrollador, no un operador.
 */
export const appStrings = {
  /* El rótulo de abajo en la barra de usuario (`CU-27`): el alcance del operador. */
  devMode: 'Modo desarrollo',
  allMerchants: 'Todos los merchants',
  someMerchants: (count: number) => (count === 1 ? '1 merchant' : `${count} merchants`),
} as const
