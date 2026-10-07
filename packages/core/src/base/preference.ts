/**
 * **Una preferencia se declara; el núcleo no conoce ninguna** (`CU-26`, `CU-27`).
 *
 * Una preferencia nueva es **un archivo y un renglón** en la lista que declara
 * la aplicación. Nada del marco la nombra: ni el proveedor, ni la barra, ni la
 * raíz de composición. Lo verifica la regla 9 de `quality.mjs`.
 *
 * Y **«cambiable» no es un valor**. Ser cambiable es tener `choice`; estar fijo
 * es haber pasado por `fixed`. Modelarlo como una opción más al lado de los
 * valores mezcla «quién elige» con «qué se eligió», y admite combinaciones que
 * no significan nada.
 */

import type { ReactNode } from 'react'
import type { Strings } from './strings'

/** Lo que declara quien escribe una preferencia. */
export type PreferenceSpec<T> = {
  /** Con qué se guarda. Se estampa con el sujeto del lado del almacén. */
  readonly id: string
  readonly initial: T
  /**
   * Cómo se valida lo guardado. **Nunca se confía en lo que vuelve del
   * almacén**: es texto que escribió otra versión de la aplicación, o nadie.
   */
  readonly parse: (raw: unknown) => T
  /** Qué hace en el documento, si hace algo. */
  readonly apply?: (value: T) => void
  /**
   * Qué dice su renglón del menú, con qué se dibuja, y **qué valor deja al
   * elegirlo**.
   *
   * Los tres juntos a propósito: separados, un renglón puede decir «Tema
   * oscuro», mostrar un sol y dejar el claro, y eso no lo agarra nada.
   *
   * **Sin `choice` no hay renglón**: la preferencia existe y el operador no la
   * cambia. Es lo que devuelve `fixed`.
   */
  readonly choice?: (
    value: T,
    strings: Strings,
  ) => {
    readonly label: string
    /** De granito. El marco no dibuja iconos propios (principio IV). */
    readonly icon?: ReactNode
    readonly next: T
  }
}

/**
 * Lo que maneja el registro: **todo crudo**.
 *
 * La lista de preferencias de una aplicación es heterogénea —un tema, un
 * booleano, lo que venga—, así que el registro no puede tener el tipo. `parse`
 * es el único puente, y por eso todo vuelve a pasar por él antes de usarse.
 */
export type AnyPreference = {
  readonly id: string
  readonly initial: unknown
  readonly parse: (raw: unknown) => unknown
  readonly apply: (raw: unknown) => void
  readonly choice?: (
    raw: unknown,
    strings: Strings,
  ) => {
    readonly label: string
    readonly icon?: ReactNode
    readonly next: unknown
  }
}

/** Lo mismo, sin perder el tipo de su valor para quien la declaró. */
export type Preference<T> = AnyPreference & {
  /** Lo declarado, tipado. De acá salen la lectura tipada y `fixed`. */
  readonly typed: PreferenceSpec<T>
}

/**
 * Declara una preferencia.
 *
 * Lo que devuelve tiene las dos caras: la cruda que usa el registro, ya
 * compuesta con `parse`, y la tipada que conserva `T`. **No hay un solo `as`**
 * en el medio, y no lo hay porque `parse` corre de verdad.
 */
export function definePreference<T>(spec: PreferenceSpec<T>): Preference<T> {
  const { apply, choice } = spec

  return {
    id: spec.id,
    initial: spec.initial,
    parse: spec.parse,
    apply: apply ? (raw) => apply(spec.parse(raw)) : () => {},
    choice: choice ? (raw, strings) => choice(spec.parse(raw), strings) : undefined,
    typed: spec,
  }
}

/**
 * La misma preferencia, **fija en un valor**.
 *
 * Es lo que `CU-27` pide en una función: quitar el interruptor no alcanza, hay
 * que fijar el valor. Acá las dos cosas pasan juntas y no se pueden separar —
 * `parse` deja de mirar lo guardado, así que una preferencia que el operador
 * eligió antes **no puede volver**, y sin `choice` no hay renglón que la
 * ofrezca.
 */
export function fixed<T>(preference: Preference<T>, value: T): Preference<T> {
  return definePreference({
    ...preference.typed,
    initial: value,
    parse: () => value,
    choice: undefined,
  })
}
