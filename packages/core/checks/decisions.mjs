import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Las decisiones son citables, y una cita tiene que resolver.
 *
 * ── Por qué existe esta prueba ───────────────────────────────
 *
 * Estos documentos los va a leer un agente para construir. El modo de falla no
 * es que se vean feos: es que **cite una decisión que no existe y complete lo
 * que cree que dice**.
 *
 * Dos numeraciones con la misma forma se pisan: un número pelado puede ser el
 * de cuarzo o el de granito —pasó con el 3, que existía en los dos, y con el 31,
 * que no existía acá—, así que buscarlo no daba nada y lo probable era
 * inventarlo. Por eso hoy toda cita lleva prefijo: CU-n es de cuarzo, GR-n de
 * granito.
 *
 * Y las abiertas eran letras: al cerrarse una cambiaba de identidad, y lo que
 * la citara quedaba apuntando al vacío. Hoy están en la misma serie y un
 * identificador no cambia nunca.
 *
 * ── Por qué no alcanza el índice ─────────────────────────────
 *
 * docs/decisiones.md es un documento, y un documento no asegura nada por sí
 * solo: se desincroniza el día que alguien agrega una decisión y se olvida de
 * la tabla. Lo que asegura es esto, que compara la tabla contra los documentos.
 */

import { config, ROOT } from './context.mjs'

/* El índice ubica cada decisión por el nombre corto del documento, que sale de
   su archivo: `docs/arquitectura.md` es «arquitectura». Así la configuración es
   una lista de rutas y no un mapa que haya que mantener a mano. */
const DOCS = Object.fromEntries(
  config.decisionDocs.map((path) => [path.split('/').pop().replace(/.md$/, ''), path]),
)
const INDEX = config.decisionIndex
const ESTADOS = new Set(['decidida', 'abierta'])

/* Lo que no es nuestro no se revisa: las skills de Spec Kit vienen en inglés y
   con su propia numeración. */
const SKIP = new Set([
  'node_modules',
  '.git',
  '.claude',
  'scripts',
  'integrations',
  'workflows',
  'dist',
])

const problemas = []
const fail = (title, detalle) => problemas.push({ title, detalle })

/* ── Las decisiones, leídas de los documentos ─────────────────────────── */

/**
 * Los documentos propios que **existen**.
 *
 * Se filtra en vez de leer y confiar: un repositorio sin decisiones propias es
 * normal —una aplicación construida con cuarzo no tiene las suyas— y hasta hoy
 * esto reventaba con un `ENOENT`. **Reventar es la peor forma de contestar «no
 * hay nada que revisar acá»**: no informa, y deja la impresión de que la
 * herramienta está rota.
 */
const OWN = Object.entries(DOCS).filter(([, path]) => existsSync(join(ROOT, path)))

