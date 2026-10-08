/**
 * Verifica **la dirección de las dependencias** de CU-15.
 *
 * Existe porque `CU-16` declaró el hueco: **Biome no puede verificar límites
 * entre carpetas**. `noRestrictedImports` no acepta patrones y `noPrivateImports`
 * trabaja con etiquetas de visibilidad, no con zonas de rutas. Así que la regla
 * unidireccional no la cubre el linter y la sostiene esto.
 *
 * Se escribió a mano y sin dependencias por la misma razón que
 * `decisiones.mjs`: la regla es nuestra y es corta, y la configuración de una
 * herramienta general sería más larga que la comprobación.
 *
 * **Lo que NO ve, declarado**: importaciones armadas en tiempo de ejecución.
 * `CU-15` prohíbe los alias que lo harían ambiguo, así que lo único que se
 * escapa es una ruta construida con una variable — que es igual de visible al
 * leer, y que ninguna de estas zonas tiene motivo para usar.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

import { apps, ROOT } from './context.mjs'

/**
 * El `src/` de cada aplicación declarada. Las reglas de abajo valen **adentro
 * de cada una**: lo que una aplicación comparte con otra pasa por `packages/`,
 * nunca por una importación relativa que cruce de `apps/x` a `apps/y`.
 */
const APP_ROOTS = apps.map((app) => join(ROOT, ...app.split('/'), 'src'))

/** A qué aplicación pertenece un archivo, o `undefined` si a ninguna. */
const rootOf = (path) => APP_ROOTS.find((root) => path.startsWith(root + sep) || path === root)

/**
 * Quién puede importar a quién. `lib` y `components` alimentan a `features`,
 * que alimenta a `app`, y nunca al revés.
 */
const ALLOWED = {
  app: ['app', 'features', 'components', 'lib', 'api'],
  /* `api` entra acá para que la falla diga «sólo data/ puede» y no «la
     dirección va al revés», que mandaría a arreglar lo que no es. */
  features: ['features', 'components', 'lib', 'api'],
  components: ['components', 'lib'],
  lib: ['lib'],
  api: ['api'],
  testing: ['testing', 'components', 'lib', 'api', 'features'],
}

/** `api/` es la excepción: sólo la puede tocar la carpeta `data` de una funcionalidad. */
const ONLY_DATA_SEES_API = true

const failures = []

function fail(what, where) {
  failures.push({ what, where })
}

function filesIn(dir, pattern = /\.(ts|tsx)$/) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...filesIn(path, pattern))
    else if (pattern.test(name)) out.push(path)
  }
  return out
}

/** La zona y, si corresponde, la funcionalidad y si está en `data/`. */
function locate(path) {
  const root = rootOf(path)
  if (!root) return { zone: undefined }
  const parts = relative(root, path).split(sep)
  const zone = parts[0]
  if (zone !== 'features') return { zone }
  return {
    zone,
    feature: parts[1],
    inDataFolder: parts.includes('data'),
  }
}

