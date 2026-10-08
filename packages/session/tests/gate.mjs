/**
 * Verifica **la regla que gobierna el contrato de `@ope/session`**: que nada
 * de lo que se exporta permita obtener un token (`CU-10`).
 *
 * Es una comprobación sobre el **texto** de la superficie pública y no sobre su
 * comportamiento, y eso es deliberado: lo que se quiere impedir es que alguien
 * **agregue** una forma de sacar el token. Una prueba de comportamiento sólo
 * podría verificar lo que ya existe; ésta falla cuando aparece algo nuevo.
 *
 * Y verifica que **la superficie principal no nombre a ningún proveedor** —ni en
 * un tipo, ni en una constante, ni en un comentario—, mientras que una **entrada
 * adaptadora nombra exactamente uno: el que dice su nombre de archivo**.
 *
 * Sin eso, la promesa de `TAN-2` —hoy Keycloak, y se puede cambiar— sería una
 * intención y no un hecho.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MODULE_DIR = join(ROOT, 'src')

/** Lo que no puede exportarse. Si aparece algo así, la puerta dejó de ser puerta. */
const FORBIDDEN_EXPORTS = [
  /export\s+(?:async\s+)?function\s+\w*[Tt]oken\w*/,
  /export\s+const\s+\w*[Tt]oken\w*/,
  /export\s+(?:type\s+)?\{[^}]*[Tt]oken[^}]*\}/,
  /\bgetToken\b/,
  /\baccessToken\b/,
  /\bidToken\b/,
  /\brefreshToken\b/,
]

/**
 * Los proveedores que se reconocen por nombre.
 *
 * **La superficie principal no nombra a ninguno**, y una **entrada adaptadora
 * nombra exactamente uno: el suyo, el que dice su nombre de archivo.**
 *
 * Ésa es la regla que hace cobrable la promesa de `TAN-2` —hoy Keycloak, y se
 * puede cambiar—: si la forma de un proveedor está repartida por el módulo,
 * cambiarlo es una migración; si está en un archivo que se llama como él,
 * cambiarlo es cambiar un import.
 */
const PROVIDERS = ['keycloak', 'auth0', 'okta', 'cognito', 'entra id']

/*
 * `entra id` va con las dos palabras: `entra` sola es un verbo castellano y
 * aparece en la prosa —«entra sin credenciales»—. Una regla que marca lo
 * legítimo se ajusta, no se le agregan excepciones.
 */

/** Qué proveedor puede nombrar este archivo: el que lleve en su nombre, o ninguno. */
function adapterFor(fileName) {
  return PROVIDERS.find((provider) => fileName.toLowerCase().includes(provider.split(' ')[0]))
}

/**
 * **Falla si el módulo no está, en vez de degradarse.**
 *
 * El módulo existe, así que su ausencia no es «todavía no»: significa que
 * alguien lo movió. Y una comprobación que aprueba cuando **no encuentra qué
 * revisar** enseña a no leer sus aprobados.
 */
if (!existsSync(MODULE_DIR)) {
  console.log('')
  console.log('  FALLA  no encuentro packages/session/src, así que la puerta no se verificó')
  console.log('         Si el módulo se movió, hay que actualizar esta comprobación.')
  console.log('')
  process.exit(1)
}

function filesIn(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...filesIn(path))
    else if (/\.(ts|tsx)$/.test(name)) out.push(path)
  }
  return out
}

/**
 * Se revisa **el código, no la prosa**.
 *
 * Los comentarios de este módulo explican largamente por qué no existe
 * `getToken()`, y esa explicación es justamente lo que hay que conservar. Si la
 * comprobación mirara los comentarios, el módulo fallaría por documentar bien
 * su propia regla — y la salida sería borrar la explicación, que es lo peor que
 * podría pasar.
 */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')
}

