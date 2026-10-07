/**
 * De dónde saca cada comprobación el repositorio que tiene que revisar, y su
 * configuración.
 *
 * **La raíz es `process.cwd()`, no la carpeta de este archivo.** Publicado, esto
 * vive en `node_modules/@cuarzo/core/checks/`, así que mirarse a sí mismo sería
 * revisar el paquete en vez de la aplicación.
 *
 * Lo que varía entre repositorios se declara en el `package.json` del que las
 * corre, bajo la clave `cuarzo`. Lo que no varía —la dirección de las
 * dependencias de `CU-15`, las reglas de `TAN-6`— no se configura: si se
 * pudiera apagar, dejaría de ser una garantía.
 *
 * **Y eso se verifica acá abajo**, porque decirlo no alcanzaba: la clave se
 * esparcía sobre los valores por omisión sin mirar qué traía, así que cualquier
 * aplicación podía vaciar el mapa de decisiones desde su propio `package.json`
 * y aprobar en verde.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const ROOT = process.cwd()

const manifestPath = join(ROOT, 'package.json')
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

/** Lo que el `package.json` de este repositorio declara. Puede no declarar nada. */
export const declared = manifest.cuarzo ?? {}

/**
 * **Las claves que se pueden declarar, y nada más.**
 *
 * El objeto se esparce sobre los valores por omisión, así que **cualquier clave
 * ahí adentro gana**. Sin esta lista, `decisionDocs: []` en el `package.json` de
 * una aplicación **vacía el mapa de decisiones entero** y la comprobación
 * aprueba: no hay estados que revisar, ni identificadores repetidos, ni citas
 * que resolver. En verde, y desde un archivo que nadie mira dos veces.
 *
 * Una clave con un dedazo tampoco es inocua: no se aplica, la comprobación corre
 * con el valor por omisión, y quien la escribió cree que configuró algo.
 */
const KNOWN = [
  'decisionDocs',
  'decisionIndex',
  'compositionLayer',
  'cuarzoDocs',
  'granitoDocs',
  'platformDocs',
]

function reject(what, why) {
  console.error('')
  console.error(`  FALLA  La configuración de cuarzo no es válida: ${what}`)
  console.error(`         ${why}`)
  console.error('')
  process.exit(1)
}

for (const key of Object.keys(declared)) {
  if (!KNOWN.includes(key)) {
    reject(`"${key}" no se puede declarar`, `Las que sí: ${KNOWN.join(' · ')}`)
  }
}

/**
 * **Vaciar una lista es apagar la comprobación que la recorre**, y eso no es
 * configurar: es lo que `TAN-6` llama una comprobación que aprueba sin sujetos.
 * Un repositorio sin decisiones no declara la lista vacía — no declara la clave.
 */
if (Array.isArray(declared.decisionDocs) && declared.decisionDocs.length === 0) {
  reject(
    '`decisionDocs` está vacía',
    'Sacá la clave si este repositorio no tiene decisiones propias',
  )
}

if ('decisionIndex' in declared && !declared.decisionIndex) {
  reject('`decisionIndex` está vacío', 'Sacá la clave, o nombrá el archivo que hace de índice')
}

/**
 * **La capa de composición se llama `app/`**, y la lista se acota a ella.
 *
 * En la aplicación es `src/app/` (`CU-15`); en el paquete, la carpeta `app` de
 * su `src` (`CU-40`). Las dos son la misma idea un nivel adentro: la única capa
 * que conoce a todas las demás. Cualquier otra carpeta, no.
 *
 * Sin esto la lista es la puerta trasera más ancha del repositorio: agregar un
 * archivo del núcleo lo exime de las reglas 1 y 6 de `TAN-6` —estado mutable de
 * módulo, y nombrar implementaciones concretas— y **nada lo denuncia**.
 */
const IN_APP_LAYER = /(^|\/)app\//

for (const file of declared.compositionLayer ?? []) {
  if (!IN_APP_LAYER.test(file)) {
    reject(
      `"${file}" no puede ser raíz de composición`,
      'La capa de composición se llama app/ (CU-15, CU-40): eximir un archivo de afuera apaga las reglas 1 y 6 de TAN-6',
    )
  }
}

/** Lo declarado bajo `cuarzo` en el `package.json`, con lo que hace falta por omisión. */
export const config = {
  /** Los documentos donde viven las decisiones de este repositorio. */
  decisionDocs: ['docs/arquitectura.md', 'docs/seguridad.md'],
  /** El índice que tiene que coincidir con ellos. */
  decisionIndex: 'docs/decisiones.md',
  /**
   * Los archivos que pueden nombrar implementaciones concretas y guardar estado
   * de módulo (`CU-36`).
   *
   * Se declara y no se adivina: **una lista corta y explícita** deja a la vista
   * cuánto creció la capa de composición. Si hace falta agregar algo, lo que
   * hay que revisar es el diseño.
   */
  compositionLayer: ['src/app/main.tsx'],
  ...declared,
}

export const repoName = manifest.name ?? '(sin nombre)'
