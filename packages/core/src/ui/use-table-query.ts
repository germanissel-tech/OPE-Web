import { useCallback, useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { useDebounced } from '../base/use-debounced'

/**
 * **El estado de una grilla servida** (`CU-14`), que desde `CU-47` **vive en la
 * URL**.
 *
 * Lo que filtra y pagina es el servidor, así que toda grilla de todas las
 * aplicaciones necesita exactamente esto: un texto que se ve en el acto, una
 * consulta que espera, y un cursor que vuelve al principio cuando el filtro
 * cambia. Repetido en cada pantalla son quince líneas que se copian —y una de
 * ellas se copia mal.
 *
 * **Son dos valores y no uno**, que es la sutileza que esto se lleva adentro:
 *
 * | | qué es | quién lo usa |
 * |---|---|---|
 * | `search` | Lo que el operador está escribiendo, **sin demora** | El control, y `hasFilters` |
 * | `query` | Lo mismo, **cuando dejó de escribir** | La consulta, y `filtered` |
 *
 * Confundirlos no rompe nada visible: la barra de filtros parpadea limpia por
 * un cuarto de segundo, o el vacío dice «no hay nada» cuando lo que hay es una
 * búsqueda en vuelo.
 *
 * ## Por qué en la URL, y no en memoria
 *
 * Porque **el lugar es dónde estás**, y de eso se ocupa la URL: cerrar una
 * ficha vuelve al escalón anterior, y ese escalón es una dirección que ya traía
 * su filtro y su tramo. Sin esto, volver deja al operador en el primer tramo
 * sin filtro — el problema con el que arrancó `CU-47`.
 *
 * De paso se gana algo que no se buscaba: **un enlace con el filtro puesto se
 * comparte**.
 *
 * ## El cursor, y qué reproduce un enlace
 *
 * OPE pagina por cursor opaco y sin total (`ADR-020` del backend), así que no
 * hay número de página que llevar. Lo que viaja es **el cursor del último tramo
 * cargado**: un enlace con cursor reproduce ese tramo —que es lo que el servidor
 * puede dar—, no la acumulación de los anteriores.
 *
 * ## Y por qué reemplaza la entrada en vez de apilarla
 *
 * Filtrar y cargar más **no son escalones**. Si apilaran, «atrás» dejaría de ser
 * «cerrar» y pasaría a ser «el tramo anterior», y salir de una grilla después
 * de cargar cinco tramos serían cinco apretadas. La pila es del recorrido; el
 * lugar viaja al lado.
 */
export type TableQuery = {
  /** Lo que se está escribiendo. Va al control y a `hasFilters`. */
  readonly search: string
  /** Lo mismo, ya asentado. **Va a la consulta**, no al control. */
  readonly query: string
  /** Si hay filtro puesto. Lo consume el vacío, para elegir cuál de los dos es. */
  readonly filtered: boolean
  /** El cursor del último tramo cargado, o ninguno: el principio. */
  readonly cursor: string | undefined
  /** Anota el cursor del tramo que acaba de llegar. Con `undefined`, vuelve al principio. */
  readonly setCursor: (next: string | undefined) => void
  /**
   * **Dónde está parado el operador** (`GR-47`, `granito#PED-12`).
   *
   * No es la selección: la selección son varias y sirve para operar sobre
   * todas; ésta es una y dice **de cuál fila salí**. Confundirlas es el error
   * caro, y granito lo dice en su propia API.
   *
   * Vive en la dirección como el filtro y el cursor: con estado local se pierde
   * al abrir una ficha, que es exactamente cuando hace falta.
   */
  readonly currentRow: string | null
  readonly setCurrentRow: (id: string | null) => void
  /**
   * Cambiar el filtro **vuelve al principio**.
   *
   * Quedarse en el tramo cinco de un resultado que ahora tiene uno es una
   * pantalla vacía sin explicación, y el operador no tiene cómo saber que le
   * alcanza con volver.
   */
  readonly filter: (value: string) => void
}

/** Cómo se llaman en la dirección. Cortos porque se ven. */
const QUERY = 'q'
const CURSOR = 'c'
const ROW = 'row'

/**
 * **El nombre de la grilla, y es obligatorio.**
 *
 * Dos grillas en una pantalla con nombres fijos **se pisan en silencio**:
 * filtrar una filtraría la otra, y el enlace compartido reproduciría el enredo.
 *
 * Se pide siempre y no sólo cuando hay dos, por el argumento de `CU-44`: dos
 * formas —con nombre y sin él— son **criterio**, y quien nunca elige no se
 * equivoca. La forma opcional ya se eligió mal una vez en este repositorio.
 *
 * De paso la dirección se vuelve autodescriptiva, que importa porque se
 * comparte: `?merchants.q=tienda&merchants.row=mrc_7f` dice de qué es cada cosa.
 */
export function useTableQuery(grid: string): TableQuery {
  const [params, setParams] = useSearchParams()

  /**
   * **El estado de la entrada se vuelve a poner en cada escritura** (`CU-47`).
   *
   * `setSearchParams` arma una entrada nueva y **descarta el `state`**: sin
   * esto, filtrar o cargar más borra la pila del flujo. Y no falla — sin estado,
   * el marco reconstruye una pila plausible con la regla del enlace pegado, así
   * que con dos escalones no se nota y con tres cerrar cae a la raíz.
   */
  const { state } = useLocation()

  /* **Las dos se memorizan para poder declararlas.** Recreadas en cada dibujo,
     un efecto que las use tiene que omitirlas de sus dependencias — y un efecto
     que miente sobre lo que usa es exactamente la clase de defecto que este
     archivo ya tuvo. Estables, se listan y el compilador acompaña. */
  const write = useCallback(
    (change: (params: URLSearchParams) => URLSearchParams) =>
      setParams((current) => change(new URLSearchParams(current)), { replace: true, state }),
    [setParams, state],
  )

  const key = useCallback((name: string) => `${grid}.${name}`, [grid])

  const settledQuery = params.get(key(QUERY)) ?? ''
  const currentRow = params.get(key(ROW))

  /**
   * **El cursor es opaco, así que no se interpreta** (`ADR-020`).
   *
   * Lo que venga en la dirección se le da al servidor tal cual. Si es viejo o
   * inventado, el servidor responde `400 validation-failed` con el puntero
   * `/query/cursor`, la grilla lo muestra como error con «reintentar», y
   * reintentar es `setCursor(undefined)`: volver al principio. No queda una
   * grilla vacía sin salida, que era lo que pasaba con un número de página que
   * no era un número.
   */
  const cursor = params.get(key(CURSOR)) ?? undefined

  /**
   * Lo que se está escribiendo **sí es local**, y arranca de la dirección.
   *
   * Escribir no puede esperar a un viaje por el ruteador: el control tiene que
   * mostrar la tecla en el acto. Lo que llega a la URL es lo asentado.
   */
  /**
   * **Se sincroniza durante el dibujo, no con un efecto**, y ahí está la
   * diferencia que costó encontrar.
   *
   * Con un efecto que hacía `setTyping(settledQuery)`, en el dibujo donde la
   * dirección cambia por afuera **lo tecleado todavía es lo viejo** —el efecto
   * corre después—, así que el que asienta lo escribía de vuelta: el filtro
   * reaparecía solo y pisaba la entrada del historial recién creada.
   *
   * Ajustar el estado mientras se dibuja lo deja al día **antes** de que corra
   * ningún efecto. Es la forma que React documenta para esto, y de paso saca un
   * efecto entero: el orden entre dos dejaba de importar.
   */
  const [typed, setTyped] = useState({ value: settledQuery, from: settledQuery })

  if (typed.from !== settledQuery) {
    setTyped({ value: settledQuery, from: settledQuery })
  }

  const typing = typed.value
  const debounced = useDebounced(typing)

  /**
   * Cuando dejó de escribir, el texto se asienta en la dirección. Reemplaza la
   * entrada: escribir no es navegar.
   *
   * **`debounced === typing` es la condición que falta si no está**, y no es una
   * optimización: `debounced` va atrasado por definición. Cuando la dirección
   * cambia por afuera —«atrás», un ítem del menú, un enlace pegado— el control
   * ya se sincronizó y `debounced` todavía trae **lo que se había escrito
   * antes**. Sin esta guarda, este efecto lo escribe de vuelta: el filtro
   * reaparece solo y pisa la entrada del historial recién creada.
   *
   * Con la guarda, el efecto sólo actúa cuando el rebote alcanzó a lo tecleado
   * — que es la definición de «dejó de escribir».
   */
  useEffect(() => {
    if (debounced !== typing) return
    if (debounced === settledQuery) return

    write((next) => {
      if (debounced === '') next.delete(key(QUERY))
      else next.set(key(QUERY), debounced)
      /* Otro filtro es otra colección: el cursor del tramo anterior no le
         pertenece, y mandárselo al servidor es un `400` seguro. */
      next.delete(key(CURSOR))
      /* La fila actual es del tramo que se estaba mirando: con otro filtro
         puede no existir, y una marca que apunta a nada confunde más que
         ninguna. */
      next.delete(key(ROW))
      return next
    })
  }, [debounced, typing, settledQuery, key, write])

  return {
    search: typing,
    query: settledQuery,
    filtered: settledQuery !== '',
    cursor,
    setCursor: (next) => {
      write((params) => {
        if (next === undefined) params.delete(key(CURSOR))
        else params.set(key(CURSOR), next)
        params.delete(key(ROW))
        return params
      })
    },
    currentRow,
    setCurrentRow: (id) => {
      write((params) => {
        if (id === null) params.delete(key(ROW))
        else params.set(key(ROW), id)
        return params
      })
    },
    filter: (value) => setTyped({ value, from: settledQuery }),
  }
}
