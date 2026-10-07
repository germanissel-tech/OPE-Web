/**
 * **Las restricciones de cada mensaje, sacadas del contrato** (`CU-38`).
 *
 * Dos cosas, y son la capa 1 y la capa 2 de esa decisión:
 *
 * | | qué es |
 * |---|---|
 * | `fields` | Obligatorios, largos y patrones. **La forma**, que se valida sin consultar nada |
 * | `invariants` | Las que miran **dos campos del mismo mensaje**, con su código y su regla |
 *
 * `openapi-typescript` emite el tipo pero no las restricciones: `maxLength: 100`
 * no llega a ninguna parte que se pueda leer al correr. Escribirlas a mano sería
 * la copia que un día no coincide — la cuarta de esta familia, después de los
 * roles, la clave de idempotencia y el tamaño de página.
 *
 * **La regla se emite como texto literal a propósito.** De ahí sale la garantía
 * que `CU-38` pide: quien copia la lógica en una pantalla escribe la regla al
 * lado, y si el contrato la cambia **deja de compilar** en vez de seguir
 * bloqueando con el criterio de antes.
 *
 * Se lee por líneas y no con un analizador de YAML, igual que `roles.mjs`. **Se
 * verifica la indentación en vez de suponerla**: si el contrato cambia de forma,
 * falla en vez de emitir un mapa a medias — que es lo peor que podría hacer,
 * porque un campo que se pierde deja de validarse y nadie se entera.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { emit } from './emit.mjs'
import { ROOT } from './raiz.mjs'

const CONTRACT = join(ROOT, 'contracts', 'demo.yaml')
const OUTPUT = join(ROOT, 'src', 'api', 'demo', 'constraints.ts')

const lines = readFileSync(CONTRACT, 'utf8').split('\n')

/** Cuántos espacios lleva adelante. `-1` si la línea está en blanco. */
const indentOf = (line) => (line.trim() === '' ? -1 : line.length - line.trimStart().length)

const opens = lines.indexOf('  schemas:')
if (opens < 0) throw new Error(`No encontré "  schemas:" en ${CONTRACT}. ¿Cambió su forma?`)

/** Cada mensaje con sus líneas, cortando cuando vuelve a haber uno al mismo nivel. */
const messages = new Map()
let current
for (const line of lines.slice(opens + 1)) {
  const indent = indentOf(line)
  if (indent === -1) continue
  /* Se salió de `schemas:` — lo que sigue es otra sección de `components`. */
  if (indent <= 2) break

  if (indent === 4 && line.trimEnd().endsWith(':')) {
    current = line.trim().slice(0, -1)
    messages.set(current, [])
    continue
  }
  if (current) messages.get(current).push(line)
}

if (messages.size === 0) {
  throw new Error('No encontré ningún mensaje bajo schemas. ¿Cambió la indentación del contrato?')
}

/**
 * **Cómo se dibuja un campo, derivado de qué es** (`CU-14`).
 *
 * granito recibe el tipo del dato y pone el texto, la tipografía y la
 * alineación. Elegirlo a mano en cada grilla es **cómo el mismo importe termina
 * viéndose distinto en dos pantallas** — lo escribió granito, y el contrato ya
 * tiene con qué evitarlo: `las-animas/backend` declara 64 campos `Amount`, 17
 * `Percentage` y 35 fechas.
 *
 * Se emite el vocabulario de granito y no el del contrato para que entre un
 * solo salto: `format: fields.price.displayAs` y nada en el medio.
 */
const DISPLAY = {
  Amount: 'money',
  Percentage: 'percent',
}

