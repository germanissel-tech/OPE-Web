import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { Failure } from './failure'
import type { AnyPreference, Preference } from './preference'
import { readStored, type StoredPreferences, writeStored } from './preference-store'
import { useStrings } from './use-strings'

/**
 * Las preferencias del operador, vivas (`CU-26`).
 *
 * Por contexto y no por módulo: **tienen estado y ciclo de vida**, y `CU-36`
 * reserva el módulo configurado una vez para funciones sin estado.
 *
 * El proveedor **no conoce ninguna preferencia**. Recibe las que la aplicación
 * declaró y trabaja contra su `parse`, su `apply` y su `choice`, así que
 * agregar una no lo toca.
 */

/** Un renglón del menú de usuario, ya resuelto. Quien lo dibuja no decide nada. */
export type PreferenceRow = {
  readonly id: string
  readonly label: string
  readonly icon?: ReactNode
  readonly select: () => void
}

type PreferencesContextValue = {
  /** El valor de una preferencia, **con su tipo**. */
  readonly read: <T>(preference: Preference<T>) => T
  /** Las que el operador puede cambiar. Las fijas no aparecen. */
  readonly rows: readonly PreferenceRow[]
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

/** Lo declarado, aplicado sobre lo guardado. Todo pasa por `parse`. */
function resolve(
  preferences: readonly AnyPreference[],
  stored: StoredPreferences,
): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const preference of preferences) {
    values[preference.id] = preference.parse(stored[preference.id])
  }
  return values
}

export function PreferencesProvider({
  subject,
  preferences,
  children,
}: {
  /** Con qué se estampan. Dos operadores en la misma máquina no se heredan nada. */
  readonly subject: string | undefined
  /** Las que esta aplicación tiene. Lo que no está acá, no existe. */
  readonly preferences: readonly AnyPreference[]
  readonly children: ReactNode
}) {
  /**
   * Se resuelve **al primer dibujo y no en un efecto**.
   *
   * Con un efecto habría un cuadro dibujado con los valores iniciales antes de
   * los del operador, y en el tema eso es un destello blanco. El almacén es
   * síncrono, así que no hay razón para esperar.
   */
  const strings = useStrings()

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const resolved = resolve(preferences, readStored(subject))
    for (const preference of preferences) preference.apply(resolved[preference.id])
    return resolved
  })

  const read = useCallback(
    <T,>(preference: Preference<T>): T => preference.typed.parse(values[preference.id]),
    [values],
  )

  const rows = useMemo(
    () =>
      preferences.flatMap((preference): PreferenceRow[] => {
        const choice = preference.choice
        /* Sin `choice` es una preferencia fija: existe, se aplica, y no se
           ofrece. Ver `fixed` en `preference.ts`. */
        if (!choice) return []

        const { label, icon, next } = choice(values[preference.id], strings)
        return [
          {
            id: preference.id,
            label,
            icon,
            select: () => {
              const updated = { ...values, [preference.id]: next }
              setValues(updated)
              preference.apply(next)
              writeStored(subject, updated)
            },
          },
        ]
      }),
    [preferences, values, subject, strings],
  )

  const value = useMemo(() => ({ read, rows }), [read, rows])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext)
  if (!value) {
    throw new Failure('wiring.outsideProvider', 'usePreferences() fuera de PreferencesProvider.')
  }
  return value
}
