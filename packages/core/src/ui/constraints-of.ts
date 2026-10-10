import { Failure } from '../base/failure'
import type { FieldConstraints, MessageConstraints } from './use-form'

/** Una restricción como sale emitida: la de un campo, más `ref` cuando el campo es otro esquema. */
type Emitted = FieldConstraints & { readonly ref?: string }

/** Las restricciones de un esquema, como el backend las emite: planas, con `ref` para lo anidado. */
type EmittedSchema = {
  readonly required: readonly string[]
  readonly fields: Readonly<Record<string, Emitted>>
}

/**
 * **Las restricciones de un formulario anidado**, a partir de las emitidas.
 *
 * El backend emite una entrada por esquema, y lo anidado es
 * `{ type: 'object', ref: 'FreshnessDeclared' }`. Un formulario nombra sus
 * campos por el camino del valor en el cuerpo —`declared.freshness.catalogMs`—,
 * porque así el puntero de un `422` es el nombre del campo (`fieldNameOf`). Esto
 * recorre los `ref` y devuelve las restricciones con esos nombres.
 *
 * ## Lo requerido, y por qué no se arrastra siempre
 *
 * `version` es requerida en una política, pero la política misma es opcional:
 * se exige **sólo si la política viaja**. Las restricciones no saben qué viaja;
 * lo sabe quien arma el cuerpo. Así que lo requerido de un objeto se arrastra
 * sólo si el objeto también es requerido, en toda la cadena, y el resto lo
 * agrega la pantalla cuando corresponde —como el contacto de la 007—.
 *
 * Una lista queda como lista, con lo que exige a cada renglón en `items`: el
 * formulario la parte en renglones (`x.0`, `x.1`) y `useForm` ya los valida.
 * Una lista de objetos no se abre: sus renglones no son campos de texto.
 */
export function constraintsOf(
  all: Readonly<Record<string, EmittedSchema>>,
  root: string,
  prefix = '',
): MessageConstraints {
  const fields: Record<string, FieldConstraints> = {}
  const required: string[] = []

  const walk = (schema: string, at: string, carried: boolean) => {
    const emitted = all[schema]
    if (!emitted) {
      throw new Failure(
        'declaration.unknownConstraint',
        `Las restricciones nombran «${schema}» y no está entre las emitidas: el contrato sincronizado está incompleto.`,
      )
    }
    for (const [name, field] of Object.entries(emitted.fields)) {
      const path = at === '' ? name : `${at}.${name}`
      const isRequired = carried && emitted.required.includes(name)
      if (field.ref !== undefined && field.type === 'object') {
        walk(field.ref, path, isRequired)
        continue
      }
      const { ref: _ref, ...own } = field
      fields[path] = own
      if (isRequired) required.push(path)
    }
  }

  walk(root, prefix, true)
  return { required, fields }
}
