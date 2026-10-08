/**
 * **Lo que un paquete promete publicar, existe y está versionado** (`CU-40`).
 *
 * Un `package.json` nombra rutas en tres lugares —`exports`, `files` y `bin`—,
 * y ninguno de los tres lo verifica nadie: npm no falla por prometer un archivo
 * que no está, y el compilador no lee esos campos.
 *
 * ## Por qué existe
 *
 * `.gitignore` tenía una línea `build/` —puesta para salida de compilación— y
 * se comió `packages/core/build/` entero, que es **fuente**: el mecanismo de
 * versión de `CU-35`. Los tres archivos existían en el disco de quien los
 * escribió y en ningún otro lado.
 *
 * Lo que producía es lo peor de esta familia de fallas: **acá andaba todo**.
 * `npm run dev`, `npm test` y `npm run build` pasaban, porque los archivos
 * estaban. Recién se rompía en la copia de otro —`vite.config.ts` empieza
 * importando `@ope/core/build`—, o sea **lejos de la causa y en la máquina
 * equivocada**.
 *
 * Por eso mira las dos cosas y no una: que el archivo **esté**, y que git lo
 * **siga**. La primera sola habría dado verde el día que pasó.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { ROOT } from './context.mjs'

const PACKAGES = join(ROOT, 'packages')

/** Todo lo que hay adentro, en cualquier nivel. */
function filesInside(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...filesInside(path))
    else out.push(path)
  }
  return out
}

if (!existsSync(PACKAGES)) {
  console.log('')
  console.log('  --     no hay packages/: este repositorio no publica nada')
  console.log('')
  process.exit(0)
}

/**
 * Las rutas que un `package.json` nombra, vengan de donde vengan.
 *
 * `exports` anida —condiciones adentro de subrutas— así que se recorre entero
 * y se toma toda cadena que empiece con `./`. `files` y `bin` son planos.
 */
function pathsNamedIn(manifest) {
  const found = []

  const walk = (value) => {
    if (typeof value === 'string') {
      if (value.startsWith('./')) found.push(value.slice(2))
      return
    }
    if (value && typeof value === 'object') for (const each of Object.values(value)) walk(each)
  }

  walk(manifest.exports)
  walk(manifest.bin)
  for (const entry of manifest.files ?? []) found.push(entry)

  return [...new Set(found)]
}

/**
 * Qué sigue git, preguntado **una vez**.
 *
 * `git ls-files` sobre todo `packages/` sale más barato que una llamada por
 * ruta, y de paso da la respuesta para directorios: una carpeta está seguida si
 * git tiene **algo** adentro.
 */
const tracked = spawnSync('git', ['ls-files', 'packages'], { cwd: ROOT, encoding: 'utf8' })

if (tracked.status !== 0) {
  console.log('')
  console.log('  --     no hay git acá: no puedo verificar que lo publicable esté versionado')
  console.log('')
  process.exit(0)
}

const files = new Set(tracked.stdout.split('\n').filter(Boolean))

/** `true` si git sigue ese archivo, o algo adentro de esa carpeta. */
function isTracked(relativePath) {
  if (files.has(relativePath)) return true
  const asDirectory = `${relativePath}/`
  for (const each of files) if (each.startsWith(asDirectory)) return true
  return false
}

const failures = []
let checked = 0
/** Rutas de una salida que todavía no se construyó: no se miraron. */
let pending = 0
/** Rutas generadas que existen y que git no sigue, como corresponde. */
let untracked = 0

/**
 * **Lo que npm no perdona, verificado antes y no después.**
 *
 * Publicar es la única operación de este repositorio sin marcha atrás: una
 * versión publicada **no se puede reemplazar**, nunca, y despublicar sólo se
 * puede dentro de las 72 horas. Pasado ese plazo queda `npm deprecate`, que
 * agrega un aviso y no borra nada.
 *
 * O sea que un manifiesto incompleto no se arregla: se convive con él. Y hasta
 * hoy **nada lo miraba** — esta comprobación verificaba que las rutas
 * existieran, que es una parte, y daba verde con `0.0.0` y sin licencia.
 *
 * Las cuatro son la misma clase de falla, y por eso están juntas: **algo que
 * queda mal para siempre y que nadie mira hasta que ya salió**.
 */
const identity = []
/** Paquetes que no se publican: no tienen que declarar nada de esto. */
let privados = 0
/** Paquetes publicables a los que sí se les revisó la identidad. */
let publicables = 0

