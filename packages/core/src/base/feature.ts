import { Failure } from './failure'
import type { UserMenuEntry } from './manifest'
import type { AnyOutcome } from './outcome'
import type { Screen } from './registry'

/**
 * **Una funcionalidad declara todo lo que aporta** (`CU-15`, `CU-36`).
 *
 * No sólo sus pantallas: también lo que pone en el menú de usuario. Así una
 * funcionalidad que quiere una entrada propia **se agrega en un renglón** de la
 * lista de la aplicación, en vez de repartirse entre la lista de pantallas y el
 * menú del manifiesto.
 *
 * Lo que aporta crece por acá y no por el manifiesto, que es lo que hace que el
 * manifiesto **no crezca con el sistema**.
 */
export type Feature = {
  /** Las que exporta. De acá salen las rutas y el filtrado por capacidad. */
  readonly screens: readonly Screen[]
  /**
   * **A dónde cae un cerrar sin pila, para sus pantallas** (`CU-47`).
   *
   * Pasa con cada enlace pegado y cada pestaña nueva: no hay escalón abajo, y
   * una pantalla cuyo «cerrar» no hace nada es una pantalla incompleta.
   *
   * También decide **en qué flujo entra** quien llega así: el que arranca en
   * esta raíz.
   *
   * Es la regla que faltaba desde la deuda de las dos formas de navegar,
   * ahora **declarada en vez de acertada**.
   */
  readonly root: Screen
  /**
   * Lo que agrega al menú de usuario, arriba del separador (`CU-27`).
   *
   * Vive con la funcionalidad y no en el manifiesto porque **la entrada y la
   * pantalla que abre son la misma cosa**: separarlas es cómo una queda sin la
   * otra.
   */
  readonly userMenuEntries?: readonly UserMenuEntry[]
  /**
   * **Qué le puede pasar a esta funcionalidad** (`CU-44`).
   *
   * Un desenlace dice qué terminó, no a dónde ir. A dónde lleva lo decide la
   * aplicación en un solo lugar, que es lo que permite que una funcionalidad
   * cierre un flujo sin conocer a la que sigue.
   */
  readonly outcomes?: Readonly<Record<string, AnyOutcome>>
}

/**
 * Declara una funcionalidad. Se escribe en `features/<x>/feature.ts`.
 *
 * Devuelve **lo que se le pasó, con su tipo exacto**: si devolviera `Feature` a
 * secas, el dato de cada desenlace se perdería y atarlo a su destino dejaría de
 * estar tipado.
 */
export function defineFeature<const F extends Feature>(feature: F): F {
  return feature
}

/**
 * Junta lo que aportan todas. Lo llama la raíz de composición.
 *
 * **Dos entradas de menú con el mismo identificador fallan al construir**, por
 * la misma razón que dos pantallas con la misma ruta (`CU-23`): el ganador
 * dependería del orden en que se juntaron las funcionalidades, y eso es un
 * defecto que aparece meses después y en una sola máquina.
 */
export function composeFeatures(features: readonly Feature[]): {
  readonly screens: readonly Screen[]
  /**
   * **De qué raíz es cada pantalla** (`CU-47`).
   *
   * Una lista de raíces sueltas no alcanza: para saber a dónde cae el cerrar
   * de una ficha hay que saber **de qué funcionalidad es esa ficha**, y eso se
   * pierde al aplanar.
   */
  readonly featureRootOf: Readonly<Record<string, string>>
  readonly userMenuEntries: readonly UserMenuEntry[]
  readonly outcomes: readonly AnyOutcome[]
  /**
   * **De qué funcionalidad es cada desenlace** (`CU-47`).
   *
   * Con los desenlaces aplanados en una lista, lo único verificable es si
   * **alguno** de los flujos mapea cada uno. Y eso aprueba el caso que `CU-47`
   * existe para permitir: la misma pantalla en dos flujos, con el segundo sin
   * decir nada — arranca en verde y revienta al hacer clic.
   *
   * Se guarda por raíz y no por nombre de funcionalidad porque la raíz es lo
   * que ya identifica a una en todo el resto del marco.
   */
  readonly outcomesOf: Readonly<Record<string, readonly string[]>>
} {
  const screens = features.flatMap((feature) => [...feature.screens])
  const featureRootOf: Record<string, string> = {}
  for (const feature of features) {
    for (const screen of feature.screens) featureRootOf[screen.id] = feature.root.id
  }
  const userMenuEntries = features.flatMap((feature) => [...(feature.userMenuEntries ?? [])])
  const outcomes = features.flatMap((feature) => Object.values(feature.outcomes ?? {}))

  const outcomesOf: Record<string, readonly string[]> = {}
  for (const feature of features) {
    outcomesOf[feature.root.id] = Object.values(feature.outcomes ?? {}).map((each) => each.id)
  }

  const declared = new Set<string>()
  for (const each of outcomes) {
    if (declared.has(each.id)) {
      throw new Failure(
        'declaration.duplicateOutcome',
        `Dos funcionalidades declaran el desenlace "${each.id}".`,
      )
    }
    declared.add(each.id)
  }

  const seen = new Set<string>()
  for (const entry of userMenuEntries) {
    if (seen.has(entry.id)) {
      throw new Failure(
        'declaration.duplicateMenuEntry',
        `Dos entradas del menú de usuario declaran el mismo id "${entry.id}".`,
      )
    }
    seen.add(entry.id)
  }

  return { screens, featureRootOf, userMenuEntries, outcomes, outcomesOf }
}
