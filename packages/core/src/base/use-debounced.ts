import { useEffect, useState } from 'react'

/**
 * El valor, **recién cuando el operador dejó de escribir**.
 *
 * Un filtro de texto que consulta por tecla manda una tormenta de pedidos que
 * además **llega desordenada**: la respuesta de `amox` puede volver después de
 * la de `amoxi` y pisarla con datos viejos. Con TanStack la clave de caché
 * cambia en cada tecla, así que además se guarda una entrada por prefijo.
 *
 * granito ya lo resolvió para su `ComboBox` y escribió la razón; el número es
 * el suyo, para que la familia se comporte igual. Lo que no tiene es una forma
 * de usarlo afuera, así que esto es la misma idea donde hace falta.
 *
 * **El control no se frena**: lo que se demora es la consulta. Quien escribe ve
 * su texto en el acto, que es lo que separa esto de un formulario lento.
 */

/** Cuánto se espera después de la última tecla. Es el de `ComboBox` de granito. */
export const TYPING_DELAY_MS = 250

export function useDebounced<T>(value: T, delayMs: number = TYPING_DELAY_MS): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return settled
}
