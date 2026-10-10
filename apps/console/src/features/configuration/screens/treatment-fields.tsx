import {
  Button,
  Checkbox,
  Field,
  MarkGroup,
  NumberInput,
  Section,
  Select,
  TextInput,
  Value,
} from '@granito/ui'
import type { Form, MessageConstraints, Presentation } from '@ope/core'
import type { ReactNode } from 'react'
import { type OperativeLeaf, TREATMENT_GROUPS } from '../data/groups'
import { labelOf, present, valueAt } from '../data/present'
import { decimalsFor, type Kind, kindOf, rowsOf, type Shown } from '../data/treatment-form'
import { TREATMENT_PRESENTATION } from '../data/units'
import { configurationStrings } from '../strings'

type Values = Readonly<Record<string, string>>

/** Heredar o declarar: lo que la configuración del merchant agrega sobre los defaults. */
export type Inheritance = {
  /** Lo que hoy rige, para mostrar lo heredado. */
  readonly effective: unknown
  /** De dónde sale un valor heredado: «Heredado de defaults-1». */
  readonly inheritedFrom: string
  readonly declare: (leaf: OperativeLeaf) => void
  readonly inherit: (leaf: OperativeLeaf) => void
}

/**
 * **Los valores operativos del tratamiento, editables** (feature 008).
 *
 * Los usan la publicación del merchant —donde cada valor **se hereda o se
 * declara** (research §6)— y la de los defaults —donde todo es propio—. Un
 * valor heredado se ve de sólo lectura, con su origen y «declarar»; uno
 * declarado es su control, con «heredar». Heredar no es vaciar: es sacar el
 * valor del cuerpo, y es un botón, no un campo en blanco.
 *
 * El control sale de lo que el contrato dice del valor (`kindOf`): un número,
 * una marca, una lista cerrada, un texto o una lista de cualquiera de ellos.
 */
export function TreatmentFields({
  form,
  prefix,
  shown,
  constraints,
  inheritance,
}: {
  readonly form: Form<Values>
  /** Dónde viven los valores en el cuerpo: `declared` o `content`. */
  readonly prefix: string
  readonly shown: Shown
  readonly constraints: MessageConstraints
  readonly inheritance?: Inheritance
}) {
  return (
    <>
      {TREATMENT_GROUPS.map((group) => (
        <Section key={group.title} title={group.title} why={group.why} columns={2}>
          {group.leaves.map((leaf) => (
            <LeafField
              key={leaf}
              form={form}
              leaf={leaf}
              name={`${prefix}.${leaf}`}
              shown={shown[leaf]}
              constraints={constraints}
              inheritance={inheritance}
            />
          ))}
        </Section>
      ))}
    </>
  )
}

function LeafField({
  form,
  leaf,
  name,
  shown,
  constraints,
  inheritance,
}: {
  readonly form: Form<Values>
  readonly leaf: OperativeLeaf
  readonly name: string
  readonly shown: Presentation | undefined
  readonly constraints: MessageConstraints
  readonly inheritance: Inheritance | undefined
}) {
  const label = configurationStrings[leaf]
  const declared = name in form.values

  /* Heredado: el valor que viene de los defaults, de sólo lectura, y la salida
     para declararlo. No es un control apagado: es un dato (`GR-30`). */
  if (inheritance !== undefined && !declared) {
    return (
      <Field label={label} size="medium" help={inheritance.inheritedFrom}>
        {() => (
          <>
            <Value>
              {present(valueAt(inheritance.effective, leaf), TREATMENT_PRESENTATION[leaf])}
            </Value>
            <FieldAction>
              <Button type="button" size="compact" onClick={() => inheritance.declare(leaf)}>
                {configurationStrings.declare}
              </Button>
            </FieldAction>
          </>
        )}
      </Field>
    )
  }

  return (
    <EditableField
      form={form}
      label={label}
      name={name}
      shown={shown}
      constraints={constraints}
      help={inheritance === undefined ? undefined : configurationStrings.declared}
      action={
        inheritance === undefined ? undefined : (
          <Button type="button" size="compact" onClick={() => inheritance.inherit(leaf)}>
            {configurationStrings.inherit}
          </Button>
        )
      }
    />
  )
}