/**
 * **Lo que un paquete nombra en sus tipos publicados, lo declara.**
 *
 * `packages/core/build/index.d.mts` decía `import type { Plugin } from 'vite'`
 * y `vite` no estaba en `peerDependencies`. Instalado desde un `.tgz` no se
 * nota: el paquete vive bajo el `node_modules` de la aplicación y resuelve su
 * único vite. **Enlazado por carpeta** —que es como se consume un paquete
 * hermano mientras no hay registro— TypeScript resuelve desde la ruta real y
 * toma el vite de cuarzo: dos instalaciones de la misma versión, dos
 * identidades de tipo, y `TS2321` comparando `UserConfig` contra sí mismo.
 *
 * Lo encontró `las-animas/admin`, la primera aplicación, y **le costó no poder
 * compilar**. Acá andaba todo.
 *
 * Se miran los tipos y no el código: son los que el compilador de quien
 * instala va a resolver, y por eso son los que tienen que cerrar solos.
 */
const undeclared = []
let tipados = 0

/** De `react/jsx-runtime` sale `react`; de `@granito/ui/x`, `@granito/ui`. */
const packageOf = (specifier) => {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

const IMPORTA = /(?:^|\n)\s*(?:import|export)\s[^'"\n]*?from\s*['"]([^'"]+)['"]/g

const REQUISITOS = [
  [
    (manifest) => typeof manifest.license === 'string' && manifest.license.length > 0,
    'no declara `license`',
    'sin licencia, npm publica con «UNLICENSED» implícito y nadie sabe con qué derechos lo instaló',
  ],
  [
    (manifest) => manifest.repository !== undefined,
    'no declara `repository`',
    'quien lo instale no tiene cómo llegar a la fuente, ni para leerla ni para informar un defecto',
  ],
  [
    (manifest) => manifest.version !== '0.0.0',
    'sigue en la versión `0.0.0`',
    'es el número que pone npm al crear el manifiesto: publicarlo quema el 0.0.0 de ese nombre para siempre',
  ],
  [
    (manifest) =>
      Object.values(manifest.peerDependencies ?? {}).every((range) => range.trim() !== '*'),
    'declara un peer en `*`',
    'acepta cualquier versión futura, incluida la que rompa — y en una familia que se publica junta eso entra solo en las cuatro aplicaciones',
  ],
]

for (const name of readdirSync(PACKAGES)) {
  const manifestPath = join(PACKAGES, name, 'package.json')
  /* sin sujeto: una carpeta sin `package.json` no es un paquete, así que no hay
     nada publicable que revisar. Cuántos sí se revisaron se informa abajo. */
  if (!existsSync(manifestPath)) continue

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  /* **La exención es «no se publica», declarada por el propio paquete.** No se
     adivina por el nombre ni por la carpeta: `private` es lo único que npm
     mismo respeta, así que es lo único que puede eximir acá. */
  if (manifest.private === true) {
    privados++
  } else {
    publicables++
    for (const [cumple, que, porque] of REQUISITOS) {
      if (!cumple(manifest)) identity.push([`${manifest.name} ${que}`, porque])
    }
  }

  /* **Los tipos se revisan en todos, privados incluidos.** Un workspace que una
     aplicación consume enlazado tiene exactamente el problema de abajo: sus
     tipos resuelven desde la ruta real, y lo que nombren sin declarar lo
     resuelve otro. */
  {
    const declarados = new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
      ...Object.keys(manifest.optionalDependencies ?? {}),
    ])

    for (const tipos of pathsNamedIn(manifest).flatMap((named) => {
      const onDisk = join(PACKAGES, name, ...named.split('/'))
      /* sin sujeto: una ruta que no está en el disco no deja tipos sin revisar,
         porque ya la contó el recorrido de arriba — o falla ahí por faltar, o
         es una salida sin construir y se informa como pendiente. */
      if (!existsSync(onDisk)) return []
      return statSync(onDisk).isDirectory()
        ? filesInside(onDisk).filter((each) => /\.d\.[cm]?ts$/.test(each))
        : /\.d\.[cm]?ts$/.test(onDisk)
          ? [onDisk]
          : []
    })) {
      tipados++
      const text = readFileSync(tipos, 'utf8')
      for (const match of text.matchAll(IMPORTA)) {
        const specifier = match[1]
        /* Relativo o de Node: no es una dependencia que alguien tenga que
           instalar, así que no hay nada que declarar. */
        if (specifier.startsWith('.') || specifier.startsWith('node:')) continue

        const paquete = packageOf(specifier)
        if (declarados.has(paquete)) continue

        undeclared.push([
          `${manifest.name} nombra "${paquete}" en sus tipos y no lo declara`,
          `${relative(ROOT, tipos).split(sep).join('/')} — quien lo instale enlazado va a resolver otro`,
        ])
      }
    }
  }

  /**
   * Lo que el paquete **declara que genera**, y por eso puede no estar.
   *
   * Se declara en el `package.json` y no se adivina acá: una comprobación que
   * conoce los nombres de la salida ajena perdona de más el día que aparece un
   * tercero, y lo perdona **en silencio**.
   */
  const generated = manifest.ope?.generated ?? []

  /** De qué carpeta generada sale esa ruta, si sale de alguna. */
  const outputOf = (named) =>
    generated.find((each) => named === each || named.startsWith(`${each}/`))

  /**
   * **La exención es «todavía no se construyó», no «es generado para siempre».**
   *
   * Con la exención permanente, **el `exports` entero de los dos paquetes queda
   * sin verificar**: todas sus rutas apuntan a `dist/`. Una entrada que nombra
   * un archivo que el compilador no emite pasa en verde, y eso se descubre
   * recién en la copia de otro — que es justamente lo que `CU-40` viene a
   * impedir.
   *
   * Acotada a la carpeta que no está, la exención dura lo que dura no haber
   * compilado. `npm test` construye los paquetes antes de correr esto, así que
   * ahí el `exports` **sí** se verifica.
   */
  const notBuilt = (named) => {
    const output = outputOf(named)
    return output !== undefined && !existsSync(join(PACKAGES, name, ...output.split('/')))
  }

  for (const named of pathsNamedIn(manifest)) {
    const onDisk = join(PACKAGES, name, ...named.split('/'))

    /* sin sujeto: la salida todavía no está construida, así que no hay ruta que
       mirar. Se cuenta aparte y se informa: un número que las incluyera diría
       haber revisado más de lo que revisó. */
    if (notBuilt(named)) {
      pending++
      continue
    }

    checked++

    if (!existsSync(onDisk)) {
      failures.push([`${manifest.name} nombra "${named}" y no está en el disco`, manifestPath])
      continue
    }

    if (!isTracked(`packages/${name}/${named}`)) {
      /* **Lo generado no lo sigue git, y está bien**: se reconstruye. Esta
         exención sí es permanente, y por eso se cuenta y se dice. */
      if (outputOf(named) !== undefined) {
        untracked++
        continue
      }

      failures.push([
        `${manifest.name} publica "${named}" y git no lo sigue`,
        'está en el disco de quien lo escribió y en ningún otro lado — mirá .gitignore',
      ])
    }
  }
}