const decisions = new Map()
for (const [name, path] of OWN) {
  const text = readFileSync(join(ROOT, path), 'utf8')

  /* Las propias son dos familias: las `CU-n` heredadas de cuarzo y las `OW-n`
     de OPE-Web. Las dos se declaran igual y se indexan en la misma tabla. */
  for (const m of text.matchAll(/^### ((?:CU|OW)-\d+) · (.+)$/gm)) {
    const [, id, title] = m
    if (decisions.has(id)) {
      fail('Identificador repetido', `    ${id} está en ${decisions.get(id).archivo} y en ${name}`)
      continue
    }
    /* La ficha va pegada al encabezado: si no está ahí, no se declaró. */
    const resto = text.slice(m.index + m[0].length)
    const ficha = resto.match(/^\s*\*\*Estado\*\*: (\S+)(?: · \*\*Depende de\*\*: (.+?))?\s*$/m)
    if (!ficha || resto.slice(0, ficha.index).trim() !== '') {
      fail('Decisión sin status', `    ${id} · ${title}  —  falta «**Estado**:» debajo del título`)
      continue
    }
    if (!ESTADOS.has(ficha[1])) {
      fail(
        'Estado desconocido',
        `    ${id} dice «${ficha[1]}» y sólo vale ${[...ESTADOS].join(' o ')}`,
      )
    }
    const dep = (ficha[2] ?? '').match(/(?:CU|OW)-\d+/g) ?? []
    decisions.set(id, { id, title, status: ficha[1], dep, archivo: name })
  }
}

/**
 * **Que no haya documentos no es lo mismo que no encontrar decisiones en ellos.**
 *
 * Lo segundo es un formato que cambió y hay que arreglar. Lo primero es una
 * aplicación construida con cuarzo, que no toma decisiones de plataforma y no
 * tiene por qué. Confundirlos hacía fallar a toda aplicación clonada.
 */
if (OWN.length > 0 && !decisions.size) {
  console.error('\n  Hay documentos y ninguna decisión adentro. ¿Cambió el formato?\n')
  process.exit(1)
}

/* ── Toda dependencia existe ──────────────────────────────────────────── */

for (const d of decisions.values())
  for (const id of d.dep)
    if (!decisions.has(id))
      fail('Dependencia inexistente', `    ${d.id} dependsOn de ${id}, que no existe`)

/* ── El índice dice lo mismo que los documentos ───────────────────────── */

/* Sin decisiones propias no hay índice que comparar, y exigirlo sería pedirle a
   una aplicación que indexe decisiones que no tomó. */
const hasIndex = OWN.length > 0 && existsSync(join(ROOT, INDEX))

const index = new Map()
if (hasIndex) {
  for (const m of readFileSync(join(ROOT, INDEX), 'utf8').matchAll(
    /^\| \*\*((?:CU|OW)-\d+)\*\* \| (\w+) \| (.+?) \| (\w+) \|/gm,
  )) {
    index.set(m[1], { status: m[2], title: m[3], archivo: m[4] })
  }
}

for (const d of hasIndex ? decisions.values() : []) {
  const f = index.get(d.id)
  if (!f) {
    fail('Falta en el índice', `    ${d.id} · ${d.title}`)
    continue
  }
  if (f.title !== d.title)
    fail(
      'El índice dice otro título',
      `    ${d.id}\n      índice:    ${f.title}\n      doc: ${d.title}`,
    )
  if (f.status !== d.status)
    fail('El índice dice otro status', `    ${d.id} · índice «${f.status}», doc «${d.status}»`)
  if (f.archivo !== d.archivo)
    fail('El índice la ubica mal', `    ${d.id} · índice «${f.archivo}», está en «${d.archivo}»`)
}
for (const id of index.keys())
  if (!decisions.has(id))
    fail('Sobra en el índice', `    ${id} está en la tabla y no en ningún doc`)

/* ── Toda cita resuelve ───────────────────────────────────────────────── */

/**
 * Qué se lee, y por qué el código también.
 *
 * **Miraba sólo markdown**, y en cuarzo hay **452 citas en comentarios de
 * código** contra 794 en documentos. O sea que la mayor parte de lo que
 * `CLAUDE.md` promete verificar —*«npm test falla si alguna no resuelve»*— no
 * se verificaba.
 *
 * Ahí una cita se pudre peor que en un documento: **ningún compilador lee un
 * comentario**, así que un `CU-31` que quedó apuntando a otra cosa desinforma a
 * quien lo lee y no falla nunca. Es textualmente lo que este repositorio le
 * reprochó a granito en `granito#PED-2`, teniéndolo adentro.
 *
 * `dist` queda afuera: es la misma fuente compilada, y contaría cada cita dos
 * veces.
 */
const READ = ['.md', '.ts', '.tsx', '.mjs', '.js', '.json', '.yaml', '.css']

const walk = (dir) => {
  const out = []
  for (const entrada of readdirSync(dir)) {
    if (SKIP.has(entrada)) continue
    const path = join(dir, entrada)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (READ.some((ext) => entrada.endsWith(ext))) out.push(path)
  }
  return out
}

/**
 * **Las familias de decisiones que se pueden citar, y dónde vive cada una.**
 *
 * Eran tres bloques casi iguales con una diferencia que importaba: las de
 * granito y las de plataforma **se saltean** si su documento no está, y las de
 * cuarzo no — fallaban como «cita a algo que no existe». Y eso no es lo mismo:
 * **que falte el documento no significa que la decisión no exista**.
 *
 * Se ve recién desde afuera. Corriendo acá, los tres documentos están; una
 * aplicación clonada hereda `src/` con citas a `CU-n` y **no tiene el documento
 * de cuarzo**, así que cada cita heredada fallaba. La comprobación acusaba al
 * código de citar algo inventado cuando el problema era suyo.
 *
 * ## Dónde se busca cada una
 *
 * **Candidatas en orden, y gana la primera que exista.** Así el mismo paquete
 * anda en cuarzo —donde los hermanos están al lado— y en una aplicación —donde
 * llegan por `node_modules`— sin configurar nada.
 *
 * Y se puede declarar en el `package.json` del que las corre, porque un
 * vecindario distinto es exactamente lo que esto no puede adivinar.
 */
const FAMILIES = [
  {
    prefix: 'CU',
    label: 'cuarzo',
    /* Las propias van primero: en cuarzo, `decisionDocs` **son** las CU. */
    candidates: config.cuarzoDocs ?? [
      ...config.decisionDocs,
      'node_modules/@ope/core/docs/arquitectura.md',
      'node_modules/@ope/core/docs/seguridad.md',
      '../cuarzo/docs/arquitectura.md',
    ],
    read: (text) => [...text.matchAll(/^### (CU-\d+) · /gm)].map((m) => m[1]),
  },
  {
    prefix: 'GR',
    label: 'granito',
    candidates: config.granitoDocs ?? [
      '../granito/docs/identidad-visual.md',
      'node_modules/@granito/ui/docs/identidad-visual.md',
    ],
    /**
     * **Las dos formas, porque el documento es de otro repositorio.**
     *
     * granito escribía el número pelado —`### 42 ·`— y pasó a escribirlo con su
     * prefijo —`### GR-42 ·`— al empezar a verificar sus propias citas. Leer una
     * sola forma hacía que **111 citas dejaran de resolver de un día para el
     * otro**, por un cambio que del otro lado era una mejora.
     *
     * No se les pide que elijan: lo que se lee es de ellos, y acomodarse es de
     * este lado.
     */
    read: (text) => [...text.matchAll(/^### (?:GR-)?(\d+) · /gm)].map((m) => `GR-${m[1]}`),
  },
  {
    prefix: 'TAN',
    label: 'plataforma',
    candidates: config.platformDocs ?? ['../docs/decisiones.md', '../../docs/decisiones.md'],
    read: (text) => [...text.matchAll(/^### (TAN-\d+) · /gm)].map((m) => m[1]),
  },
  {
    prefix: 'OW',
    label: 'OPE-Web',
    /* Las de OPE-Web viven en `docs/ope.md`, que es uno de los `decisionDocs`
       propios: así una cita `OW-n` se verifica igual que una `CU-n`. */
    candidates: config.opeDocs ?? ['docs/ope.md', 'node_modules/@ope/core/docs/ope.md'],
    read: (text) => [...text.matchAll(/^### (OW-\d+) · /gm)].map((m) => m[1]),
  },
]

/** Lo que cada familia declara, o `null` si no se encontró dónde mirar. */
const known = FAMILIES.map((family) => {
  const found = family.candidates
    .map((relativePath) => join(ROOT, ...relativePath.split('/')))
    .filter((path) => existsSync(path))

  if (found.length === 0) return { ...family, ids: null }

  const ids = new Set(found.flatMap((path) => family.read(readFileSync(path, 'utf8'))))
  return { ...family, ids }
})

let citations = 0
for (const path of walk(ROOT)) {
  const text = readFileSync(path, 'utf8')
  const where = relative(ROOT, path).split(String.fromCharCode(92)).join('/')

  for (const family of known) {
    /* **Sin documento no se juzga**: que falte no significa que la decisión no
       exista, y acusar al código de citar algo inventado sería mentirle a quien
       lo lee. Que no se verificó se informa abajo. */
    if (!family.ids) continue

    for (const m of text.matchAll(new RegExp(`\\b${family.prefix}-\\d+\\b`, 'g'))) {
      citations++
      if (!family.ids.has(m[0])) {
        fail(`Cita a una decisión de ${family.label} que no existe`, `    ${where}  →  ${m[0]}`)
      }
    }
  }

  /* La ambigüedad que originó todo esto: un número pelado no dice de qué repo es. */
  for (const m of text.matchAll(/decisi[oó]n(?:es)? (\d+)/gi))
    fail('Cita sin prefijo', `    ${where}  →  «${m[0]}»  ·  ¿CU-${m[1]} o GR-${m[1]}?`)

  /* Las abiertas fueron letras hasta que entraron a la serie. Una cita a una
     letra hoy no apunta a nada, y no la agarra la comprobación de arriba. */
  for (const m of text.matchAll(/decisi[oó]n(?:es)? ([A-Z])(?![A-Za-z0-9-])/g))
    fail(
      'Cita a una letra, que ya no se usa',
      `    ${where}  →  «${m[0]}»  ·  las openCount hoy son CU-n`,
    )
}

/* ── El informe ───────────────────────────────────────────────────────── */

if (problemas.length) {
  const porTitulo = new Map()
  for (const p of problemas) {
    if (!porTitulo.has(p.title)) porTitulo.set(p.title, [])
    porTitulo.get(p.title).push(p.detalle)
  }
  for (const [title, detalles] of porTitulo) {
    console.error(`\n  ${title}:`)
    for (const d of detalles) console.error(d)
  }
  console.error(`\n  LAS DECISIONES NO CIERRAN  ·  ${problemas.length} problema(s)\n`)
  process.exit(1)
}

const decidedCount = [...decisions.values()].filter((d) => d.status === 'decidida').length
if (decisions.size > 0) {
  console.log(
    `  ok     ${decisions.size} decisiones · ${decidedCount} decididas, ${decisions.size - decidedCount} abiertas`,
  )
}
console.log(
  hasIndex
    ? `  ok     el índice coincide con los ${OWN.length} documentos`
    : '  --     este repositorio no declara decisiones propias: no hay índice que comparar',
)
console.log(`  ok     ${citations} citas, y las ${citations} resuelven`)
/* Lo propio se cuenta aparte: `known` incluye a la familia de este repositorio,
   y decir dos veces «las de cuarzo» arriba de un repositorio que ES cuarzo se
   lee raro. */
for (const family of known.filter((each) => each.prefix !== 'CU' || decisions.size === 0)) {
  console.log(
    family.ids
      ? `  ok     las de ${family.label}, contra sus ${family.ids.size} decisiones`
      : `  --     no encontré las de ${family.label}: sus citas no se verificaron`,
  )
}

console.log('\nLAS DECISIONES CIERRAN')
