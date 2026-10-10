import { useEffect, useState } from 'react'
import { useNotices } from '../base/notices'
import { useStrings } from '../base/use-strings'
import type { RejectedField } from '../data/envelope'

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
   * Para un campo que es una lista: cuántos renglones admite, y qué le exige a
   * cada uno. Un renglón se valida con `items` como si fuera el campo; cuántos
   * hay lo decide el formulario con `minItems` y `maxItems`.
   */
  readonly minItems?: number
  readonly maxItems?: number
  readonly items?: FieldConstraints
  /**
   * La forma de un dato que un patrón no dice bien: hoy sólo `email`, que es
   * lo mínimo que un formulario puede verificar antes de que el servidor lo
   * rechace. Otros valores no se juzgan acá.
   */
  readonly format?: string
  /**
   * Los valores de una lista cerrada del contrato. No se valida con esto —el
   * control que lo dibuja no deja elegir otro—: dice qué opciones ofrecer.
   */
  readonly enum?: readonly (string | number | boolean)[]
  /**
   * Qué es el dato, en el vocabulario de granito.
   *
   * No se valida con esto: **se dibuja**. Vive acá porque sale del mismo lugar
   * —el contrato— y ahorra un segundo mapa que se desincronice (`CU-14`).
   */
  readonly displayAs?: 'money' | 'percent' | 'date' | 'integer' | 'number'
}

/** Lo mínimo de un email: un `@` con algo a cada lado, y un punto en el dominio. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  /** Un email que no tiene forma de tal; sin esto se dice `badFormat`. */
  readonly badEmail?: string
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
  /* La forma de un email es la de un dato, no la de un negocio: «algo@algo.algo»
     y nada más. Lo demás lo decide el servidor, en su campo. */
  if (constraints?.format === 'email' && !EMAIL_SHAPE.test(trimmed)) {
    return strings.badEmail ?? strings.badFormat
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
  /**
   * Sacar un renglón de una lista: el campo deja de existir, con su marca y su
   * error. Es lo único que hace falta para que un formulario tenga renglones
   * (`origins.0`, `origins.1`, …) sin saber nada de listas acá.
   */
  readonly unset: (name: string) => void
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
  /**
   * Lo que el contrato exige, fijo o **en función de los valores**: hay reglas
   * de forma que dependen de lo que ya se escribió —«si hay contacto, nombre y
   * email van»— y siguen siendo capa 1. Se evalúa en cada dibujo.
   */
  constraints: MessageConstraints | ((values: Values) => MessageConstraints),
  strings: ShapeStrings,
  /**
   * Lo que el servidor rechazó, **ya traducido a nombres de campo** por la
   * puerta (`fieldNameOf`). Se muestra igual que lo local (`CU-25`, `CU-5`).
   */
  fromServer: readonly RejectedField[] = [],
): Form<Values> {
  const [values, setValues] = useState(initial)
  const [marked, setMarked] = useState<ReadonlySet<string>>(new Set())
  const { notify } = useNotices()
  const frame = useStrings()

  /**
   * **Dónde puede caer un error del servidor**: en un campo que tiene valor, o
   * en **una lista que tiene renglones** (feature 008 de la consola). Un error
   * sobre la lista entera —«la escalera no crece»— es de la lista y no de un
   * escalón, y su lugar es donde se dibuja la lista.
   *
   * Lo que decide es que lo que sigue al nombre empiece por un índice:
   * `steps` es la lista de `steps.0`, y `step` no lo es aunque empiece igual.
   */
  const isTarget = (field: string) =>
    field in values ||
    Object.keys(values).some(
      (name) => name.startsWith(`${field}.`) && /^\d+(\.|$)/.test(name.slice(field.length + 1)),
    )

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
    .filter((each) => !isTarget(each.field) || !each.message)
    .map((each) => each.field)
    .join(', ')
  const strayTitle = frame.rejectedOffForm
  const strayDetail = stray === '' ? '' : frame.rejectedOffFormDetail(stray)

  useEffect(() => {
    if (strayDetail === '') return
    notify({ tone: 'error', title: strayTitle, description: strayDetail })
  }, [strayTitle, strayDetail, notify])

  /**
   * Qué le exige el contrato a un campo, **también cuando el campo es un
   * renglón**: `origins.1` no está en `fields`, pero `origins` sí y trae
   * `items`; el renglón se valida con eso, y es obligatorio si la lista lo es
   * —un renglón vacío no se manda, se quita—.
   */
  const demanded = typeof constraints === 'function' ? constraints(values) : constraints

  const demandsOn = (name: string) => {
    const direct = demanded.fields[name]
    if (direct) return { of: direct, required: demanded.required.includes(name) }
    const at = name.lastIndexOf('.')
    if (at > 0 && /^\d+$/.test(name.slice(at + 1))) {
      const list = name.slice(0, at)
      const items = demanded.fields[list]?.items
      if (items) return { of: items, required: demanded.required.includes(list) }
    }
    return { of: undefined, required: demanded.required.includes(name) }
  }

  const shapeOf = (name: keyof Values) => {
    const demands = demandsOn(String(name))
    return shapeErrorOf(values[name] ?? '', demands.of, demands.required, strings)
  }

  const hasShapeErrors = Object.keys(values).some((name) => shapeOf(name) !== undefined)

  return {
    values,
    set: (name, value) => setValues((current) => ({ ...current, [name]: value })),
    unset: (name) => {
      setValues((current) => {
        const { [name]: _, ...rest } = current
        return rest as Values
      })
      setMarked((current) => {
        const rest = new Set(current)
        rest.delete(name)
        return rest
      })
    },
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
