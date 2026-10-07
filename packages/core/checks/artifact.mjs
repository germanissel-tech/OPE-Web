/**
 * Verifica que **la implementación falsa de la sesión no esté en el artefacto
 * de producción** (CU-36).
 *
 * La razón está escrita en la decisión: si la falsa se pudiera encender desde
 * `config.json`, **el archivo de configuración sería una puerta trasera de
 * autenticación** — quien pueda editarlo entra sin credenciales. Así que no
 * entra en el artefacto: no hay bandera que la encienda porque no hay qué
 * encender.
 *
 * Esto **verifica el resultado, no la intención**. Se descartó confiar en que
 * el sacudido de árbol la saque: eso es una propiedad de la configuración del
 * empaquetador, y una configuración cambia sin que nadie lo note.
 *
 * Es la misma disciplina con la que granito verifica que su paquete cumple lo
 * que promete.
 *
 * **Qué significa un «ok», con precisión**: que la falsa **no se despachó**, no
 * que no exista en el código. Si estuviera importada pero el sacudido de árbol
 * la sacara, esto pasa — y está bien, porque lo que no viaja no es una puerta
 * trasera. Pero conviene decirlo: un «ok» acá no autoriza a importarla desde
 * cualquier lado y confiar en que el empaquetador la saque.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { ROOT } from './context.mjs'

const DIST = join(ROOT, 'dist')

/**
 * La marca que la falsa exporta. Es una constante y no un nombre de función
 * para que **sobreviva a la minificación**: un nombre se renombra, una cadena
 * de texto no.
 */
export const FAKE_SESSION_MARKER = 'CUARZO_FAKE_SESSION_NOT_FOR_PRODUCTION'

if (!existsSync(DIST)) {
  console.log('')
  console.log('  --     no hay dist/ todavía: la falsa no se verificó')
  console.log('         (corré npm run build antes, o esperá al tramo 2)')
  console.log('')
  process.exit(0)
}

function filesIn(dir, pattern) {
  const out = []
  for (const name of readdirSync(dir)) {
    /* `dist/` y `node_modules/` quedan afuera al buscar fuentes: lo compilado
       lleva `.d.ts`, y contarlo como código haría que el artefacto se viera
       viejo cada vez que se compila — un aviso que aparece siempre no informa
       nada. Sobre `dist/` mismo no aplica: ahí se entra por su propia raíz. */
    if (dir !== DIST && (name === 'dist' || name === 'node_modules')) continue

    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...filesIn(path, pattern))
    else if (pattern.test(name)) out.push(path)
  }
  return out
}

const shortPath = (a) => relative(ROOT, a).split(sep).join('/')

/**
 * **Qué tan viejo es lo que se está juzgando.**
 *
 * `npm test` no reconstruye `dist/`: mira el que haya en el disco, de cuando
 * sea. Así, un verde acá puede estar hablando de una compilación de la semana
 * pasada mientras la fuga que se busca ya está en el código de hoy — y el
 * verde no distingue las dos situaciones.
 *
 * No se falla, porque no compilar es legítimo. Se **dice**, que es lo que
 * distingue un aprobado de un silencio.
 */
function newest(dir, pattern) {
  let last = 0
  for (const file of filesIn(dir, pattern)) {
    const at = statSync(file).mtimeMs
    if (at > last) last = at
  }
  return last
}

const SOURCES = [join(ROOT, 'src'), join(ROOT, 'packages')]
const sourcesAt = Math.max(...SOURCES.filter(existsSync).map((d) => newest(d, /\.(ts|tsx)$/)), 0)
const distAt = newest(DIST, /\.(js|mjs|cjs|html|css)$/)
const hasMarker = (a) => readFileSync(a, 'utf8').includes(FAKE_SESSION_MARKER)

if (distAt > 0 && sourcesAt > distAt) {
  console.log('')
  console.log(
    '  --     dist/ es más viejo que el código: la falsa se verificó contra otra compilación',
  )
  console.log('         (corré npm run build para que este ok hable de lo de ahora)')
}

/** Lo que se ejecuta. Acá una marca es la falsa corriendo, y es una falla. */
const executables = filesIn(DIST, /\.(js|mjs|cjs)$/)
const offenders = executables.filter(hasMarker)

/**
 * Los mapas de fuente **no se ejecutan**, así que una marca ahí no es una
 * puerta trasera. Pero **se informa igual, en vez de ignorarse en silencio**:
 * un mapa desplegado lleva el código original adentro, y decir «el artefacto
 * está limpio» mientras la falsa viaja en el mapa es la clase de «ok» que
 * enseña a no leer los «ok».
 *
 * Que los mapas se desplieguen o no **todavía no está decidido**. Mientras no
 * lo esté, esto lo deja a la vista.
 */
const maps = filesIn(DIST, /\.map$/)
const mapsWithMarker = maps.filter(hasMarker)

console.log('')
if (offenders.length > 0) {
  for (const c of offenders) {
    console.log('  FALLA  la implementación falsa está en el artefacto')
    console.log(`         ${shortPath(c)}`)
  }
  console.log('')
  console.log('LA FALSA NO PUEDE IR A PRODUCCIÓN')
  console.log('')
  process.exit(1)
}

console.log(`  ok     ${executables.length} archivos ejecutables de dist/, sin rastro de la falsa`)
for (const m of mapsWithMarker) {
  console.log(`  aviso  su código sí está en el mapa de fuente: ${shortPath(m)}`)
}
console.log('')
console.log('EL ARTEFACTO ESTÁ LIMPIO')
console.log('')
