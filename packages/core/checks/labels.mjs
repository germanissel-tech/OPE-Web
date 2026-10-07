/**
 * **El mismo campo se llama igual en todas las pantallas** (`CU-43`).
 *
 * Un rótulo no es de la pantalla: es **del campo**. Que la grilla diga «Precio»
 * y la ficha «Importe» del mismo dato no rompe nada, y por eso se descubre
 * tarde — cuando alguien pregunta si son dos cosas distintas.
 *
 * ## Por qué se puede verificar, y por qué se puede sin falsos positivos
 *
 * `CU-43` puso los textos en un catálogo **por funcionalidad**, así que están
 * juntos y se pueden leer. Pero comparar todas las claves marcaría de más: dos
 * funcionalidades tienen derecho a decir cosas distintas en su estado vacío.
 *
 * **Lo que se compara son las claves que también son un campo del contrato.**
 * Ahí no hay margen: si dos catálogos declaran `price`, están hablando del mismo
 * campo — el contrato es el que dice cuáles son el mismo, y ésa es justamente la
 * parte difícil cuando **el mismo campo llega desde endpoints distintos**.
 *
 * ## Lo que no cubre, y conviene saberlo
 *
 * Un rótulo escrito con **otra clave** —`articleName` en vez de `name`— se le
 * escapa. Es el límite de unir por nombre, y unir por otra cosa exigiría que el
 * contrato publicara el rótulo, que hoy no lo hace.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ROOT } from './context.mjs'

const FEATURES = join(ROOT, 'src', 'features')
const API = join(ROOT, 'src', 'api')

console.log('')

if (!existsSync(FEATURES) || !existsSync(API)) {
  console.log('  --     no hay funcionalidades ni contratos: nada que comparar todavía')
  console.log('')
  process.exit(0)
}

/** Los nombres de campo que el contrato declara, de todo lo generado. */
const fields = new Set()
for (const system of readdirSync(API)) {
  const generated = join(API, system, 'constraints.ts')
  /* sin sujeto: un sistema sin restricciones generadas no aporta campos, y que
     no haya ninguno lo dice el corte de abajo con su renglón. */
  if (!existsSync(generated)) continue

  for (const [, name] of readFileSync(generated, 'utf8').matchAll(/^ {6}(\w+): \{/gm)) {
    fields.add(name)
  }
}

if (fields.size === 0) {
  console.log('  --     ningún contrato generó restricciones: no hay con qué unir los rótulos')
  console.log('')
  process.exit(0)
}

/** Los rótulos de cada funcionalidad, por clave. */
const byKey = new Map()
for (const feature of readdirSync(FEATURES)) {
  const catalog = join(FEATURES, feature, 'strings.ts')
  /* sin sujeto: una funcionalidad sin catálogo de textos no tiene rótulos que
     comparar. Que **ninguna** lo tenga se ve en el número que se informa. */
  if (!existsSync(catalog)) continue

  const text = readFileSync(catalog, 'utf8')
  for (const [, key, label] of text.matchAll(/^ {2}(\w+): '([^']*)',$/gm)) {
    if (!fields.has(key)) continue
    if (!byKey.has(key)) byKey.set(key, new Map())
    byKey.get(key).set(feature, label)
  }
}

const clashing = [...byKey.entries()].filter(
  ([, byFeature]) => new Set(byFeature.values()).size > 1,
)

if (clashing.length > 0) {
  for (const [key, byFeature] of clashing) {
    console.log(`  FALLA  el campo "${key}" se llama distinto según la pantalla`)
    for (const [feature, label] of byFeature) {
      console.log(`         features/${feature}  —  «${label}»`)
    }
  }
  console.log('')
  console.log('EL MISMO CAMPO TIENE DOS NOMBRES')
  console.log('')
  process.exit(1)
}

const compared = [...byKey.values()].filter((byFeature) => byFeature.size > 1).length

console.log(
  `  ok     ${byKey.size} rótulos atados a un campo del contrato` +
    (compared > 0
      ? `, ${compared} en más de una funcionalidad`
      : ' · todavía ninguno se repite entre funcionalidades'),
)
console.log('')
