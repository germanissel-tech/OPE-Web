/**
 * **El ritual de clonar, hecho de verdad** (`CU-20`, `CU-21`).
 *
 * Es la única prueba que verifica lo que cuarzo existe para hacer: que empezar
 * una aplicación de Tandilia sea **clonar y arrancar**. Todo lo demás puede
 * estar en verde y esto fallar — y si esto falla, lo demás no importa.
 *
 * Hace los cinco pasos de `specs/002-el-esqueleto/quickstart.md`, **con
 * `npm pack` en lugar del registro**: los paquetes salen empaquetados como
 * saldrían publicados, no enlazados desde la carpeta de al lado. La diferencia
 * no es cosmética: enlazados, `files` y `exports` no se ejercitan, que es
 * exactamente donde se esconden los errores de empaquetado.
 *
 * **Si el ritual cambia y esto no, esto falla.** Ésa es la idea.
 *
 * ## Y es la herramienta, no sólo la prueba
 *
 * Con `--en <ruta>` **crea la aplicación de verdad** en esa carpeta, en vez de
 * en un taller temporal que se borra. Son el mismo camino a propósito: una
 * herramienta que cree aplicaciones por un lado y una prueba que verifique el
 * ritual por otro **se despegan el día que alguien toca una sola**, y el
 * síntoma aparece en el repositorio de otro.
 *
 * ```
 * npm run clon                          la prueba: taller temporal, y se borra
 * npm run nueva-aplicacion -- --en ../las-animas/admin
 * ```
 *
 * ## Por qué tarda, y por qué igual está en `npm test`
 *
 * Instala un árbol de dependencias entero. Estuvo afuera de `npm test` por eso,
 * y el resultado fue que **se rompió y nadie se enteró durante días**: las
 * comprobaciones dejaron de pasar en un clon, y eso sólo se ve corriendo esto.
 * Una garantía que existe y no se corre no es una garantía. Va al final, que es
 * donde va lo que tarda.
 */

import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Lo que no se copia: se reinstala, se regenera, o no es del clon.
 *
 * **Los tres documentos del final no son «de cuarzo» por casualidad: hablan de
 * cuarzo.** `CLAUDE.md` dice cómo se trabaja en cuarzo, `README.md` empieza con
 * «# Cuarzo» y `PEDIDOS.md` son 14 pedidos que la aplicación nueva no recibió.
 * Copiados, la aplicación arranca con 1727 renglones que afirman ser otro
 * repositorio — y el `CLAUDE.md` con prioridad, porque un agente lo carga solo.
 *
 * **Es peor que no tener nada**: no es un hueco que se note, es información
 * equivocada con autoridad. En su lugar se generan los mínimos, abajo.
 *
 * **Y `catalogo.json` es el mismo caso, agravado** (`TAN-8`). No es prosa que
 * alguien lea mal: es el artefacto federado que **otro repositorio consulta con
 * máquina**, y empieza declarando `"repositorio": "cuarzo"`. Viajando, la
 * aplicación nueva publica como propias las 48 decisiones de cuarzo y sus 14
 * pedidos — y quien componga el índice de la familia le va a creer.
 *
 * No se genera uno en su lugar: emitirlo es de cada repositorio, y con qué
 * contenido lo decide el suyo cuando tenga documentación propia.
 */
const NOT_COPIED = new Set([
  'node_modules',
  'dist',
  '.git',
  'packages',
  'specs',
  'docs',
  'CLAUDE.md',
  'README.md',
  'PEDIDOS.md',
  'catalogo.json',
])

/**
 * **Archivos sueltos que tampoco viajan**, nombrados por su ruta entera.
 *
 * `NOT_COPIED` mira el primer tramo, que sirve para carpetas y para lo que está
 * en la raíz. Esto es para lo que vive **adentro** de una carpeta que sí viaja.
 *
 * Los cuatro son de cuarzo y no de una aplicación: el emisor del catálogo lee
 * `docs/`, que el clon no tiene; el ritual de clonar adentro de un clon no tiene
 * sujeto; y el informe de avance lee las casillas de `specs/`, que tampoco
 * viaja.
 *
 * **Que estuvieran ahí no era inofensivo**: `catalogo.mjs` importa de
 * `packages/`, y un guion que se copia sin lo que importa es un
 * `ERR_MODULE_NOT_FOUND` esperando a que alguien lo corra.
 */
