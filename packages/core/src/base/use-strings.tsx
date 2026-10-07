import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { DEFAULT_STRINGS, type Strings } from './strings'

/**
 * El catálogo vigente.
 *
 * **Fuera del proveedor devuelve los de por omisión, y no falla** — a
 * diferencia de las preferencias, donde estar afuera es un defecto. El caso que
 * lo justifica, y por qué, está en `CU-43`.
 */
const StringsContext = createContext<Strings>(DEFAULT_STRINGS)

export function StringsProvider({
  strings,
  children,
}: {
  /** Lo que esta aplicación reemplaza. Lo que no pase, queda el del marco. */
  readonly strings?: Partial<Strings>
  readonly children: ReactNode
}) {
  const value = useMemo(() => ({ ...DEFAULT_STRINGS, ...strings }), [strings])
  return <StringsContext.Provider value={value}>{children}</StringsContext.Provider>
}

export function useStrings(): Strings {
  return useContext(StringsContext)
}
