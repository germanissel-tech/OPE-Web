/**
 * Dónde viven las preferencias del operador (`CU-26`).
 *
 * **En la máquina**, porque son de la persona y no del trabajo, y porque volver
 * a elegirlas cada mañana es fricción diaria. No viajan al servidor: guardarlas
 * del otro lado exigiría un endpoint que hoy no existe en ningún contrato, y
 * pedirlo sería hacer crecer una API porque una pantalla lo necesita.
 *
 * Las dos reglas que `CU-26` fija para todo lo que se guarde:
 *
 * - **Se estampa con el sujeto y se descarta si no coincide.** Dos operadores
 *   en la misma máquina de mostrador no se heredan nada.
 * - **Se guardan identificadores, no datos.** Lo que entra acá son los valores
 *   que cada preferencia declaró, que son eso.
 *
 * El almacén **no sabe qué preferencias existen**: guarda lo que le dan contra
 * el identificador que le dan. Quién las valida es cada `parse`.
 */

/** Lo crudo, tal como salió del almacén. Nadie lo usa sin pasarlo por `parse`. */
export type StoredPreferences = Readonly<Record<string, unknown>>

const KEY = 'cuarzo.preferences'

export function readStored(subject: string | undefined): StoredPreferences {
  if (!subject) return {}
  try {
    const raw = localStorage.getItem(`${KEY}.${subject}`)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    return parsed as StoredPreferences
  } catch {
    /* Un almacenamiento bloqueado o un valor corrupto no puede impedir que la
       aplicación arranque: son preferencias, no configuración. */
    return {}
  }
}

export function writeStored(subject: string | undefined, values: StoredPreferences): void {
  if (!subject) return
  try {
    localStorage.setItem(`${KEY}.${subject}`, JSON.stringify(values))
  } catch {
    /* Lo mismo: si no se puede guardar, la preferencia vale para esta sesión. */
  }
}
