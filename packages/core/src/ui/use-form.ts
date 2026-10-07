import { useEffect, useState } from 'react'
import { useNotices } from '../base/notices'
import { useStrings } from '../base/use-strings'
import type { FieldError } from '../data/envelope'

/**
 * **Cuándo se marca un campo, y las dos capas que se validan acá** (`CU-38`).
 *
 * La tercera capa —lo que depende de otro recurso— **no se evalúa nunca de este
 * lado**: aunque se pidiera el dato, entre que se pregunta y se guarda puede
 * cambiar. Eso vuelve del servidor y va a los campos por `CU-25`.
 *
 * | | qué pasa |
 * |---|---|
 * | Mientras se escribe **por primera vez** | **Nada.** Marcar al segundo carácter es hostigar a quien todavía está escribiendo lo correcto |
 * | Al salir del campo, o al intentar guardar | **Ahí se marca** — lo que pase primero |
 * | Una vez marcado | **En vivo**, cada tecla: ya sabe qué está mal y está buscando arreglarlo |
 *
 * Nada de esto se ve mirando la pantalla con los datos correctos, que es como se
 * la mira. Por eso vive acá, con sus pruebas, y no en cada formulario.
 */

/** Lo que el contrato le exige a un campo. Sale generado (`CU-38`). */
export type FieldConstraints = {
  readonly type?: string
  readonly minLength?: number
  readonly maxLength?: number
  readonly pattern?: string
  readonly minimum?: number
  readonly maximum?: number
  /**
   * Qué es el dato, en el vocabulario de granito.
   *
   * No se valida con esto: **se dibuja**. Vive acá porque sale del mismo lugar
   * —el contrato— y ahorra un segundo mapa que se desincronice (`CU-14`).
   */
  readonly displayAs?: 'money' | 'percent' | 'date' | 'integer' | 'number'
}

/** Lo que el contrato le exige a un mensaje. Sale generado; no se escribe. */
export type MessageConstraints = {
  readonly required: readonly string[]
  readonly fields: Readonly<Record<string, FieldConstraints>>
}

/**
 * Los textos de la capa 1. Los pone la aplicación, del catálogo de su
 * funcionalidad (`CU-43`): el marco no sabe cómo se llama un campo.
 */
export type ShapeStrings = {
  readonly required: string
  readonly tooLong: (max: number) => string
  readonly badFormat: string
  /** Fuera del rango que el contrato declara. Se dice **cuál es**, no «inválido». */
  readonly outOfRange: (min: number | undefined, max: number | undefined) => string
}

/**
 * Qué está mal con la forma de un valor, o `undefined` si está bien.
 *
 * **Sólo la capa 1**, y en el orden en que le sirve a quien escribe: primero si
 * falta, después si no entra, después si no tiene la forma. Decir «formato
 * inválido» de un campo vacío manda a mirar lo que no es.
 */
export function shapeErrorOf(
  value: string,
  constraints: FieldConstraints | undefined,
  isRequired: boolean,
  strings: ShapeStrings,
): string | undefined {
  const trimmed = value.trim()

  if (isRequired && trimmed === '') return strings.required
  /* Vacío y opcional está bien: lo que sigue mediría un valor que no hay. */
  if (trimmed === '') return undefined

  if (constraints?.maxLength !== undefined && trimmed.length > constraints.maxLength) {
    return strings.tooLong(constraints.maxLength)
  }
  if (constraints?.minLength !== undefined && trimmed.length < constraints.minLength) {
    return strings.required
  }
  if (constraints?.pattern !== undefined && !new RegExp(constraints.pattern).test(trimmed)) {
    return strings.badFormat
  }

  /* El rango, que es tan del contrato como el largo. Se mira **después** del
     patrón: un texto que no es un número no tiene rango que comparar, y decir
     «entre 0 y 99999» de un «abc» manda a mirar lo que no es. */
  const { minimum, maximum } = constraints ?? {}
  if (minimum !== undefined || maximum !== undefined) {
    const asNumber = Number(trimmed)
    if (Number.isNaN(asNumber)) return strings.badFormat
    if (
      (minimum !== undefined && asNumber < minimum) ||
      (maximum !== undefined && asNumber > maximum)
    ) {
      return strings.outOfRange(minimum, maximum)
    }
  }

  return undefined
}