/** Lo que el catálogo dice con un texto fijo: el rótulo de una hoja, del tratamiento o de la plataforma. */
type LabeledLeaf = {
  [K in keyof typeof configurationStrings]: (typeof configurationStrings)[K] extends string
    ? K
    : never
}[keyof typeof configurationStrings]

/**
 * **Valores editables en sus grupos, todos propios**: la plataforma, donde no
 * hay nada que heredar. Mismo control por valor que el tratamiento.
 */
export function ValueFields({
  form,
  prefix,
  groups,
  shown,
  constraints,
}: {
  readonly form: Form<Values>
  readonly prefix: string
  readonly groups: readonly {
    readonly title: string
    readonly why: string
    readonly leaves: readonly LabeledLeaf[]
  }[]
  readonly shown: Shown
  readonly constraints: MessageConstraints
}) {
  return (
    <>
      {groups.map((group) => (
        <Section key={group.title} title={group.title} why={group.why} columns={2}>
          {group.leaves.map((leaf) => (
            <EditableField
              key={leaf}
              form={form}
              label={configurationStrings[leaf]}
              name={`${prefix}.${leaf}`}
              shown={shown[leaf]}
              constraints={constraints}
            />
          ))}
        </Section>
      ))}
    </>
  )
}

/** Un valor con su control, y quizás un botón a su lado. */
function EditableField({
  form,
  label,
  name,
  shown,
  constraints,
  help,
  action,
}: {
  readonly form: Form<Values>
  readonly label: string
  readonly name: string
  readonly shown: Presentation | undefined
  readonly constraints: MessageConstraints
  readonly help?: string | undefined
  readonly action?: ReactNode
}) {
  const field = constraints.fields[name]
  const kind = kindOf(field)
  const integer = field?.type === 'integer' || field?.items?.type === 'integer'
  /* El error de un renglón se muestra en el campo de la lista, junto al de la
     lista entera: el campo es uno solo y los renglones no tienen rótulo propio. */
  const rowError = rowsOf(form.values, name)
    .map((row) => form.errorOf(row))
    .find((each) => each !== undefined)

  return (
    <Field
      label={label}
      size="medium"
      required={constraints.required.includes(name)}
      help={help}
      error={form.errorOf(name) ?? rowError}
    >
      {(props) => (
        <>
          <Control
            form={form}
            name={name}
            kind={kind}
            options={field?.items?.enum ?? field?.enum ?? []}
            shown={shown}
            integer={integer}
            props={props}
          />
          {action === undefined ? null : <FieldAction>{action}</FieldAction>}
        </>
      )}
    </Field>
  )
}

/** Lo que `Field` le cuelga al control: el id que su rótulo nombra, y lo que lo describe. */
type ControlProps = {
  readonly id: string
  readonly 'aria-describedby': string | undefined
  readonly 'aria-invalid': boolean | undefined
}

/** La unidad que se ve al lado de un número. */
function suffixOf(shown: Presentation | undefined): string | undefined {
  if (shown === undefined) return undefined
  if ('rate' in shown) return configurationStrings.percent
  return configurationStrings.units[shown.duration.unit]
}

function Control({
  form,
  name,
  kind,
  options,
  shown,
  integer,
  props,
}: {
  readonly form: Form<Values>
  readonly name: string
  readonly kind: Kind
  readonly options: readonly (string | number | boolean)[]
  readonly shown: Presentation | undefined
  readonly integer: boolean
  readonly props: ControlProps
}): ReactNode {
  const value = form.values[name] ?? ''
  const set = (next: string) => form.set(name, next)
  const blur = () => form.blur(name)

  switch (kind) {
    case 'number':
      return (
        <NumberInput
          {...props}
          value={value}
          decimals={decimalsFor(value, shown, integer)}
          suffix={suffixOf(shown)}
          onChange={set}
          onBlur={blur}
        />
      )
    case 'boolean':
      return (
        <Select {...props} value={value} onChange={(event) => set(event.target.value)}>
          <option value="true">{configurationStrings.yes}</option>
          <option value="false">{configurationStrings.no}</option>
        </Select>
      )
    case 'choice':
      return (
        <Select {...props} value={value} onChange={(event) => set(event.target.value)}>
          {options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {labelOf(String(option))}
            </option>
          ))}
        </Select>
      )
    case 'text':
      return (
        <TextInput
          {...props}
          value={value}
          onChange={(event) => set(event.target.value)}
          onBlur={blur}
        />
      )
    case 'marks':
      return <Marks form={form} name={name} options={options} />
    case 'numbers':
    case 'texts':
      return <Rows form={form} name={name} kind={kind} shown={shown} integer={integer} />
  }
}

