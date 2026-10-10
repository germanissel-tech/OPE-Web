import { constraintsOf, type MessageConstraints, type Presentation } from '@ope/core'
import {
  CONSTRAINTS,
  type PlatformConfigurationContent,
  type PlatformConfigurationInput,
  type TreatmentDefaultsContent,
  type TreatmentDefaultsInput,
} from '../../../api/ope/client'
import {
  type Comparable,
  comparableOfContract,
  comparableOfForm,
  contractOfComparable,
} from './comparable'
import { TREATMENT_GROUPS } from './groups'
import { PLATFORM_GROUPS } from './platform-groups'
import {
  constraintsIn,
  entriesOf,
  kindOf,
  type Shown,
  setAt,
  shownFor,
  valueAt,
  valueFrom,
} from './treatment-form'
import { PLATFORM_PRESENTATION, TREATMENT_PRESENTATION } from './units'

/**
 * **La publicación de un nivel global** (research §7, data-model §3).
 *
 * En la plataforma y en los defaults **todo es propio**: no hay herencia, así
 * que cada valor operativo está en el formulario, precargado con el contenido
 * de la versión que rige. Lo que la pantalla no edita —en los defaults, la
 * política de decisión y la condición de riesgo de devolución— no pasa por el
 * formulario: se cuelga entero de lo que rige al armar el cuerpo, igual que en
 * el merchant.
 */

const PREFIX = 'content'

/** Lo que distingue a un nivel: qué esquema lo juzga, qué hojas edita y en qué unidad las lee. */
type LevelShape = {
  readonly emitted: MessageConstraints
  readonly leaves: readonly string[]
  readonly presentation: Readonly<Record<string, Presentation | undefined>>
}

const PLATFORM: LevelShape = {
  emitted: constraintsOf(CONSTRAINTS, 'PlatformConfigurationInput'),
  leaves: PLATFORM_GROUPS.flatMap((group) => group.leaves),
  presentation: PLATFORM_PRESENTATION,
}

const DEFAULTS: LevelShape = {
  emitted: constraintsOf(CONSTRAINTS, 'TreatmentDefaultsInput'),
  leaves: TREATMENT_GROUPS.flatMap((group) => group.leaves),
  presentation: TREATMENT_PRESENTATION,
}

const nameOf = (leaf: string) => `${PREFIX}.${leaf}`

/** El formulario, precargado con el contenido que rige, y en qué unidad quedó cada número. */
function formOf(shape: LevelShape, content: unknown) {
  const values: Record<string, string> = { corrective: 'false', reason: '' }
  const shown: Record<string, Shown[string]> = {}
  for (const leaf of shape.leaves) {
    const value = valueAt(content, leaf)
    if (value === undefined) continue
    const sample = Array.isArray(value) ? value[0] : value
    const preferred = shape.presentation[leaf]
    const how = typeof sample === 'number' ? shownFor(sample, preferred) : preferred
    Object.assign(
      values,
      entriesOf(nameOf(leaf), value, kindOf(shape.emitted.fields[nameOf(leaf)]), how),
    )
    shown[leaf] = how
  }
  return { values, shown }
}

/**
 * **Lo que se exige** (capa 1, `CU-38`): lo que el contrato pide, en la unidad
 * en que se carga, y el motivo de una correctiva.
 *
 * **Una lista obligatoria no se exige por su nombre.** Su nombre lleva texto
 * vacío —es la marca de que la lista está (research §6)—, y exigirlo lo daría
 * por faltante siempre. Que esté lo garantiza la precarga; que tenga los
 * elementos que el contrato pide lo juzga el servidor, y su `422` cae en ella.
 * Lo que la pantalla no edita tampoco se exige: no está en el formulario.
 */
function constraintsOfLevel(
  shape: LevelShape,
  values: Readonly<Record<string, string>>,
  shown: Shown,
): MessageConstraints {
  const base = constraintsIn(shape.emitted, PREFIX, shown)
  const edited = new Set(shape.leaves.map(nameOf))
  const required = base.required.filter(
    (name) => edited.has(name) && base.fields[name]?.type !== 'array',
  )
  if (values['corrective'] === 'true') required.push('reason')
  return { required, fields: base.fields }
}

/** El contenido que dicen los valores operativos. */
function contentOf(shape: LevelShape, values: Readonly<Record<string, string>>, shown: Shown) {
  const content: Record<string, unknown> = {}
  for (const leaf of shape.leaves) {
    const name = nameOf(leaf)
    const value = valueFrom(values, name, kindOf(shape.emitted.fields[name]), shown[leaf])
    if (value !== undefined) setAt(content, leaf, value)
  }
  return content
}