/** Las importaciones relativas del archivo. Las de paquete no se miran acá. */
function importsIn(text) {
  const pattern = /(?:from|import)\s*\(?\s*['"](\.[^'"]*)['"]/g
  return [...text.matchAll(pattern)].map((m) => m[1])
}

for (const root of APP_ROOTS) {
  if (!existsSync(root)) {
    console.error(`No encuentro ${relative(ROOT, root)}. ¿Se corrió desde la raíz del repositorio?`)
    process.exit(1)
  }
}

const allFiles = APP_ROOTS.flatMap((root) => filesIn(root))
let checkedCount = 0

for (const file of allFiles) {
  const from = locate(file)
  const shortPath = relative(ROOT, file).split(sep).join('/')

  /* Nada de archivos barril: rompen el sacudido de árbol (CU-15). */
  if (/[\\/]index\.tsx?$/.test(file)) {
    fail('Archivo barril', shortPath)
  }

  const text = readFileSync(file, 'utf8')

  for (const specifier of importsIn(text)) {
    checkedCount++
    const target = resolve(dirname(file), specifier)
    if (rootOf(target) !== rootOf(file)) {
      fail('Importa fuera del src/ de su aplicación', `${shortPath}  ->  ${specifier}`)
      continue
    }

    const to = locate(target)
    const allowed = ALLOWED[from.zone] ?? []

    if (!allowed.includes(to.zone)) {
      fail(`La dirección va al revés: ${from.zone} -> ${to.zone}`, `${shortPath}  ->  ${specifier}`)
      continue
    }

    if (to.zone === 'api' && from.zone === 'features' && ONLY_DATA_SEES_API && !from.inDataFolder) {
      fail('Sólo features/<x>/data/ puede importar de api/', `${shortPath}  ->  ${specifier}`)
      continue
    }

    if (from.zone === 'features' && to.zone === 'features' && from.feature !== to.feature) {
      fail(
        'Una funcionalidad importa de otra: se componen en app/',
        `${shortPath}  ->  ${specifier}`,
      )
      continue
    }

    if (to.zone === 'testing' && from.zone !== 'testing' && !/\.test\.tsx?$/.test(file)) {
      fail('Código que no es de prueba importa de testing/', `${shortPath}  ->  ${specifier}`)
    }
  }
}

/**
 * **Nada de estilos propios**: lo que se ve es de granito (principio IV).
 *
 * Estaba escrito como principio y aun así aparecieron `style={{...}}` en tres
 * archivos, porque un principio hay que acordárselo. Acá falla.
 *
 * Si hace falta una disposición que granito no tiene, **es una propuesta a
 * granito**, no una hoja de estilos de este lado — que es justamente lo que
 * mantiene a las cuatro aplicaciones parecidas entre sí.
 *
 * ## Dónde mira, y por qué son dos cosas
 *
 * **En `src/` y en lo que el paquete publica.** Mirar sólo `src/` protegía la
 * parte que se copia y dejaba libre la que dibuja en las cuatro aplicaciones a
 * la vez, que es al revés de lo que conviene.
 *
 * **Y una hoja de estilos es una falla por existir**, no por lo que diga. Un
 * `.css` propio no se puede revisar renglón por renglón: o lo que se ve sale de
 * granito, o no sale. Importar la hoja **de granito** no es esto.
 */
/**
 * **`src/` la tiene todo el mundo; `packages/` sólo la tiene cuarzo.**
 *
 * El paso 2 del ritual de clonar **borra `packages/`**, así que exigir esas dos
 * carpetas hacía fallar a toda aplicación nueva por no ser cuarzo — y lo hacía
 * en el paso 5, antes de que nadie escribiera una línea.
 *
 * La ausencia sigue siendo falla donde significa algo. Lo que cambia es qué
 * significa: **que falte `src/` es un `src/` renombrado**, y eso deja la regla
 * de estilos sin revisar a nadie. Que falten las de `packages/` con `packages/`
 * ahí también lo es. Que falten sin `packages/` es, simplemente, un clon.
 */
const STYLE_ROOTS = [
  ...apps.map((app) => `${app}/src`),
  'packages/core/src',
  'packages/session/src',
]

const PUBLICA = existsSync(join(ROOT, 'packages'))

let styled = 0

/* **Se acota la lista antes de recorrerla, y no se saltea adentro.** Adentro,
   la ausencia significa un renombre y tiene que fallar; acá se decide qué
   carpetas corresponde exigir en este repositorio. */
const ESTILOS = STYLE_ROOTS.filter((each) => PUBLICA || !each.startsWith('packages/'))

for (const relativeRoot of ESTILOS) {
  const root = join(ROOT, ...relativeRoot.split('/'))
  if (!existsSync(root)) {
    fail(`La carpeta declarada "${relativeRoot}" no existe`, '¿se renombró?')
    continue
  }

  for (const file of filesIn(root, /\.(ts|tsx)$/)) {
    styled++
    const shortPath = relative(ROOT, file).split(sep).join('/')
    for (const match of readFileSync(file, 'utf8').matchAll(/style=\{\{|className=|<style[\s>]/g)) {
      fail(
        'Estilo propio: lo que se ve es de granito (principio IV)',
        `${shortPath}  —  ${match[0]}`,
      )
    }
  }

  for (const sheet of filesIn(root, /\.(css|scss|sass|less)$/)) {
    fail(
      'Una hoja de estilos propia: lo que se ve es de granito (principio IV)',
      `${relative(ROOT, sheet).split(sep).join('/')}  —  si falta una disposición, es una propuesta a granito`,
    )
  }
}

/**
 * **Las capas del paquete van en una sola dirección** (`CU-40`).
 *
 * `ui` → `data` → `base`, y **nunca al revés**. Es la misma forma que la regla
 * de la aplicación, un nivel más adentro: lo que decide **qué pasó** no puede
 * conocer **cómo se ve**.
 *
 * La raíz de composición —`app`— queda afuera: es la única que conoce a todas,
 * y para eso existe.
 *
 * ## Por qué hacía falta
 *
 * Se escribió después de encontrar tres importaciones hacia arriba, y **las tres
 * las metió la misma clase de apuro**: la capa de abajo necesitaba mostrar algo
 * y llamó a la de arriba en vez de recibirlo. Ninguna rompía nada, y por eso
 * nadie las vio — es exactamente el caso donde una comprobación rinde.
 */
const PACKAGE_LAYERS = ['packages/core/src']

/** Qué puede mirar cada una. `app` no está: mira a todas. */
const BELOW = { base: [], data: ['base'], ui: ['base', 'data'] }

let layered = 0

/* **Un clon no tiene capas de paquete que revisar**, porque el paso 2 del
   ritual borra `packages/`. Se acota acá y no adentro del recorrido: adentro,
   la ausencia sigue significando un renombre y sigue fallando. */
const CAPAS = PUBLICA ? PACKAGE_LAYERS : []

for (const relativeRoot of CAPAS) {
  const root = join(ROOT, ...relativeRoot.split('/'))

  /* **No se saltea: falla.** Esta carpeta está declarada arriba, así que su
     ausencia significa que alguien la renombró — y saltearla dejaba la regla
     aprobando «0 importaciones» en verde. Es la segunda de las tres que cita
     `TAN-6` en su regla 4, y había vuelto en esta forma. */
  if (!existsSync(root)) {
    fail(`La capa declarada "${relativeRoot}" no existe (CU-40)`, '¿se renombró la carpeta?')
    continue
  }

  for (const file of filesIn(root)) {
    const shortPath = relative(ROOT, file).split(sep).join('/')
    const layer = shortPath.slice(relativeRoot.length + 1).split('/')[0]
    const allowed = BELOW[layer]
    if (!allowed) continue

    const code = readFileSync(file, 'utf8')
    for (const m of code.matchAll(/from '\.\.\/(\w+)\//g)) {
      layered++
      const target = m[1]
      if (BELOW[target] === undefined) continue
      if (allowed.includes(target)) continue

      fail(
        `La capa "${layer}" mira hacia "${target}" (CU-40)`,
        `${shortPath}  —  ui → data → base, y nunca al revés`,
      )
    }
  }
}

/**
 * **Una pantalla sólo la nombran dos archivos** (`CU-47`, `CU-44` enmendada).
 *
 * La declaración de su funcionalidad —que la registra— y el mapa de flujos de
 * la aplicación —que dice a dónde lleva cada desenlace—. **Nadie más**: una
 * pantalla que nombra su destino sirve en un solo recorrido, y eso no se nota
 * hasta que hace falta el segundo, con veinte pantallas ya escritas así.
 *
 * Es la mitad que quedó sin mecanizar de la deuda de las dos formas de
 * navegar: la regla estaba escrita y **nada la impedía**.
 *
 * Se puso **última a propósito**. Antes de que el catálogo navegara por
 * desenlaces, esto rompía el repositorio y había que apagarlo: exactamente cómo
 * una comprobación se vuelve opcional.
 */
const asPosix = (path) => path.split(sep).join('/')

/**
 * **Es pantalla lo que declara una pantalla**, no lo que vive en `screens/`.
 *
 * Mirando la carpeta, esto marcaba el diálogo de alta y los botones de fila —
 * que son piezas de la grilla, no destinos—. Una regla que marca de más se
 * apaga, así que la definición es la exacta: quien llama a `defineScreen`.
 */
function declaresScreen(path) {
  for (const candidate of [path, `${path}.tsx`, `${path}.ts`]) {
    /* sin sujeto: se prueban las tres formas del mismo archivo, así que saltear
       una no deja nada sin revisar — es la siguiente la que responde. */
    if (!/\.tsx?$/.test(candidate) || !existsSync(candidate)) continue
    return readFileSync(candidate, 'utf8').includes('defineScreen(')
  }
  return false
}

/** Los dos que sí pueden. */
const MAY_NAME_SCREENS = /\/features\/[^/]+\/feature[.]ts$|\/app\/flows[.]ts$/

/* **Se cuentan las pantallas revisadas, y el número se informa.** Sin él, esta
   regla aprueba igual con cero sujetos que con veinte, que es la forma en que ya
   se degradó en silencio tres veces (`TAN-6`, regla 4). */
let screensAsOrigin = 0

for (const file of allFiles) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  if (MAY_NAME_SCREENS.test(asPosix(file))) continue
  if (declaresScreen(file)) screensAsOrigin++

  /* **Una pantalla se revisa como origen, y es el caso que importa.**
     Eximir a las pantallas —tentador, porque toda pantalla nombra pantallas en
     su propia declaración— deja la regla revisando todo menos aquello para lo
     que se escribió: un `goTo(articlesScreen)` adentro de `article-screen.tsx`
     pasaría con el `ok` de esta línea impreso al lado. Es la deuda 2, que
     `CU-44` enmendada y `CU-47` dan por pagada. */
  for (const specifier of importsIn(readFileSync(file, 'utf8'))) {
    const target = resolve(dirname(file), specifier)
    if (!declaresScreen(target)) continue

    fail(
      'Nombra una pantalla, y sólo pueden feature.ts y app/flows.ts (CU-47)',
      `${shortPath}  →  ${specifier} · informá un desenlace, y que el flujo diga a dónde`,
    )
  }
}

/**
 * **En `src/`, una prueba vive al lado de lo que prueba** (`CU-15`).
 *
 * `articles.test.ts` necesita un `articles.ts` en la misma carpeta. Agarra las
 * dos formas de romperlo: **juntarlas en una carpeta aparte** —y ahí borrar una
 * funcionalidad se lleva la mitad—, y **dejar una prueba huérfana** cuando lo
 * que probaba se borró.
 *
 * Los paquetes hacen lo contrario a propósito —`packages/<x>/tests/`, separado,
 * porque lo que está en su `src/` se publica—, así que esto mira sólo `src/`.
 */
let colocated = 0

for (const file of allFiles) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const match = /^(.*)\.test(-d)?\.tsx?$/.exec(file)
  if (!match) continue

  colocated++
  const base = match[1]
  if (['.ts', '.tsx'].some((ext) => existsSync(`${base}${ext}`))) continue

  fail(
    'Una prueba sin lo que prueba al lado (CU-15)',
    `${shortPath}  —  va junto a su archivo, no en una carpeta aparte`,
  )
}

console.log('')
if (failures.length > 0) {
  for (const f of failures) {
    console.log(`  FALLA  ${f.what}`)
    console.log(`         ${f.where}`)
  }
  console.log('')
  console.log('LA DIRECCIÓN DE LAS DEPENDENCIAS NO SE RESPETA')
  console.log('')
  process.exit(1)
}

console.log(
  `  ok     ${allFiles.length} archivos en ${apps.length === 1 ? '1 aplicación' : `${apps.length} aplicaciones`}, ${checkedCount} importaciones internas`,
)
console.log('  ok     lib y components -> features -> app, y nunca al revés')
console.log('  ok     sólo features/<x>/data/ toca api/')
/* **Se dice dónde se miró, no sólo cuánto.** Un clon revisa una carpeta y
   cuarzo tres; con el mismo texto, el informe del clon parecería cubrir lo que
   no cubre — y eso es cómo se lee un «ok» que no corresponde. */
console.log(
  `  ok     ${styled} archivos sin un estilo propio ni una hoja, en ${PUBLICA ? 'las aplicaciones y en lo que el paquete publica' : 'las aplicaciones — este repositorio no publica paquetes'}`,
)
console.log(
  `  ok     ${screensAsOrigin} pantallas revisadas: sólo feature.ts y app/flows.ts las nombran`,
)
console.log(
  `  ok     ${colocated === 1 ? '1 prueba' : `${colocated} pruebas`} de las aplicaciones, al lado de lo que prueba`,
)
if (PUBLICA) {
  console.log(`  ok     ${layered} importaciones del paquete: ui -> data -> base, y nunca al revés`)
} else {
  /* **Se dice que no se revisó, en vez de callarlo.** Un «ok» sobre cero
     importaciones dice lo mismo que uno sobre cincuenta, y ahí es donde se
     aprende a no leerlos (`TAN-6`, regla 4). */
  console.log('  --     sin packages/: la dirección de las capas del paquete no se revisó acá')
}
console.log('')
console.log('LOS LÍMITES SE RESPETAN')
console.log('')