/** Las restricciones de un campo, de las que este repositorio usa. */
function constraintsOf(body, resolve) {
  const parts = []
  let display

  /* Un `$ref` es todo el campo: se trae lo que el schema apuntado declara, y de
     su nombre sale cómo se dibuja. */
  const ref = body.find((line) => line.trim().startsWith('$ref:'))
  if (ref) {
    const name = ref.trim().split('/').pop().replace(/'$/, '')
    display = DISPLAY[name]
    body = resolve(name) ?? []
  }

  for (const line of body) {
    const [, key, value] = line.trim().match(/^(\w+): (.*)$/) ?? []
    if (key === 'type') {
      parts.push(`type: '${value}'`)
      /* Un entero se alinea y se agrupa distinto de un texto, y eso ya lo sabe
         granito: alcanza con decirle qué es. */
      if (value === 'integer' && display === undefined) display = 'integer'
    }
    if (key === 'format' && value === 'date') display = 'date'
    if (['minLength', 'maxLength', 'minimum', 'maximum'].includes(key)) {
      parts.push(`${key}: ${value}`)
    }
    if (key === 'pattern') {
      /* La barra se escapa al emitirla: en el YAML `\.` es un punto literal, y
         en una cadena de JS sin escapar se pierde — quedaría un `.` que acepta
         cualquier carácter, que es **más laxo que el contrato**, y de los dos
         errores ése es el que no se descubre. */
      const source = value.replace(/^'|'$/g, '')
      parts.push(`pattern: '${source.replaceAll('\\', '\\\\')}'`)
    }
  }

  if (display) parts.push(`displayAs: '${display}'`)
  return parts.join(', ')
}

/**
 * Las líneas de un schema con nombre, para resolver un `$ref`.
 *
 * **Un solo nivel a propósito**: los que se referencian acá son tipos escalares
 * —un importe, un porcentaje—, no objetos. Si algún día un `$ref` apuntara a
 * otro `$ref`, esto devolvería el segundo sin seguirlo, y **eso se vería**: el
 * campo saldría sin restricciones.
 */
const resolve = (name) => messages.get(name)

const emitted = []
let withInvariants = 0

for (const [name, body] of messages) {
  const required = body.find((line) => line.trim().startsWith('required: ['))
  const names = required
    ? required
        .slice(required.indexOf('[') + 1, required.indexOf(']'))
        .split(',')
        .map((each) => each.trim())
        .filter(Boolean)
    : []

  /* Los campos: lo que está a ocho espacios debajo de `properties:`. */
  const at = body.findIndex((line) => line.trim() === 'properties:')
  /* Sin `properties` es un escalar con nombre —`Amount`— y no un mensaje. No
     se emite: se usa para resolver los `$ref` que lo apuntan. */
  if (at < 0) continue

  const fields = []
  let field
  for (const line of body.slice(at + 1)) {
    const indent = indentOf(line)
    if (indent === -1) continue
    if (indent <= 6) break

    if (indent === 8 && line.trimEnd().endsWith(':')) {
      field = { name: line.trim().slice(0, -1), body: [] }
      fields.push(field)
      continue
    }
    if (field && indent === 10) field.body.push(line)
  }

  if (fields.length === 0) {
    throw new Error(`El mensaje "${name}" declara properties y no tiene ninguno. ¿Cambió la forma?`)
  }

  /* Las invariantes de schema, con su regla **como texto**: es contra esto que
     se compara una copia, y por eso se emite literal y no interpretada. */
  const invariants = []
  for (const [at, line] of body.entries()) {
    const code = line.trim().match(/^- code: (\w+)$/)
    if (!code) continue
    const rule = body[at + 1]?.trim().match(/^rule: (.+)$/)
    if (!rule) {
      throw new Error(
        `La invariante "${code[1]}" de "${name}" no declara su regla en la línea siguiente.`,
      )
    }
    invariants.push(`      { code: '${code[1]}', rule: '${rule[1]}' },`)
  }
  if (invariants.length > 0) withInvariants += 1

  emitted.push(
    `  ${name}: {\n` +
      `    required: [${names.map((each) => `'${each}'`).join(', ')}],\n` +
      `    fields: {\n` +
      fields
        .map((each) => `      ${each.name}: { ${constraintsOf(each.body, resolve)} },`)
        .join('\n') +
      `\n    },\n` +
      (invariants.length === 0
        ? '    invariants: [],\n'
        : `    invariants: [\n${invariants.join('\n')}\n    ],\n`) +
      `  },`,
  )
}

emit(
  OUTPUT,
  `/**
 * Generado por \`npm run tipos\` desde \`contracts/demo.yaml\` — no editar a mano.
 * This file was auto-generated. Do not make direct changes to the file.
 *
 * Lo que el contrato le exige a cada mensaje: qué campos son obligatorios, sus
 * largos y patrones, y las invariantes que miran dos campos del mismo mensaje.
 *
 * De acá salen las dos capas locales de \`CU-38\`, y por eso se genera. Una copia
 * a mano sería la que un día no coincide con lo que la API acepta — y la que se
 * pasa de estricta **no se descubre nunca**: bloquea al operador por algo que el
 * servidor habría aceptado, y nadie tiene cómo enterarse.
 */

export const constraints = {
${emitted.join('\n')}
} as const

/** Los mensajes que el contrato declara. Un typo no compila. */
export type SchemaName = keyof typeof constraints
`,
  `${emitted.length} mensajes con sus restricciones (${withInvariants} con invariantes)`,
)
