import { useState } from 'react'

/**
 * **Lo que se leyó al abrir, y no se mueve más** (`CU-29`).
 *
 * Una pantalla que edita necesita dos cosas quietas: **con qué comparar** y
 * **sobre qué versión escribe**. Las dos salen de una consulta, y una consulta
 * se mueve sola — una invalidación, una relectura, volver a la pestaña. Leerlas
 * de ahí en cada dibujo parece lo natural y es el defecto:
 *
 * - La referencia se corre a lo que el servidor tiene **ahora**, así que la
 *   comparación termina comparando el registro contra sí mismo y no ve el cruce.
 * - Y el testigo se corre con ella, así que el guardado sale con uno **nuevo** y
 *   el servidor lo acepta — llevando los campos que el operador no tocó tal como
 *   estaban al abrir.
 *
 * Juntos dan el peor resultado posible: después del diálogo de conflicto,
 * «seguir editando» y guardar **le borra el cambio al otro sin rechazo y sin
 * diálogo**. La protección entera, salteada por el único camino que no pasa por
 * ella.
 *
 * Es `useState` con el nombre puesto, y el nombre es lo que se puede verificar:
 * una comprobación mira que toda pantalla que declara `loaded:` lo nombre.
 */
export function useLoadedOnce<T>(value: T): T {
  /* El primero y ninguno más. El argumento se sigue evaluando en cada dibujo
     —es barato— y lo que se devuelve es siempre el de la primera vez. */
  const [first] = useState(value)
  return first
}