/**
 * Los mecanismos de autenticación que se reconocen por nombre.
 *
 * La misma regla que con los proveedores, un nivel más abajo: **la superficie
 * principal no nombra a ninguno en su código**, y una entrada adaptadora nombra
 * exactamente el suyo. Se mira el código y no la prosa, porque los comentarios
 * de la puerta explican justamente que quien llama no sabe si adentro hay un
 * encabezado, una cookie o mTLS — y esa explicación es lo que hay que conservar.
 */
const MECHANISMS = ['bearer', 'cookie', 'mtls']

const mechanismOf = (fileName) =>
  MECHANISMS.find((mechanism) => fileName.toLowerCase().includes(mechanism))

const failures = []
const checked = filesIn(MODULE_DIR)

for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const code = stripComments(readFileSync(file, 'utf8'))

  for (const pattern of FORBIDDEN_EXPORTS) {
    const found = code.match(pattern)
    if (found) {
      failures.push({
        what: 'La puerta expone algo parecido a un token',
        where: `${shortPath}  —  ${found[0].trim()}`,
      })
    }
  }

  const ownMechanism = mechanismOf(shortPath)
  for (const mechanism of MECHANISMS) {
    if (!new RegExp(`\\b${mechanism}\\b`, 'i').test(code)) continue
    if (mechanism === ownMechanism) continue
    failures.push({
      what: ownMechanism
        ? `El adaptador ${ownMechanism} nombra además otro mecanismo`
        : 'La superficie principal nombra un mecanismo de autenticación',
      where: `${shortPath}  —  ${mechanism}`,
    })
  }

  /* Acá se mira el texto entero, comentarios incluidos: un comentario que
     nombra al proveedor es la misma fuga con otra letra, y encima invisible
     para el compilador. */
  const text = readFileSync(file, 'utf8').toLowerCase()
  const own = adapterFor(shortPath)

  for (const provider of PROVIDERS) {
    if (!new RegExp(`\\b${provider}\\b`).test(text)) continue

    if (provider === own) continue

    failures.push({
      what: own
        ? `El adaptador de ${own} nombra además a otro proveedor`
        : 'La superficie principal nombra a un proveedor concreto',
      where: `${shortPath}  —  ${provider}`,
    })
  }
}

/**
 * **La entrada recibe y no devuelve.**
 *
 * `signIn` es lo único nuevo que toca una credencial, así que es lo único que
 * podría convertirse en la forma de sacarla: con que devolviera `{ ok, token }`
 * una sola vez, cada vista de ingreso pasaría a tenerla. Se fija por el texto
 * la firma, y que `SignInOutcome` no tenga ningún miembro que la nombre.
 */
const types = stripComments(readFileSync(join(MODULE_DIR, 'types.ts'), 'utf8'))

if (!/signIn\?:\s*\(credential\?:\s*string\)\s*=>\s*Promise<SignInOutcome>/.test(types)) {
  failures.push({
    what: 'La entrada de la puerta no tiene la firma que recibe y no devuelve',
    where: 'src/types.ts  —  signIn?: (credential?: string) => Promise<SignInOutcome>',
  })
}

const outcome = /export type SignInOutcome\s*=([\s\S]*?)(?:\n\s*\n|export)/.exec(types)?.[1] ?? ''
if (outcome === '' || /token|credential/i.test(outcome)) {
  failures.push({
    what: 'El desenlace de entrar nombra la credencial, o no existe',
    where: 'src/types.ts  —  SignInOutcome',
  })
}

console.log('')
if (failures.length > 0) {
  for (const f of failures) {
    console.log(`  FALLA  ${f.what}`)
    console.log(`         ${f.where}`)
  }
  console.log('')
  console.log('LA PUERTA DEJÓ DE SER UNA PUERTA')
  console.log('')
  process.exit(1)
}

console.log(`  ok     ${checked.length} archivos de la sesión, y ninguno entrega un token`)
console.log('  ok     la superficie principal no nombra a ningún proveedor ni mecanismo')
console.log('  ok     cada adaptador nombra sólo al suyo')
console.log('  ok     la entrada recibe una credencial y no devuelve ninguna')
console.log('')
console.log('LA PUERTA SE SOSTIENE')
console.log('')
