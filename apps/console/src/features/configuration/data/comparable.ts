import type { Presentation } from '@ope/core'
import { type Kind, setAt, valueAt, valueFrom } from './treatment-form'

/**
 * **Lo que la puerta compara cuando otro escribió en el medio** (`CU-29`,
 * research §3).
 *
 * La puerta recorre las claves de lo cargado y compara valor con valor. Los
 * formularios de la configuración no le sirven tal cual, por tres razones:
 * heredar es que la clave **no esté** (un valor declarado después de abrir no
 * estaba, y la fusión lo perdería), una lista son **varias claves** (sumar un
 * renglón es una clave nueva), y un número es **texto en una unidad** (`36` horas
 * y `129600000` ms son el mismo valor y dos textos distintos).
 *
 * Así que la pantalla le da **una clave por hoja**, la misma en los tres lados
 * —lo cargado, lo que hay en pantalla, lo que trae el servidor—, con el valor
 * del contrato en `JSON`, o `undefined` si la hoja se hereda. Declarar, heredar
 * o sumar un renglón pasan a ser cambios de valor, y la comparación es en
 * unidades del contrato.
 */
export type Comparable = Readonly<Record<string, string | undefined>>

/** Cómo leer una hoja del formulario: su nombre, qué control tiene y en qué unidad se cargó. */
export type LeafReading = {
  readonly nameOf: (leaf: string) => string
  readonly kindOf: (leaf: string) => Kind
  readonly shownOf: (leaf: string) => Presentation | undefined
}

/** Las hojas de un formulario, como valores del contrato. */
export function comparableOfForm(
  values: Readonly<Record<string, string>>,
  leaves: readonly string[],
  reading: LeafReading,
): Comparable {
  const comparable: Record<string, string | undefined> = {}
  for (const leaf of leaves) {
    const value = valueFrom(
      values,
      reading.nameOf(leaf),
      reading.kindOf(leaf),
      reading.shownOf(leaf),
    )
    comparable[leaf] = value === undefined ? undefined : JSON.stringify(value)
  }
  return comparable
}

/** Las hojas de un objeto del contrato —lo declarado, un contenido—, con la misma forma. */
export function comparableOfContract(source: unknown, leaves: readonly string[]): Comparable {
  const comparable: Record<string, string | undefined> = {}
  for (const leaf of leaves) {
    const value = valueAt(source, leaf)
    comparable[leaf] = value === undefined ? undefined : JSON.stringify(value)
  }
  return comparable
}

/**
 * **De vuelta al contrato**: un objeto con cada hoja que tiene valor, por su
 * camino. Una hoja `undefined` se hereda, y por eso no está.
 */
export function contractOfComparable(
  comparable: Readonly<Record<string, unknown>>,
  leaves: readonly string[],
): Record<string, unknown> {
  const target: Record<string, unknown> = {}
  for (const leaf of leaves) {
    const json = comparable[leaf]
    if (typeof json === 'string') setAt(target, leaf, JSON.parse(json))
  }
  return target
}