console.log('')

if (failures.length > 0 || identity.length > 0 || undeclared.length > 0) {
  for (const [what, where] of [...failures, ...identity, ...undeclared]) {
    console.log(`  FALLA  ${what}`)
    console.log(`         ${where}`)
  }
  console.log('')
  console.log('LO QUE SE PUBLICA NO SE PUEDE DESPUBLICAR')
  console.log('')
  process.exit(1)
}

console.log(
  `  ok     ${checked} rutas publicables existen · ${untracked} son salida compilada, y a ésas git no las sigue`,
)

/**
 * **Se dice cuántos se revisaron, y se falla si no fue ninguno** (`TAN-6`,
 * regla 4). Una comprobación que informa «ok» sin decir sobre qué enseña a no
 * leer sus aprobados: con todo marcado `private`, ésta aprobaría sin haber
 * mirado un solo manifiesto.
 */
if (publicables + privados === 0) {
  console.log(
    '  FALLA  no hay ningún paquete en packages/, y esta comprobación existe para revisarlos',
  )
  console.log('         si dejaron de existir, sacala; si no, algo se movió de lugar')
  console.log('')
  process.exit(1)
}

if (publicables > 0) {
  const cuantos =
    publicables === 1
      ? '1 paquete publicable declara'
      : `${publicables} paquetes publicables declaran`

  console.log(`  ok     ${cuantos} licencia, repositorio, versión y peers acotados`)
}

/* **Cuántos archivos de tipos se leyeron, y no sólo que no hubo fallas.** Con
   los paquetes sin compilar no hay ninguno, y un «ok» sobre cero archivos se
   lee igual que uno sobre veinte (`TAN-6`, regla 4). */
if (tipados > 0) {
  console.log(`  ok     ${tipados} archivos de tipos publicados, y no nombran nada sin declarar`)
} else {
  console.log(
    '  --     sin tipos compilados: no se revisó qué nombran (corré npm run build:paquetes)',
  )
}

if (privados > 0) {
  const otros =
    privados === 1 ? '1 es `private`: no se publica' : `${privados} son \`private\`: no se publican`
  console.log(`  --     ${otros}, así que no declara nada de eso`)
}

if (pending > 0) {
  console.log(
    `  --     ${pending} rutas de una salida sin construir: no se verificaron (corré npm run build:paquetes antes)`,
  )
}
console.log('')