/**
 * **Cómo se compara un nivel cuando otro publicó en el medio** (feature 009,
 * research §3): sus hojas, leídas del contenido de una versión o del
 * formulario, en unidades del contrato.
 */
export type LevelComparison = {
  readonly ofContent: (content: unknown) => Comparable
  readonly ofForm: (values: Readonly<Record<string, string>>, shown: Shown) => Comparable
}

function comparisonOf(shape: LevelShape): LevelComparison {
  return {
    ofContent: (content) => comparableOfContract(content, shape.leaves),
    ofForm: (values, shown) =>
      comparableOfForm(values, shape.leaves, {
        nameOf,
        kindOf: (leaf) => kindOf(shape.emitted.fields[nameOf(leaf)]),
        shownOf: (leaf) => shown[leaf],
      }),
  }
}

export const platformComparison = comparisonOf(PLATFORM)
export const defaultsComparison = comparisonOf(DEFAULTS)

/** Correctiva con su motivo, o ninguno de los dos. */
const correctiveOf = (values: Readonly<Record<string, string>>) =>
  values['corrective'] === 'true' ? { corrective: true, reason: values['reason'] ?? '' } : {}

export const platformFormOf = (content: PlatformConfigurationContent) => formOf(PLATFORM, content)

export const platformConstraints = (values: Readonly<Record<string, string>>, shown: Shown) =>
  constraintsOfLevel(PLATFORM, values, shown)

export function platformBodyOf(
  values: Readonly<Record<string, string>>,
  shown: Shown,
): PlatformConfigurationInput {
  return {
    /* Un `as` y no una construcción tipada: el objeto se arma recorriendo
       hojas por su camino, que el compilador no puede seguir. Cada hoja sale
       de los grupos, que el compilador verifica contra el contrato; el backend
       juzga el resto y lo dice en su campo. */
    content: contentOf(PLATFORM, values, shown) as PlatformConfigurationContent,
    ...correctiveOf(values),
  }
}

/**
 * **El reintento de la plataforma tras un choque**: todo se edita, así que el
 * contenido son las hojas que fusionó la puerta, y nada sale de la relectura.
 */
export function mergedPlatformBodyOf(
  merged: Readonly<Record<string, unknown>>,
  values: Readonly<Record<string, string>>,
): PlatformConfigurationInput {
  return {
    /* El mismo `as` que el cuerpo del formulario, por la misma razón. */
    content: contractOfComparable(merged, PLATFORM.leaves) as PlatformConfigurationContent,
    ...correctiveOf(values),
  }
}

export const defaultsFormOf = (content: TreatmentDefaultsContent) => formOf(DEFAULTS, content)

export const defaultsConstraints = (values: Readonly<Record<string, string>>, shown: Shown) =>
  constraintsOfLevel(DEFAULTS, values, shown)

export function defaultsBodyOf(
  values: Readonly<Record<string, string>>,
  shown: Shown,
  inForce: TreatmentDefaultsContent,
): TreatmentDefaultsInput {
  return defaultsBodyWith(contentOf(DEFAULTS, values, shown), inForce, values)
}

/**
 * **El reintento de los defaults tras un choque** (research §4): las hojas que
 * fusionó la puerta, y la política de decisión y el riesgo de devolución **de
 * la relectura**. El operador no los edita: son de quien publicó en el medio.
 */
export function mergedDefaultsBodyOf(
  merged: Readonly<Record<string, unknown>>,
  reread: TreatmentDefaultsContent,
  values: Readonly<Record<string, string>>,
): TreatmentDefaultsInput {
  return defaultsBodyWith(contractOfComparable(merged, DEFAULTS.leaves), reread, values)
}

function defaultsBodyWith(
  content: Record<string, unknown>,
  inForce: TreatmentDefaultsContent,
  values: Readonly<Record<string, string>>,
): TreatmentDefaultsInput {
  /* Lo que no se edita, colgado entero y sin tocar: el mismo objeto que vino. */
  content['decisionPolicy'] = inForce.decisionPolicy
  setAt(content, 'commercialPolicy.returnRisk', inForce.commercialPolicy.returnRisk)
  return {
    /* El mismo `as` que la plataforma, por la misma razón. */
    content: content as TreatmentDefaultsContent,
    ...correctiveOf(values),
  }
}
