import { configurationStrings } from '../strings'
import { type OperativeLeaf, TREATMENT_GROUPS } from './groups'
import { PLATFORM_GROUPS, type PlatformField } from './platform-groups'

const LEAVES: readonly (OperativeLeaf | PlatformField)[] = [
  ...TREATMENT_GROUPS.flatMap((group) => group.leaves),
  ...PLATFORM_GROUPS.flatMap((group) => group.leaves),
]

/**
 * **El rótulo de una hoja en el choque** (feature 009): el mismo que tiene su
 * campo. La puerta nombra las hojas por su camino, que es lo que compara; quien
 * decide qué hacer las reconoce por el rótulo que vio en el formulario.
 */
export function leafLabel(field: string): string {
  const leaf = LEAVES.find((each) => each === field)
  return leaf === undefined ? field : configurationStrings[leaf]
}
