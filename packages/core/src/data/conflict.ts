/**
 * **Qué cambió de lo que el operador tocó** (`CU-29`).
 *
 * Cuando el servidor rechaza una escritura porque el registro cambió mientras
 * se editaba, hay que decidir una de dos cosas: guardar igual, o preguntar. Esto
 * calcula cuál, y **no es un comparador general**.
 *
 * ## La regla, y por qué es más angosta de lo que parece
 *
 * Un campo entra al choque si **el operador lo cambió** y **además cambió en el
 * servidor**. Las dos condiciones, no una.
 *
 * Si otro corrigió el domicilio mientras éste corregía el teléfono, **no hay
 * conflicto real**: se guarda sobre la versión nueva y nadie se entera. Ése es
 * el caso frecuente, y es el que decide si esto es una protección o un estorbo
 * diario — mostrar «alguien más lo editó» cada vez que dos personas tocan
 * campos distintos entrena a apretar «continuar» sin leer.
 *
 * `CU-29` lo dice así: *«suele ser una lista de uno o dos campos»*.
 *
 * ## Lo que no hace
 *
 * **No resuelve.** No fusiona, no elige, no propone. Devuelve qué se cruza y
 * quién decide es el operador.
 *
 * **No sabe si dos campos están atados** por una regla de negocio — cambiar el
 * domicilio puede obligar a revisar la localidad. Eso es de la aplicación, y
 * `CU-29` dice que lo declara ella. Todavía no hay ningún caso real, así que no
 * se le inventa una forma: lo que sí se sostiene es que **el día que exista, la
 * lista de campos que entran se amplía y el cálculo no cambia** — por eso se
 * arma como un conjunto de nombres antes de convertirse en el resultado.
 */

/** Un campo que se cruza: qué había al abrir, y qué hay ahora. */
export type Clash = {
  readonly field: string
  /** Lo que el operador vio cuando cargó el registro. */
  readonly whenOpened: unknown
  /** Lo que el servidor tiene ahora, puesto por otro. */
  readonly now: unknown
}

type Values = Readonly<Record<string, unknown>>

/**
 * Los campos donde lo que el operador cambió se cruza con lo que cambió el otro.
 *
 * **Lista vacía significa que se puede guardar sin preguntar**, y ése es el
 * resultado más común. No es un caso de borde: es el caso.
 *
 * Compara por identidad de valor, que alcanza para lo que hay —campos planos de
 * un catálogo—. Un recurso con estructuras anidadas va a necesitar más, y
 * **todavía no existe ninguno**: darle forma ahora sería adivinarla con el
 * primer consumidor.
 */
export function clashBetween(
  loaded: Values,
  onScreen: Values,
  fromServer: Values,
): readonly Clash[] {
  /* **El conjunto es el punto de ampliación.** Los campos atados, el día que se
     declaren, agregan nombres acá y nada más abajo cambia. */
  const clashing = new Set<string>()

  for (const field of Object.keys(loaded)) {
    const edited = !Object.is(onScreen[field], loaded[field])
    const moved = !Object.is(fromServer[field], loaded[field])
    /**
     * **Y que hayan llegado a valores distintos**, que es la condición que
     * `CU-29` no nombra.
     *
     * Los dos tocaron el precio y los dos pusieron `2600`: está en la
     * intersección, y **no hay nada que decidir**. Preguntar ahí es la misma
     * clase de molestia que la decisión evita cuando los campos son distintos —
     * un diálogo cuyas dos opciones dan el mismo resultado.
     *
     * Se agrega acá y se dice en voz alta porque **es más de lo que la decisión
     * escribió**: va en la misma dirección, pero no lo dice ella.
     */
    const disagree = !Object.is(onScreen[field], fromServer[field])
    if (edited && moved && disagree) clashing.add(field)
  }

  return [...clashing].map((field) => ({
    field,
    whenOpened: loaded[field],
    now: fromServer[field],
  }))
}

/**
 * **Lo del servidor, con lo que el operador cambió puesto encima** (`CU-29`).
 *
 * Es la otra mitad de «si no se cruzan, se guarda sin molestar a nadie», y sin
 * ella esa frase pierde el trabajo del otro en silencio.
 *
 * El punto de control lo mostró así: el operador cambió el nombre, el otro
 * cambió el precio, no se cruzaron, se guardó — **y el precio volvió al valor
 * viejo**. El reintento mandaba el cuerpo entero del operador, incluidos los
 * campos que no había tocado, así que pisaba lo ajeno con lo que tenía cargado
 * de antes. Exactamente lo que el mecanismo existe para evitar, con un paso más.
 *
 * Se arregla acá y no en el servidor porque **acá está la única información que
 * lo permite**: qué campos tocó el operador. El servidor recibe un cuerpo y no
 * sabe cuál de sus campos es una decisión y cuál es un valor arrastrado.
 *
 * Sólo se llama cuando **no hay choque**. Con choque no se fusiona nada: decide
 * el operador.
 */
export function mergedOnto(fresh: Values, loaded: Values, onScreen: Values): Values {
  const merged: Record<string, unknown> = { ...fresh }

  for (const field of Object.keys(loaded)) {
    /* Sólo lo que el operador cambió de verdad. Copiar todo lo que tiene en
       pantalla sería volver al defecto: lo que no tocó es del otro. */
    if (!Object.is(onScreen[field], loaded[field])) merged[field] = onScreen[field]
  }

  return merged
}
