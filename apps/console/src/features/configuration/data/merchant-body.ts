import { constraintsOf, type MessageConstraints } from '@ope/core'
import {
  CONSTRAINTS,
  type EffectiveConfiguration,
  type MerchantConfigurationDeclared,
  type MerchantConfigurationInput,
} from '../../../api/ope/client'
import { contractOfComparable } from './comparable'
import { type OperativeLeaf, TREATMENT_GROUPS } from './groups'
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
import { TREATMENT_PRESENTATION } from './units'

/**
 * **La publicación de la configuración de un merchant** (research §6 y §7).
 *
 * Un valor **declarado** está en los valores del formulario y viaja; uno
 * **heredado** no está, y no viaja: eso es lo que el contrato dice que es
 * heredar. Lo que la pantalla no edita —la política de decisión, la condición
 * de riesgo de devolución, el mapa de anclajes, las etiquetas— **no pasa por el
 * formulario**: se copia de lo declarado en la versión que rige al armar el
 * cuerpo. Es la falla más cara de la feature, y vive en un solo lugar.
 */

const PREFIX = 'declared'

/** Las restricciones emitidas de la entrada, aplanadas con el camino del valor. */
const EMITTED = constraintsOf(CONSTRAINTS, 'MerchantConfigurationInput')

/** Las hojas que la pantalla edita, en el orden de sus grupos. */
export const OPERATIVE_LEAVES: readonly OperativeLeaf[] = TREATMENT_GROUPS.flatMap(
  (group) => group.leaves,
)

export const nameOf = (leaf: string) => `${PREFIX}.${leaf}`

export const kindOfLeaf = (leaf: string) => kindOf(EMITTED.fields[nameOf(leaf)])

/** Si un número de esta hoja es entero en el contrato: decide si el campo admite decimales. */
export const isInteger = (leaf: string) => {
  const field = EMITTED.fields[nameOf(leaf)]
  return field?.type === 'integer' || field?.items?.type === 'integer'
}

/** Las entradas de una hoja a partir de un valor, y en qué unidad quedó. */
export function leafEntries(leaf: OperativeLeaf, value: unknown) {
  const preferred = TREATMENT_PRESENTATION[leaf]
  const sample = Array.isArray(value) ? value[0] : value
  const shown = typeof sample === 'number' ? shownFor(sample, preferred) : preferred
  return { entries: entriesOf(nameOf(leaf), value, kindOfLeaf(leaf), shown), shown }
}

/** El formulario, precargado con lo que declara la versión que rige. Lo heredado no entra. */
export function merchantFormOf(declared: MerchantConfigurationDeclared) {
  const values: Record<string, string> = { corrective: 'false', reason: '' }
  const shown: Record<string, Shown[string]> = {}
  for (const leaf of OPERATIVE_LEAVES) {
    const value = valueAt(declared, leaf)
    if (value === undefined) continue
    const loaded = leafEntries(leaf, value)
    Object.assign(values, loaded.entries)
    shown[leaf] = loaded.shown
  }
  return { values, shown }
}

/** Declarar una hoja: sus entradas, precargadas con lo que hoy rige. */
export const declareFrom = (leaf: OperativeLeaf, effective: EffectiveConfiguration) =>
  leafEntries(leaf, valueAt(effective, leaf))

/** Si la política comercial viaja: si se declara algún valor suyo, o si la que rige trae lo que no se edita. */
const commercialTravels = (
  values: Readonly<Record<string, string>>,
  inForce: MerchantConfigurationDeclared,
) =>
  inForce.commercialPolicy?.returnRisk !== undefined ||
  Object.keys(values).some((name) => name.startsWith(`${PREFIX}.commercialPolicy.`))

/**
 * **Lo que se exige, según lo que se cargó** (capa 1, `CU-38`).
 *
 * Dos reglas dependen de los valores: la política comercial declarada nombra
 * su versión —el esquema la exige, pero sólo si la política viaja—, y una
 * versión correctiva dice por qué.
 */
export function merchantConstraints(
  values: Readonly<Record<string, string>>,
  shown: Shown,
  inForce: MerchantConfigurationDeclared,
): MessageConstraints {
  const base = constraintsIn(EMITTED, PREFIX, shown)
  const required = [...base.required]
  if (commercialTravels(values, inForce)) required.push(nameOf('commercialPolicy.version'))
  if (values['corrective'] === 'true') required.push('reason')
  return { required, fields: base.fields }
}

/** El cuerpo de la publicación: lo operativo como quedó, y lo demás tal cual rige. */
export function merchantBodyOf(
  values: Readonly<Record<string, string>>,
  shown: Shown,
  inForce: MerchantConfigurationDeclared,
): MerchantConfigurationInput {
  const declared: Record<string, unknown> = {}
  for (const leaf of OPERATIVE_LEAVES) {
    const value = valueFrom(values, nameOf(leaf), kindOfLeaf(leaf), shown[leaf])
    if (value !== undefined) setAt(declared, leaf, value)
  }
  return bodyWith(declared, inForce, values)
}

/**
 * **El cuerpo del reintento tras un choque** (feature 009, research §4): las
 * hojas operativas fusionadas por la puerta, y **lo no editado de la
 * relectura**, no de lo que regía al abrir. El operador nunca tocó la política
 * de decisión, el riesgo de devolución, los anclajes ni las etiquetas: son de
 * quien escribió en el medio, y mandar los de al abrir los pisaría.
 *
 * El modo correctivo y el motivo no son del recurso: salen de la pantalla.
 */
export function mergedMerchantBodyOf(
  merged: Readonly<Record<string, unknown>>,
  reread: MerchantConfigurationDeclared,
  values: Readonly<Record<string, string>>,
): MerchantConfigurationInput {
  return bodyWith(contractOfComparable(merged, OPERATIVE_LEAVES), reread, values)
}

/** Las hojas operativas ya en el contrato, más lo que no se edita y el modo correctivo. */
function bodyWith(
  declared: Record<string, unknown>,
  inForce: MerchantConfigurationDeclared,
  values: Readonly<Record<string, string>>,
): MerchantConfigurationInput {
  /* Lo que no se edita, colgado entero y sin tocar: es el mismo objeto que
     vino, así que no puede perder nada en el camino. */
  if (inForce.decisionPolicy !== undefined) declared['decisionPolicy'] = inForce.decisionPolicy
  if (inForce.anchors !== undefined) declared['anchors'] = inForce.anchors
  if (inForce.attributeLabels !== undefined) declared['attributeLabels'] = inForce.attributeLabels
  const returnRisk = inForce.commercialPolicy?.returnRisk
  if (returnRisk !== undefined) setAt(declared, 'commercialPolicy.returnRisk', returnRisk)

  const corrective = values['corrective'] === 'true'
  return {
    /* Un `as` y no una construcción tipada: el objeto se arma recorriendo
       hojas por su camino, que el compilador no puede seguir. Lo que sí
       sostiene la forma es que cada hoja sale del contrato (`OperativeLeaf`) y
       lo copiado es lo que el mismo contrato devolvió; el backend juzga el
       resto y lo dice en su campo. */
    declared: declared as MerchantConfigurationDeclared,
    ...(corrective ? { corrective: true, reason: values['reason'] ?? '' } : {}),
  }
}