const NOT_COPIED_PATHS = new Set([
  'tests/catalogo.mjs',
  'tests/catalogo.test.mjs',
  'tests/clone.mjs',
  'tests/progress.mjs',
])

const say = (what) => console.log(`  ${what}`)
const fail = (what, detail) => {
  console.log('')
  console.log(`  FALLA  ${what}`)
  if (detail) console.log(`         ${detail}`)
  console.log('')
  console.log('EL RITUAL DE CLONAR NO SE CUMPLE')
  console.log('')
  process.exit(1)
}

function run(command, args, where, options = {}) {
  const result = spawnSync(command, args, {
    cwd: where,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options,
  })
  return { ok: result.status === 0, out: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

/** Todo lo que hay adentro de una carpeta, en cualquier nivel. */
function filesUnder(dir) {
  /* sin sujeto: una carpeta que no existe no tiene archivos que dejar sin
     revisar. Quien llama sí informa cuántos miró. */
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...filesUnder(path))
    else out.push(path)
  }
  return out
}

/** npm quiere barras hacia adelante también en Windows. */
const asDependency = (path) => `file:${path.split('\\').join('/')}`

console.log('')

/* ── Lo que hace falta para poder probarlo ──────────────────────────────── */

const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

/**
 * **Granito llega por ruta hermana, y esa ruta se rompe al mover el clon.**
 *
 * Publicado saldría del registro; acá se resuelve a ruta absoluta. Si el
 * vecino no está, **no se finge que pasó**: se dice que no se pudo verificar,
 * que es la misma disciplina que la comprobación de decisiones.
 */
const siblings = Object.entries(manifest.dependencies ?? {}).filter(([, where]) =>
  where.startsWith('file:'),
)

for (const [name, where] of siblings) {
  const resolved = join(ROOT, where.slice('file:'.length))
  if (!existsSync(resolved)) {
    console.log(`  --     no encontré ${name} en ${where}: el ritual no se verificó`)
    console.log('')
    process.exit(0)
  }
}

/* ── Paso 0 · Empaquetar como se publicaría ─────────────────────────────── */

/**
 * **Dónde se crea la aplicación**, y de ahí sale si esto es prueba o herramienta.
 *
 * Sin `--en`, un taller temporal que se borra al terminar: eso es la prueba.
 * Con `--en`, la carpeta que se pidió, y no se borra nada: eso es crearla.
 */
const pedido = process.argv.indexOf('--en')
const destino = pedido !== -1 ? process.argv[pedido + 1] : undefined

if (pedido !== -1 && !destino) {
  fail('--en necesita una ruta', 'npm run nueva-aplicacion -- --en ../las-animas/admin')
}

/* El taller existe siempre: los `.tgz` van a algún lado, y ése se borra en los
   dos modos. Lo que cambia es si la aplicación se crea adentro o afuera. */
const workshop = mkdtempSync(join(tmpdir(), 'cuarzo-clon-'))
const clone = destino === undefined ? join(workshop, 'aplicacion') : resolve(destino)

/**
 * **El nombre sale de la ruta, que es la regla escrita** (`00-proyectos.md`):
 * el slug es la ruta local con guiones, y por eso la traducción es mecánica en
 * las dos direcciones. `tandilia/las-animas/admin` da `las-animas-admin`.
 *
 * Fuera de la familia no hay regla que aplicar, y se usa el nombre de la
 * carpeta: inventarle un slug a algo que no está en el mapa sería adivinar.
 */
const FAMILIA = resolve(ROOT, '..')
const desdeLaFamilia = relative(FAMILIA, clone)
const nombre =
  desdeLaFamilia && !desdeLaFamilia.startsWith('..')
    ? desdeLaFamilia.split(sep).join('-')
    : basename(clone)

if (destino !== undefined) {
  if (existsSync(join(clone, 'package.json'))) {
    fail(`${clone} ya tiene un package.json`, 'esto crea una aplicación, no la reemplaza')
  }
  console.log('')
  console.log(`  creando "${nombre}" en ${clone}`)
}

