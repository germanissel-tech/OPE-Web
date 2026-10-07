import { definePreference } from '../preference'

/**
 * Los globos de ayuda.
 *
 * **No tiene `apply`**, y es la única así: no se pone en el documento, sino que
 * llega a granito por la prop del `AppShell`, que lo reparte por contexto a
 * cada `Tooltip`. Por eso el marco la lee por nombre en un solo lugar.
 *
 * El mecanismo es entero de granito, incluido que los globos marcados
 * `essential` **no se apaguen nunca** — el globo de un botón deshabilitado es
 * lo que dice por qué no se puede confirmar. Acá sólo se guarda la preferencia,
 * que por `CU-26` es de la aplicación.
 */
export const tooltips = definePreference<boolean>({
  id: 'tooltips',
  initial: true,
  /* Se apagan sólo si alguien los apagó: cualquier otra cosa guardada deja los
     globos puestos, que es lo que no le falta a nadie. */
  parse: (raw) => raw !== false,
  choice: (value, strings) => ({
    label: value ? strings.hideTooltips : strings.showTooltips,
    next: !value,
  }),
})