/** Reemplazar los renglones de una lista por otros, en orden. */
function replaceRows(form: Form<Values>, name: string, items: readonly string[]) {
  for (const row of rowsOf(form.values, name)) form.unset(row)
  for (const [at, item] of items.entries()) form.set(`${name}.${at}`, item)
}

/** Una lista cerrada: una marca por opción del contrato, y la lista son las marcadas. */
function Marks({
  form,
  name,
  options,
}: {
  readonly form: Form<Values>
  readonly name: string
  readonly options: readonly (string | number | boolean)[]
}) {
  const chosen = rowsOf(form.values, name).map((row) => form.values[row] ?? '')
  return (
    <MarkGroup row>
      {options.map((option) => {
        const value = String(option)
        return (
          <Checkbox
            key={value}
            label={labelOf(value)}
            checked={chosen.includes(value)}
            onChange={(event) =>
              replaceRows(
                form,
                name,
                /* En el orden del contrato, no en el de los clics: así dos
                   versiones con lo mismo son el mismo cuerpo. */
                options
                  .map(String)
                  .filter((each) =>
                    each === value ? event.target.checked : chosen.includes(each),
                  ),
              )
            }
          />
        )
      })}
    </MarkGroup>
  )
}

/** Una lista abierta: un renglón por elemento, «quitar» en cada uno y «agregar» al final. */
function Rows({
  form,
  name,
  kind,
  shown,
  integer,
}: {
  readonly form: Form<Values>
  readonly name: string
  readonly kind: 'numbers' | 'texts'
  readonly shown: Presentation | undefined
  readonly integer: boolean
}) {
  const rows = rowsOf(form.values, name)
  const next = rows.reduce((max, row) => Math.max(max, Number(row.slice(name.length + 1)) + 1), 0)
  return (
    <>
      {rows.map((row) => (
        <MarkGroup key={row} row>
          {kind === 'numbers' ? (
            <NumberInput
              aria-label={row}
              value={form.values[row] ?? ''}
              decimals={decimalsFor(form.values[row] ?? '', shown, integer)}
              suffix={suffixOf(shown)}
              onChange={(value) => form.set(row, value)}
              onBlur={() => form.blur(row)}
            />
          ) : (
            <TextInput
              aria-label={row}
              value={form.values[row] ?? ''}
              onChange={(event) => form.set(row, event.target.value)}
              onBlur={() => form.blur(row)}
            />
          )}
          <Button type="button" size="compact" onClick={() => form.unset(row)}>
            {configurationStrings.remove}
          </Button>
        </MarkGroup>
      ))}
      <FieldAction>
        <Button type="button" size="compact" onClick={() => form.set(`${name}.${next}`, '')}>
          {configurationStrings.add}
        </Button>
      </FieldAction>
    </>
  )
}

/**
 * **Un botón al lado del dato de un campo, a su propio ancho.**
 *
 * Un campo de granito apila lo que tiene adentro y lo estira al ancho de la
 * columna, que es lo que un control necesita y lo que un botón no: «declarar»
 * a todo lo ancho se lee como el campo mismo. Envolverlo en un elemento propio
 * deja que el envoltorio se estire y el botón no. Es estructura, no estilo; la
 * pieza que falta —un campo que alterna entre heredado y declarado— es una
 * propuesta a granito (spec, «Lo que queda abierto»).
 */
function FieldAction({ children }: { readonly children: ReactNode }) {
  return <span>{children}</span>
}