try {
  const built = run('npm', ['run', 'build:paquetes'], ROOT)
  if (!built.ok) fail('los paquetes no compilan', built.out.trim().split('\n').at(-1))

  const packed = {}
  for (const name of ['@cuarzo/core', '@cuarzo/session']) {
    const result = run('npm', ['pack', '-w', name, '--pack-destination', workshop], ROOT)
    if (!result.ok) fail(`no pude empaquetar ${name}`, result.out.trim().split('\n').at(-1))

    /* El nombre del `.tgz` se busca en la carpeta y no se parsea de la salida:
       `prepack` imprime lo suyo antes, y `--json` deja de ser JSON. */
    const [, short] = name.split('/')
    const tarball = readdirSync(workshop).find(
      (each) => each.includes(short) && each.endsWith('.tgz'),
    )
    if (!tarball) fail(`empaqueté ${name} y no encuentro su .tgz`, workshop)
    packed[name] = join(workshop, tarball)
  }
  say(`ok     los dos paquetes empaquetados como se publicarían`)

  /* ── Pasos 1 y 2 · Copiar, y borrar packages/ y specs/ ────────────────── */

  cpSync(ROOT, clone, {
    recursive: true,
    filter: (from) => {
      const relative = from.slice(ROOT.length + 1)
      if (relative === '') return true
      const path = relative.split('\\').join('/')
      return !NOT_COPIED.has(path.split('/')[0]) && !NOT_COPIED_PATHS.has(path)
    },
  })
  /**
   * **Y dejar el puntero de la especificación sin apuntar a nada** (`CU-20`).
   *
   * Copiado tal cual, el clon arranca señalando una carpeta de cuarzo que allá
   * no existe — que es la versión sutil de lo que `CU-20` prohíbe: *«la
   * aplicación nueva arrancaría con la spec de otro»*. La decisión lo decía
   * desde el principio y **nada lo verificaba**; se descubrió al escribir esto.
   */
  writeFileSync(join(clone, '.specify', 'feature.json'), '{}\n')

  /**
   * **Los propios, en el lugar de los heredados.**
   *
   * Cortos a propósito: son el punto de partida de quien llega, no su manual.
   * Lo que dicen es dónde está lo que hereda y qué tiene que decidir — porque
   * un documento que intenta contarlo todo se desactualiza, y uno que apunta
   * bien no.
   */
  writeFileSync(
    join(clone, 'CLAUDE.md'),
    [
      '# CLAUDE.md',
      '',
      `Cómo se trabaja en \`${nombre}\`. **Leerlo entero antes de tocar nada.**`,
      '',
      '## Lo primero, porque es lo que no se deshace',
      '',
      '**Antes de crear o modificar cualquier archivo, describir en el chat qué se va a escribir y',
      'esperar el OK.** Ante la duda, escuchar y preguntar.',
      '',
      '## Qué es esto',
      '',
      `**\`${nombre}\` es una aplicación de Tandilia**, creada con el ritual de cuarzo. Es la primera capa que sabe`,
      'de negocio: **lo que no sea negocio ya está decidido más abajo**, y se cita en vez de re-decidirse.',
      '',
      '```',
      'granito   ← cómo se ve y cómo se opera.  NO sabe de Tandilia.',
      '   ↓',
      'cuarzo    ← cómo se arma una aplicación.  NO sabe de negocio.',
      '   ↓',
      `${nombre}   ← acá: las pantallas, su backend y sus reglas.`,
      '```',
      '',
      '## El ciclo de trabajo',
      '',
      'Se construye con **SDD**: la especificación es la fuente, no el código. Las skills están en',
      '`.claude/skills/` y las plantillas en `.specify/templates/`.',
      '',
      '| | | |',
      '|---|---|---|',
      '| 1 | `/speckit-specify` | qué resuelve, qué **no** hace, y de qué decisiones depende |',
      '| 2 | `/speckit-clarify` | **no es opcional**: es preguntar lo ambiguo, con herramienta |',
      '| 3 | `/speckit-plan` | cómo, y qué garantía lo sostiene |',
      '| 4 | `/speckit-tasks` | las tareas, en orden |',
      '| 5 | `/speckit-implement` | recién acá se escribe código |',
      '| 6 | **revisar** | **contexto limpio**, y **no lo hace quien escribió** |',
      '',
      '**El sexto no es opcional.** Quien implementó tiene adentro la narrativa de por qué cada elección',
      'pareció razonable, y eso deja pasar exactamente lo que una revisión existe para agarrar.',
      '',
      '**Una especificación que depende de una decisión abierta no se planifica.** Se pregunta. Rellenar',
      'una entrada abierta con lo que parece razonable es elegir por otro.',
      '',
      '## Cómo se construye una pantalla',
      '',
      '**Cinco reglas que el ejemplo no dice**, y que se olvidan siempre. Van en el orden en que se pisan:',
      '',
      '1. **Si el permiso no habilita la acción, el botón no se muestra** — ni gris, ni nada (`CU-3`). Se',
      '   usa `ActionButton`, que devuelve `null` solo. **No** se calcula `disabled` desde capacidades.',
      '2. **La grilla no ordena ni pagina sola**: le pide al servidor. El lugar va a la URL con',
      '   `useTableQuery`, nunca a `useState`.',
      '3. **El vacío se parte en dos**, porque las salidas son distintas: no hay nada todavía → crear; el',
      '   filtro no da → limpiarlo (`CU-24`). El compilador obliga a declarar los dos y a decir cuál.',
      '4. **El error lleva el identificador del pedido**, que sale de `meta` (`CU-4`). Es lo único que',
      '   convierte «no anda» en algo diagnosticable.',
      '5. **Se ramifica por `error.code`, nunca por `error.message`** (`CU-14`). El mensaje es castellano',
      '   para una persona y cambia sin aviso.',
      '',
      '**La 3 no compila si se olvida, y la 5 la agarra `npm test`.** Las otras tres dependen de haberlas',
      'leído — releerlas antes de dar una pantalla por terminada es la parte barata.',
      '',
      '## Cuando algo está mal, primero se tría',
      '',
      '**Tres cosas se confunden con deuda técnica y ninguna lo es.** Meter un defecto en la lista de deuda',
      'es cómo un defecto no se arregla nunca.',
      '',
      '| | qué es | qué se hace |',
      '|---|---|---|',
      '| **Un defecto** | La aplicación se comporta mal | **Tarea del tramo en curso.** No cierra sin eso, y va con la comprobación que lo habría agarrado |',
      '| **Un incumplimiento** | El código contradice una decisión tomada | **Se resuelve, no se agenda.** O se arregla el código o se enmienda la decisión — y **enmendar no lo decide un agente** |',
      '| **Una garantía declarada que no existe** | Una decisión dice «lo verifica X» y X no lo verifica | **Lo más urgente.** Quien la lee construye creyendo que está protegido |',
      '| **Deuda** | Funciona, y restringe lo que viene | Se anota, ordenada por lo que rinde sobre lo que cuesta |',
      '',
      '**Y se paga agregando la garantía que faltaba**, no sólo reescribiendo. Sin algo que falle la',
      'próxima vez, vuelve en el próximo apuro — que es exactamente cómo llegó.',
      '',
      '## Qué cierra un tramo',
      '',
      '**Una casilla no lo cierra: lo cierra su punto de control**, que es la aplicación andando en un',
      'navegador de verdad. En cuarzo eso encontró dos defectos que ninguna prueba había visto.',
      '',
      '## Lo que se hereda, y no se re-decide',
      '',
      `Las decisiones de cuarzo llegan **adentro del paquete**: \`node_modules/${nombre}cuarzo/core/docs/\`. Las`,
      'visuales son de granito y tampoco se re-deciden.',
      '',
      '**Se citan por identificador, nunca por número pelado**: `CU-11` es de cuarzo, `GR-31` de granito,',
      '`TAN-n` de plataforma. Hay cuatro numeraciones y se pisan; `npm test` falla si una cita no resuelve.',
      '',
      '## Lo que no se hace, nunca',
      '',
      '- **Commitear o modificar otro repositorio.** Lo que haga falta de otro es un pedido.',
      '- **Parchear el esqueleto acá.** Si cuarzo incomoda, es un pedido a cuarzo: un parche local se',
      '  pierde, y las otras aplicaciones lo vuelven a sufrir.',
      '- **Estilos propios.** Todo lo visual sale de granito; si falta una disposición, es una propuesta.',
      '- **Rellenar una decisión abierta de otro repositorio** con lo que parezca razonable.',
      '',
      '## Cómo se pide trabajo a otro repositorio',
      '',
      'El sobre vive en la plataforma, nunca en el repositorio que lo recibe:',
      '`tandilia/pedidos/<receptor>/PED-n.json`. Se entrega la solicitud y **la plataforma la registra**; la',
      'respuesta vuelve igual, entregada y no escrita allá. **Rechazar es una respuesta válida**, y lleva su',
      'razón: sin ella lo mismo se vuelve a pedir en seis meses.',
      '',
      '## Cómo se corren las cosas',
      '',
      '```bash',
      'npm run dev       levanta la aplicación',
      'npm test          las comprobaciones que viajan en el paquete',
      'npm run revisar   Biome',
      'npm run build     compila con strict, y produce dist/',
      '```',
      '',
      `**Esto lo generó el ritual de clonar, y es un punto de partida.** Lo propio de \`${nombre}\` —su dominio, sus`,
      'pantallas, sus reglas— se escribe acá y reemplaza a esto.',
      '',
    ].join('\n'),
  )

  writeFileSync(
    join(clone, 'README.md'),
    [
      `# ${nombre}`,
      '',
      'Una aplicación de Tandilia, creada con el ritual de cuarzo.',
      '',
      'Cómo se trabaja acá está en [`CLAUDE.md`](CLAUDE.md).',
      '',
    ].join('\n'),
  )

  /**
   * **El estado es de quien lo vive, y el de cuarzo no le sirve a nadie más.**
   *
   * `.specify/memory/estado.md` viaja adentro de `.specify/`, así que no alcanza
   * con no copiarlo: se sobrescribe. Son 288 renglones del estado de cuarzo
   * —sus tramos, «Granito quedó listo para publicar», las credenciales
   * vencidas— que una aplicación nueva heredaría como propios.
   *
   * **Y el ritual los exigía**: la comprobación de abajo verificaba que
   * `estado.md` viajara. La garantía estaba puesta al revés — aseguraba que
   * llegara el documento equivocado.
   *
   * Va vacío y con sus tres secciones, que es lo que ese archivo es: dónde está
   * cada cosa, qué sigue, y qué está roto en el entorno. Un archivo con las
   * preguntas puestas se llena; uno en blanco se ignora.
   */
  writeFileSync(
    join(clone, '.specify', 'memory', 'estado.md'),
    [
      `# Estado de ${nombre}`,
      '',
      'Lo que hay que saber al empezar una sesión, y que no se deduce del código.',
      '',
      '## Dónde está cada cosa',
      '',
      '<!-- Qué hay hoy, y en qué archivo. Se escribe cuando hay algo. -->',
      '',
      '## Lo que sigue, en orden',
      '',
      '<!-- Y por qué en ese orden, que es la parte que se pierde. -->',
      '',
      '## Qué está roto en el entorno',
      '',
      '<!-- Credenciales vencidas, servicios caídos, cosas que no se pueden probar acá.',
      '     Sin esto, cada sesión vuelve a descubrirlo. -->',
      '',
      `**Esto lo generó el ritual de clonar.** El estado de \`${nombre}\` lo escribe \`${nombre}\`: el`,
      'de cuarzo no viaja, porque no es de nadie más.',
      '',
    ].join('\n'),
  )

  /* Lo que no puede haber quedado. Se comprueba en vez de confiar en el filtro:
     una entrada mal escrita en `NOT_COPIED` no falla, copia de más. */
  for (const leftover of ['packages', 'specs', 'docs', 'PEDIDOS.md', 'catalogo.json']) {
    if (existsSync(join(clone, leftover)))
      fail(`${leftover} viajó al clon`, 'es de cuarzo, no de la aplicación nueva')
  }

  /**
   * **Y que lo que quedó no diga ser cuarzo.**
   *
   * El filtro y la generación son dos pasos, y alcanzaba con equivocarse en uno
   * para que la aplicación arrancara con documentos de otro repositorio. Que no
   * estén los de cuarzo no prueba que estén los propios.
   */
  /* Cada uno con la marca que delata al de cuarzo: una frase que sólo puede
     estar ahí si el documento es el suyo y no el generado. */
  const PROPIOS = [
    ['CLAUDE.md', /^#\s+Cuarzo$|Cómo se trabaja en este repositorio/m],
    ['README.md', /^#\s+Cuarzo$/m],
    [join('.specify', 'memory', 'estado.md'), /Qué hay en cuarzo hoy/],
  ]

  for (const [propio, deCuarzo] of PROPIOS) {
    if (!existsSync(join(clone, propio))) {
      fail(`el clon se quedó sin ${propio}`, 'no viajó el de cuarzo, y tampoco se generó el propio')
    }
    const text = readFileSync(join(clone, propio), 'utf8')
    if (!text.includes(nombre)) {
      fail(`${propio} del clon no se nombra a sí mismo`, `esperaba encontrar "${nombre}"`)
    }
    if (deCuarzo.test(text)) {
      fail(`${propio} del clon es el de cuarzo`, 'la aplicación nueva arrancaría creyendo ser otra')
    }
  }

  const pointer = JSON.parse(readFileSync(join(clone, '.specify', 'feature.json'), 'utf8'))
  if (pointer.feature_directory) {
    fail(
      'el clon apunta a una especificación de cuarzo',
      `.specify/feature.json → ${pointer.feature_directory} (CU-20)`,
    )
  }

  say('ok     sin packages/, specs/ ni docs/, y sin apuntar a la spec de otro')
  say('ok     CLAUDE.md, README.md y estado.md propios, y sin los pedidos de cuarzo')

  /**
   * **Lo que viaja, tiene que poder correr.**
   *
   * Ésta es la garantía que faltaba, y la que explica por qué el arreglo llegó a
   * un archivo y no a siete: `tests/mock.mjs` importaba `ROOT` de `packages/`,
   * dejaba al clon sin backend, se corrigió — y **nada verificó que los otros
   * seis tuvieran el mismo problema**. Lo encontró `las-animas/admin` cuando
   * `npm run tipos` murió con `ERR_MODULE_NOT_FOUND`, y con él se cayó `CU-37`:
   * sin `roles.ts` generado, la capacidad de cada operación habría que
   * escribirla a mano, que es la segunda fuente que esa decisión existe para
   * cerrar.
   *
   * Se mira la importación y no el resultado de correrlo: correr los seis lleva
   * minutos y depende de la red, y **lo que falla es siempre lo mismo** — un
   * guion que se copió sin lo que importa.
   */
  const rotos = []
  const guiones = filesUnder(join(clone, 'tests')).filter((file) => /\.mjs$/.test(file))
  for (const file of guiones) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(
      /(?:^|\n)\s*import[^'"\n]*from\s*['"](\.\.\/packages\/[^'"]+)['"]/g,
    )) {
      rotos.push(`${relative(clone, file).split(sep).join('/')} → ${match[1]}`)
    }
  }

  if (rotos.length > 0) {
    fail(
      `${rotos.length} guiones del clon importan de packages/, que el paso 2 borra`,
      `${rotos[0]} — calculá la raíz desde el propio archivo, como tests/raiz.mjs`,
    )
  }
  /* **El conteo va en el renglón, y el conjunto vacío falla.** Sin las dos
     cosas, un filtro de copia que dejara `tests/` afuera aprobaría esta
     comprobación sobre cero archivos — que es exactamente la forma de «aprobar
     sin sujeto» que la regla 4 prohíbe, y encima con el renglón en verde. */
  if (guiones.length === 0) {
    fail(
      'El clon no tiene ningún guion en tests/',
      'la copia dejó tests/ afuera, o el filtro se llevó de más',
    )
  }
  say(`ok     ${guiones.length} guiones del clon, y ninguno importa de packages/`)

  /* ── Paso 3 · Sacar los espacios de trabajo, y depender por nombre ────── */

  const cloned = JSON.parse(readFileSync(join(clone, 'package.json'), 'utf8'))
  delete cloned.workspaces

  /* **También el nombre.** Copiado tal cual, el manifiesto de la aplicación
     nueva dice `"name": "cuarzo"` — y ése es el que aparece en cada mensaje de
     npm y en cada traza. */
  cloned.name = nombre

  /**
   * **Dónde quedan apuntando los paquetes, y por qué cambia según el modo.**
   *
   * En la **prueba** apuntan a los `.tgz`: es lo único que ejercita `files` y
   * `exports` como saldrían publicados, que es donde se esconden los errores de
   * empaquetado. El taller se borra al terminar y no importa, porque la
   * aplicación de prueba se borra con él.
   *
   * Al **crear una aplicación de verdad** eso era un defecto: el manifiesto
   * quedaba apuntando a un directorio temporal que este mismo guion borra en su
   * `finally`. La aplicación nacía sin poder reinstalarse — y **no se notaba**,
   * porque `node_modules` ya tenía la copia. Lo encontró `las-animas/admin`
   * cuando el lock guardó una ruta que escapaba ocho niveles y llevaba adentro
   * el nombre de usuario de quien corrió el ritual.
   *
   * Así que apuntan a la carpeta hermana, que es lo que granito ya hace en este
   * mismo manifiesto. **Eso se pudo recién cuando los paquetes se dejaron
   * consumir enlazados**: hasta el commit `9c4098b`, `@cuarzo/core` nombraba
   * `vite` en sus tipos sin declararlo, y enlazado eso rompía la compilación con
   * dos identidades del mismo tipo.
   *
   * Y es provisorio dicho en voz alta: **el día que haya registro, las cuatro
   * `file:` pasan a ser versiones**. Está bloqueado por la decisión del ámbito
   * de npm, que es de plataforma.
   */
  cloned.dependencies = { ...cloned.dependencies }
  for (const [name, where] of siblings) {
    cloned.dependencies[name] = asDependency(join(ROOT, where.slice('file:'.length)))
  }
  for (const [name, tarball] of Object.entries(packed)) {
    cloned.dependencies[name] =
      destino === undefined
        ? asDependency(tarball)
        : asDependency(join(ROOT, 'packages', name.split('/')[1]))
  }

  /* Los scripts que necesitan los paquetes en el disco ya no aplican: llegan
     instalados. */
  /**
   * **Los guiones se declaran, no se heredan.**
   *
   * Se copiaban los trece de cuarzo y se corregían tres, y quedaban cuatro que
   * no podían andar: `dev` invocaba `build:paquetes`, que se borra doce líneas
   * más arriba; `clon` y `nueva-aplicacion` son el ritual de cuarzo adentro de
   * un clon; y `avance` lee las casillas de `specs/`, que no viaja.
   *
   * Que `dev` estuviera roto es lo peor de los cuatro: **es el primer comando
   * que el `CLAUDE.md` del clon documenta**, así que la primera aplicación lo
   * corrió, falló, y tuvo que descubrir sola que se levanta con `npx vite`.
   *
   * Declarar la lista en vez de corregir la heredada es lo que hace que el
   * próximo guion que se agregue acá **no** aparezca en el clon sin que nadie lo
   * haya decidido.
   */
  const HEREDA = ['revisar', 'simulado', 'simulado:contrato', 'tipos', 'iconos', 'vitest']

  cloned.scripts = {
    ...Object.fromEntries(
      HEREDA.filter((name) => cloned.scripts[name]).map((name) => [name, cloned.scripts[name]]),
    ),
    /* Sin `build:paquetes` adelante: llegan instalados. */
    dev: 'vite',
    build: 'tsc -b && vite build',
    test: 'cuarzo-check',
  }

  writeFileSync(join(clone, 'package.json'), `${JSON.stringify(cloned, null, 2)}\n`)
  rmSync(join(clone, 'package-lock.json'), { force: true })
  say('ok     sin espacios de trabajo, y los dos paquetes como dependencias')

  /* ── Paso 5 · Instalar y levantar ─────────────────────────────────────── */

  const installed = run('npm', ['install', '--no-audit', '--no-fund'], clone, { timeout: 300_000 })
  if (!installed.ok) fail('npm install no pasó en el clon', installed.out.trim().split('\n').at(-1))
  say('ok     instalado desde los paquetes, no desde la carpeta de al lado')

  /* ── Lo que tiene que haber viajado (`CU-20`) ─────────────────────────── */

  const travels = [
    ['CLAUDE.md', 'cómo se trabaja acá'],
    ['.specify/memory/constitution.md', 'los seis principios'],
    ['.specify/memory/estado.md', 'el estado propio, no el de cuarzo'],
    /* **El fin de línea, que si no se hereda se redescubre.** Sin esto, cada
       aplicación nueva encuentra por su cuenta que git le convierte LF a CRLF
       al traer, y lo arregla —o lo tapa— a su manera. Lo encontró el agente de
       `las-animas/admin` en su primer commit, con noventa archivos convertidos. */
    ['.gitattributes', 'el fin de línea, para que no se convierta al viajar'],
    ['.specify/templates/spec-template.md', 'la plantilla propia'],
    ['node_modules/@cuarzo/core/checks/cli.mjs', 'las comprobaciones, por paquete'],
    ['node_modules/@cuarzo/core/docs/arquitectura.md', 'las decisiones, por paquete'],
  ]

  for (const [what, why] of travels) {
    if (!existsSync(join(clone, what))) fail(`no viajó ${what}`, why)
  }
  say(`ok     ${travels.length} cosas viajaron: el método, y las decisiones adentro del paquete`)

  /* ── Que las comprobaciones corran ACÁ, y encuentren contra qué ───────── */

  const checked = run('npx', ['cuarzo-check'], clone)
  if (!checked.ok)
    fail('las comprobaciones no pasan en el clon', checked.out.trim().split('\n').at(-1))

  if (!/ok\s+las de cuarzo/.test(checked.out)) {
    fail(
      'el clon no puede verificar las citas que hereda',
      'las decisiones de cuarzo no llegaron con el paquete — deuda 1',
    )
  }
  say('ok     el clon verifica las citas a CU-n que hereda en src/')

  /**
   * **Que el simulado levante ACÁ, y conteste.**
   *
   * Compilar no alcanzaba, y se pagó: `tests/mock.mjs` importaba por ruta
   * relativa adentro de `packages/` —para conseguir `process.cwd()`—, así que
   * en el clon moría con `ERR_MODULE_NOT_FOUND` y **la aplicación nueva se
   * quedaba sin backend**. Todo lo demás estaba en verde.
   *
   * Lo encontró correr el quickstart a mano. Esto es para que la próxima vez no
   * haga falta.
   */
  /* Es un servidor: no termina solo. Se lo deja hablar unos segundos, se lo
     mata, y se lee lo que alcanzó a decir. */
  const served = run('node', ['tests/mock.mjs'], clone, {
    timeout: 8_000,
    /* En un puerto propio: con el simulado de desarrollo levantado, el 4010
       está tomado y esto fallaría por una razón que no es la que mide. Un falso
       negativo enseña a ignorar la comprobación igual que un falso verde. */
    env: { ...process.env, PORT: '41010' },
    /**
     * **Sin shell, y no es un detalle.**
     *
     * Con `shell: true` en Windows, el tiempo límite mata **el shell** y el
     * `node` de adentro queda vivo — tomando el puerto para siempre. La
     * comprobación se envenena a sí misma: pasa una vez y falla desde ahí con
     * `EADDRINUSE`, que además parece un defecto del clon y no de la prueba.
     */
    shell: false,
  })
  if (!/El simulado del ejemplo, en http/.test(served.out)) {
    /* La primera línea que dice algo, no la última: el final de una traza de
       Node es la versión de Node, que no explica nada. */
    const lines = served.out.trim().split('\n')
    const said = lines.find((line) => /error|Error|code:/.test(line)) ?? lines[0]
    fail('el simulado no levanta en el clon', said?.trim())
  }
  say('ok     el simulado levanta en el clon, sin packages/ al lado')

  /* ── Y que compile, que es lo único que prueba que arranca ────────────── */

  const compiled = run('npm', ['run', 'build'], clone, { timeout: 300_000 })
  if (!compiled.ok) fail('el clon no compila', compiled.out.trim().split('\n').at(-1))
  say('ok     el clon compila con strict, y produce su dist/')

  console.log('')
  if (destino === undefined) {
    console.log('EL CLON ARRANCA')
  } else {
    console.log(`"${nombre}" ESTÁ CREADA Y ARRANCA`)
    console.log('')
    console.log(`  ${clone}`)
    console.log('')
    console.log('  Falta lo que esto no puede hacer solo:')
    console.log(
      '    · git init, y el repositorio en Bitbucket — la API da 401, se crea por el navegador',
    )
    console.log('    · apuntar config.json al backend de esta aplicación')
    console.log('    · cuando tenga pantallas propias, borrar src/features/home y catalog')
  }
  console.log('')
} finally {
  /**
   * **Borrar el taller no puede tapar el resultado.**
   *
   * En Windows, el proceso del simulado que acabamos de matar conserva el
   * directorio tomado un instante, y `rmSync` tira `EBUSY`. Sin esto, una
   * prueba que pasó termina mostrando una traza de limpieza y **parece que
   * falló** — que es la peor forma de informar cualquier cosa.
   */
  try {
    rmSync(workshop, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 })
  } catch {
    console.log(`  --     no pude borrar ${workshop}; se limpia solo con el sistema`)
  }
}