export type Form<Values extends Readonly<Record<string, string>>> = {
  readonly values: Values
  /** Cambiar un campo. **No lo marca**: puede ser la primera vez que se escribe. */
  readonly set: <Name extends keyof Values>(name: Name, value: Values[Name]) => void
  /** Salió del campo. **Acá sí se marca**, si tiene algo mal. */
  readonly blur: (name: keyof Values) => void
  /** Lo que se le muestra al operador en ese campo, o nada si todavía no toca. */
  readonly errorOf: (name: keyof Values) => string | undefined
  /** Si hay algo mal en la forma. Lo mira quien decide si el botón se apaga. */
  readonly hasShapeErrors: boolean
  /**
   * Intentar guardar: **marca todo** y contesta si se puede seguir.
   *
   * Marca antes de contestar a propósito — si se rechaza el intento sin marcar,
   * el operador aprieta un botón que no hace nada y no sabe por qué.
   */
  readonly attempt: () => boolean
}

export function useForm<Values extends Readonly<Record<string, string>>>(
  initial: Values,
  constraints: MessageConstraints,
  strings: ShapeStrings,
  /** Lo que el servidor rechazó. Se muestra igual que lo local (`CU-25`, `CU-5`). */
  fromServer: readonly FieldError[] = [],
): Form<Values> {
  const [values, setValues] = useState(initial)
  const [marked, setMarked] = useState<ReadonlySet<string>>(new Set())
  const { notify } = useNotices()
  const frame = useStrings()

  /**
   * **El respaldo de `CU-49`.**
   *
   * La regla —qué puede viajar en `fields`— es `TAN-9`, y no se repite acá. Esto
   * es lo que pasa cuando el servidor no la cumple: en vez de tragarse el
   * rechazo, avisa.
   *
   * Se juntan las entradas que **no se pueden mostrar**, que son dos casos y
   * terminan igual: sin control con ese nombre, o sin texto que poner adentro.
   * Por qué el formulario es el único que puede notarlo está en `CU-49`.
   *
   * Los dos textos se calculan afuera del efecto a propósito: son primitivos, y
   * así el aviso sale **una vez por rechazo** y no una por dibujo.
   */
  const stray = fromServer
    .filter((each) => !(each.field in values) || !each.message)
    .map((each) => each.field)
    .join(', ')
  const strayTitle = frame.rejectedOffForm
  const strayDetail = stray === '' ? '' : frame.rejectedOffFormDetail(stray)

  useEffect(() => {
    if (strayDetail === '') return
    notify({ tone: 'error', title: strayTitle, description: strayDetail })
  }, [strayTitle, strayDetail, notify])

  const shapeOf = (name: keyof Values) =>
    shapeErrorOf(
      values[name] ?? '',
      constraints.fields[String(name)],
      constraints.required.includes(String(name)),
      strings,
    )

  const hasShapeErrors = Object.keys(values).some((name) => shapeOf(name) !== undefined)

  return {
    values,
    set: (name, value) => setValues((current) => ({ ...current, [name]: value })),
    blur: (name) => setMarked((current) => new Set(current).add(String(name))),
    errorOf: (name) => {
      /* El del servidor se muestra siempre: no lo produjo escribir, así que no
         hay «primera vez» que respetar — ya se intentó guardar. */
      const fromApi = fromServer.find((each) => each.field === String(name))?.message
      if (fromApi) return fromApi

      return marked.has(String(name)) ? shapeOf(name) : undefined
    },
    hasShapeErrors,
    attempt: () => {
      setMarked(new Set(Object.keys(values)))
      return !hasShapeErrors
    },
  }
}
