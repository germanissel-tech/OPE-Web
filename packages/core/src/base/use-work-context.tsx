import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { readContext, type WorkContext, writeContext } from './context'
import { Failure } from './failure'

/**
 * **Lo que se está usando ahora, y quién lo puede cambiar** (`CU-26`).
 *
 * El almacén de [`context.ts`](context.ts) sabe leer y escribir; esto es lo que
 * hace que **dos pantallas que miran el mismo contexto no se desincronicen**.
 * Sin un lugar común, cada una leería el suyo al montarse y la que ya estaba
 * seguiría mostrando el de antes — o sea **dos partes de la pantalla operando
 * sobre dos personas distintas**.
 *
 * Se recibe por contexto de React y no por módulo: **tiene estado y ciclo de
 * vida**, y `CU-36` reserva el módulo para funciones sin estado.
 */

type Values = ReadonlyMap<string, string | undefined>

type WorkContextValue = {
  readonly values: Values
  readonly set: (context: WorkContext, id: string | undefined) => void
}

const Context = createContext<WorkContextValue | undefined>(undefined)

export function WorkContextProvider({
  subject,
  contexts,
  children,
}: {
  /** Con qué se estampa. Dos operadores en la misma máquina no se heredan nada. */
  readonly subject: string | undefined
  /** Los que esta aplicación tiene. Lo que no está acá, no existe. */
  readonly contexts: readonly WorkContext[]
  readonly children: ReactNode
}) {
  /* Se resuelve **al primer dibujo y no en un efecto**, igual que las
     preferencias: el almacén es síncrono, y con un efecto habría un cuadro
     dibujado sin contexto antes del que corresponde. */
  const [values, setValues] = useState<Values>(
    () => new Map(contexts.map((each) => [each.id, readContext(each, subject)])),
  )

  const set = useCallback(
    (context: WorkContext, id: string | undefined) => {
      writeContext(context, subject, id)
      setValues((current) => new Map(current).set(context.id, id))
    },
    [subject],
  )

  const value = useMemo(() => ({ values, set }), [values, set])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

/**
 * Todos los contextos puestos, sin pedir ninguno en particular.
 *
 * **Lo usa el registro y nadie más** (`CU-35`): el sobre lleva los que la
 * aplicación declaró, y cuántos son lo decide su manifiesto. Pedirlos de a uno
 * sería un hook por contexto adentro de un bucle, que React no admite.
 *
 * Sin proveedor devuelve vacío en vez de reventar, por la misma razón que
 * `useTelemetry`.
 */
export function useWorkContextValues(): ReadonlyMap<string, string | undefined> {
  return useContext(Context)?.values ?? EMPTY
}

const EMPTY: ReadonlyMap<string, string | undefined> = new Map()

/**
 * Lo que está puesto, y con qué cambiarlo.
 *
 * Devuelve **un identificador**, no un registro: lo demás se pide, y por `CU-14`
 * ya está cacheado.
 */
export function useWorkContext(
  context: WorkContext,
): readonly [string | undefined, (id: string | undefined) => void] {
  const value = useContext(Context)
  if (!value) {
    throw new Failure(
      'wiring.outsideProvider',
      'useWorkContext() fuera de WorkContextProvider. Los contextos los declara el manifiesto.',
    )
  }

  if (!value.values.has(context.id)) {
    /* Uno sin declarar leería siempre vacío, y **en silencio**. Falla acá para
       que se vea al usarlo y no al no encontrarlo. */
    throw new Failure(
      'declaration.unknownContext',
      `Nadie declaró el contexto "${context.id}". Se declara en el manifiesto, con su vida.`,
    )
  }

  const set = useCallback((id: string | undefined) => value.set(context, id), [value, context])

  return [value.values.get(context.id), set]
}
