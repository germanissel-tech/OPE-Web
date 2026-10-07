/**
 * **El catálogo de lo que cuarzo declara**, emitido de su propia prosa (`TAN-8`).
 *
 * `TAN-8` decidió que entre repositorios **no viaja el formato de un documento**:
 * viaja un artefacto generado. La razón se descubrió rompiéndose — cuarzo leía
 * los encabezados de granito buscando `### 42 ·`, granito pasó a escribir
 * `### GR-42 ·`, y **111 citas dejaron de resolver de un día para el otro**.
 *
 * Así que la prosa sigue siendo la fuente para las personas, y esto emite lo que
 * la plataforma compone.
 *
 * ## Emite, o verifica que lo emitido esté al día
 *
 * Con `--verificar` no escribe: compara y falla. Es la misma pieza que ya
 * sostiene los roles y las restricciones del contrato (`tests/emit.mjs`), y por
 * la misma razón: **un catálogo que se escribe a mano es una segunda lista**, y
 * una segunda lista miente el día que alguien toca sólo una.
 *
 * ## Lo que NO hace, y es deliberado
 *
 * **No deduce dependencias de las citas.** Un documento que nombra a `CU-15` no
 * depende de `CU-15`: lo menciona. Sólo se emite lo que una entidad **declara**,
 * y la cobertura de cada clase de relación se declara con ella.
 *
 * **No inventa identificadores.** La deuda y los principios no tienen identidad
 * estable, y eso se dice en el artefacto en vez de taparse con un número
 * generado — que es lo que haría creer a quien lo consuma que puede citarlos.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { config, ROOT } from '../packages/core/checks/context.mjs'
import { emit } from './emit.mjs'

const SALIDA = join(ROOT, 'catalogo.json')

const leer = (ruta) => readFileSync(join(ROOT, ...ruta.split('/')), 'utf8').replaceAll('\r\n', '\n')
const hay = (ruta) => existsSync(join(ROOT, ...ruta.split('/')))

/**
 * **Cómo se traduce cada estado local al eje común**, declarado y no adivinado.
 *
 * `TAN-8` pide que el estado local viaje **y** su correspondencia, sin convertir
 * una palabra local en estándar por proximidad. Un `aceptado` de un pedido no es
 * lo mismo que un `decidida` de una decisión aunque las dos suenen a avance.
 */
const VOCABULARIO = {
  decision: { decidida: 'decidida', abierta: 'abierta' },
  /* `necesita-informacion` sale del protocolo que plataforma está escribiendo en
     `docs/pedidos.md`. Se traduce desde ahora aunque todavía no aparezca: un
     estado sin traducción se emite como `desconocida` y falla, y eso pasaría el
     día que alguien lo use, no hoy. */
  pedido: {
    abierto: 'abierta',
    aceptado: 'abierta',
    'necesita-informacion': 'abierta',
    hecho: 'decidida',
    rechazado: 'decidida',
  },
  especificacion: { borrador: 'abierta', implementada: 'decidida' },
}

/**
 * Las clases de relación, con **cuánto cubren de verdad**.
 *
 * `parcial` no es una excusa: es el dato. Nueve de las 48 decisiones no declaran
 * de qué dependen, así que quien componga el índice tiene que saber que la
 * ausencia de una arista **no significa que no exista**.
 */
const CLASES = {
  dependencia: { cobertura: 'parcial', tipos: { 'depende-de': 'directa' } },
  origen: { cobertura: 'parcial', tipos: { 'sale-de': 'directa' } },
  bloqueo: { cobertura: 'completa', tipos: { bloquea: 'directa' } },
}

/** De qué repositorio es cada prefijo. Lo fija el `CLAUDE.md` de plataforma. */
const DE_QUIEN = { CU: 'cuarzo', TAN: 'plataforma', GR: 'granito' }

const entidades = []

/**
 * **Cuántos candidatos tenía cada fuente, contados aparte de lo que se leyó.**
 *
 * Es lo único que distingue «no hay más» de «cambió la forma y no lo entendí».
 * Sin esto, renombrar un encabezado hace desaparecer una entidad **en silencio**
 * y el catálogo sale con una menos, tan verde como antes. Es el mismo agujero
 * que tenía la lista de pedidos, encontrado de la misma manera: mutándolo.
 */
const candidatos = []
const cuenta = (fuente, texto, patron) =>
  candidatos.push({ fuente, cuantos: [...texto.matchAll(patron)].length })

/* ── Decisiones ─────────────────────────────────────────────────────────── */

/**
 * Salen de los documentos que el repositorio declara, no de una lista de acá:
 * `decisionDocs` ya existe y ya lo usan las otras comprobaciones.
 */
for (const documento of config.decisionDocs) {
  if (!hay(documento)) continue

  const texto = leer(documento)
  cuenta(documento, texto, /^### CU-\d+ · /gm)

  for (const m of texto.matchAll(/^### (CU-\d+) · (.+)\n\n\*\*Estado\*\*: (\w+)(.*)$/gm)) {
    const [, id, titulo, estadoLocal, resto] = m

    /**
     * **También las de otros repositorios.**
     *
     * `CU-19` depende de `TAN-1`, de plataforma. Buscando sólo `CU-n` esa arista
     * se caía **en silencio** — y es justo la clase de arista para la que el
     * índice federado existe. Cada prefijo dice de quién es la decisión, que es
     * la identidad que `TAN-8` fija: repositorio más identificador local.
     */
    const declaradas = resto.match(/\*\*Depende de\*\*: (.+)$/)?.[1] ?? ''
    const dependencias = [...declaradas.matchAll(/(CU|TAN|GR)-\d+/g)]

    entidades.push({
      tipo: 'decision',
      id,
      titulo: titulo.trim(),
      estado_local: estadoLocal,
      estado: VOCABULARIO.decision[estadoLocal] ?? 'desconocida',
      relaciones: dependencias.map((d) => ({
        clase: 'dependencia',
        tipo: 'depende-de',
        hacia: { repositorio: DE_QUIEN[d[1]], id: d[0] },
      })),
      fuente: { repositorio: 'cuarzo', documento, id },
    })
  }
}

/* ── Pedidos ────────────────────────────────────────────────────────────── */

if (hay('PEDIDOS.md')) {
  const texto = leer('PEDIDOS.md')
  cuenta('PEDIDOS.md', texto, /^### PED-\d+ · /gm)

  for (const m of texto.matchAll(
    /^### (PED-\d+) · (.+)\n\n\*\*Estado\*\*: \*{0,2}(\w+)\*{0,2} · \*\*Pide\*\*: ([^·\n]+?) ·(.*)$/gm,
  )) {
    const [, id, titulo, estadoLocal, pide, resto] = m
    const bloquea = resto.match(/\*\*Bloquea\*\*: (.+?)(?: ·|$)/)?.[1]?.trim()

    entidades.push({
      tipo: 'pedido',
      origen: 'legado',
      id,
      titulo: titulo.trim(),
      estado_local: estadoLocal,
      estado: VOCABULARIO.pedido[estadoLocal] ?? 'desconocida',
      /* Quién pide es de otro repositorio, y por eso viaja como texto: no se
         inventa una clave federada para algo que no se puede resolver desde
         acá. */
      pide: pide.trim(),
      relaciones:
        bloquea && bloquea !== 'no'
          ? [{ clase: 'bloqueo', tipo: 'bloquea', hacia: { texto: bloquea } }]
          : [],
      fuente: { repositorio: 'cuarzo', documento: 'PEDIDOS.md', id },
    })
  }
}

/* ── Deuda ──────────────────────────────────────────────────────────────── */

/**
 * **Sin identidad estable, y se dice.**
 *
 * `docs/deuda.md` declara de sí mismo que sus números son posicionales y que
 * **pagar una corre a todas las de abajo** — lo descubrió cuando siete lugares
 * apuntaban a «la entrada 2» y desde ese día apuntaban a otra. Su propia regla
 * es «se cita por lo que dice».
 *
 * Así que se emite el orden **marcado como inestable** y el título, que es la
 * identidad que el repositorio se dio. Reescribir un título la rompe igual, y
 * eso también se dice.
 */
if (hay('docs/deuda.md')) {
  const texto = leer('docs/deuda.md')
  const activas = texto.split('\n## Lo que se pagó')[0] ?? texto
  cuenta('docs/deuda.md', activas, /^### .+$/gm)

  for (const m of activas.matchAll(/^### (\d+) · (.+)$/gm)) {
    entidades.push({
      tipo: 'deuda',
      identidad: 'inestable',
      orden: Number(m[1]),
      titulo: m[2].trim(),
      estado_local: 'activa',
      estado: 'abierta',
      relaciones: [],
      fuente: { repositorio: 'cuarzo', documento: 'docs/deuda.md', titulo: m[2].trim() },
    })
  }
}

/* ── Especificaciones ───────────────────────────────────────────────────── */

/**
 * **La entidad es la carpeta**, y su fuente es `spec.md`.
 *
 * `plan.md`, `tasks.md`, `research.md` y `contracts/` son **partes de ella**, no
 * tipos nuevos: que una de las tres no tenga `tasks.md` describe hasta dónde
 * llegó, no otra clase de cosa.
 */
if (hay('specs')) {
  for (const carpeta of readdirSync(join(ROOT, 'specs'))) {
    const spec = `specs/${carpeta}/spec.md`
    if (!hay(spec)) continue

    const cabecera = leer(spec).slice(0, 600)
    const titulo = cabecera.match(/^# Especificación · (.+)$/m)?.[1]?.trim() ?? carpeta
    const estadoLocal = cabecera.match(/\*\*Estado\*\*: (\w+)/)?.[1] ?? 'desconocido'
    const pedido = cabecera.match(/\*\*Pedido\*\*: `([^`]+)`/)?.[1]

    entidades.push({
      tipo: 'especificacion',
      id: carpeta,
      titulo,
      estado_local: estadoLocal,
      estado: VOCABULARIO.especificacion[estadoLocal] ?? 'desconocida',
      partes: readdirSync(join(ROOT, 'specs', carpeta)),
      relaciones: pedido ? [{ clase: 'origen', tipo: 'sale-de', hacia: { texto: pedido } }] : [],
      fuente: { repositorio: 'cuarzo', documento: spec, id: carpeta },
    })
  }
}

/* ── Principios ─────────────────────────────────────────────────────────── */

/**
 * **Se citan por número, y el número es posicional.**
 *
 * `principio IV` aparece en cinco archivos de código y siete veces en las
 * decisiones, así que el romano **es** un identificador en uso. Y corre el mismo
 * riesgo que la deuda: agregar uno en el medio movería a los de abajo, y todo lo
 * que los nombra quedaría apuntando a otra cosa.
 *
 * La diferencia con la deuda es que **la deuda lo tiene prohibido y esto no**.
 * Se emite con la estabilidad declarada para que quien consuma lo sepa, y va
 * como pregunta a plataforma en vez de resolverse acá.
 */
const CONSTITUCION = '.specify/memory/constitution.md'

if (hay(CONSTITUCION)) {
  const texto = leer(CONSTITUCION)
  cuenta(CONSTITUCION, texto, /^### [IVX]+ · /gm)

  for (const m of texto.matchAll(/^### ([IVX]+) · (.+)$/gm)) {
    entidades.push({
      tipo: 'principio',
      id: `principio-${m[1]}`,
      identidad: 'en-uso-posicional',
      titulo: m[2].trim(),
      estado_local: 'vigente',
      estado: 'decidida',
      relaciones: [],
      fuente: { repositorio: 'cuarzo', documento: CONSTITUCION, id: `principio-${m[1]}` },
    })
  }
}

/* ── Lo que el artefacto declara de sí mismo ────────────────────────────── */

const catalogo = {
  repositorio: 'cuarzo',
  emitido_por: 'tests/catalogo.mjs',
  esquema: 'sin publicar: TAN-8 deja abierto el esquema de plataforma',

  /**
   * **Qué identidad tiene cada tipo, dicho antes de que alguien la use.**
   *
   * Es la respuesta a lo que `PED-14` preguntó, y va en el artefacto y no sólo
   * en la contestación: quien lo consuma no lee el pedido.
   */
  /**
   * **Qué de esto es fuente vigente y qué es historia**, dicho para quien
   * componga el índice.
   *
   * Los pedidos de acá son anteriores al protocolo central. Si un `PED-n` de
   * cuarzo tiene sobre en `tandilia/pedidos/cuarzo/`, **ése gana y éste se
   * descarta**: son el mismo pedido, no dos. La regla se declara acá porque
   * este emisor no puede mirar el otro lado sin volver a acoplarse a él.
   */
  vigencia: {
    pedido: {
      origen: 'legado',
      fuente_vigente: 'tandilia/pedidos/cuarzo/PED-n.json',
      al_componer: 'si existe el sobre central con el mismo id, prevalece el central',
      espera_nuevos: false,
    },
  },

  /**
   * **Cómo se nombra una entidad de acá desde afuera**, dicho y no deducido.
   *
   * Que `fuente.repositorio` y `id` estén los dos no alcanza: quien compone
   * tendría que inventar cómo se juntan, y dos composiciones distintas darían
   * dos claves para la misma cosa.
   */
  identidad_federada: 'repositorio#id',

  identidad: {
    decision: { forma: 'CU-n', estable: true },
    pedido: { forma: 'PED-n', estable: true },
    especificacion: { forma: 'NNN-nombre', estable: true },
    deuda: {
      forma: 'ninguna',
      estable: false,
      porque: 'el orden es posicional y se corre al pagar',
    },
    principio: {
      forma: 'principio-N',
      estable: false,
      porque: 'se cita por número en el código, y el número es posicional',
    },
  },

  clases_de_relacion: CLASES,
  vocabulario_local: VOCABULARIO,
  entidades,
}

/* ── Lo que no puede pasar, y falla ─────────────────────────────────────── */

const problemas = []

const conId = entidades.filter((e) => e.id !== undefined)
const repetidos = conId.filter((e, i) => conId.findIndex((o) => o.id === e.id) !== i)
for (const e of repetidos) problemas.push(`La identidad "${e.id}" está dos veces.`)

const conocidos = new Set(conId.map((e) => e.id))
for (const e of entidades) {
  for (const r of e.relaciones) {
    /* **Sólo se exige que resuelvan las locales.** Una arista a `TAN-1` no se
       puede verificar desde acá — eso es precisamente lo que el índice federado
       viene a resolver— y fallar por no poder verificarla sería pedirle a este
       repositorio que conozca el de al lado. */
    if (r.hacia.repositorio === 'cuarzo' && !conocidos.has(r.hacia.id)) {
      problemas.push(`${e.id ?? e.titulo} declara "${r.tipo}" hacia "${r.hacia.id}", que no está.`)
    }
  }
  if (e.estado === 'desconocida') {
    problemas.push(
      `${e.id ?? e.titulo} tiene el estado local "${e.estado_local}", que no se traduce.`,
    )
  }
}

/* Un tipo que deja de encontrarse es una fuente que cambió de forma, y emitir
   el catálogo sin él sería decir que cuarzo no tiene decisiones. */
for (const tipo of ['decision', 'pedido', 'deuda', 'especificacion', 'principio']) {
  if (!entidades.some((e) => e.tipo === tipo))
    problemas.push(`No se encontró ninguna de tipo "${tipo}".`)
}

/* Y una que se leyó a medias es peor que una que no se leyó: sale un catálogo
   con menos, y nada dice que falta. */
const leidasDe = (fuente) => entidades.filter((e) => e.fuente.documento === fuente).length

for (const { fuente, cuantos } of candidatos) {
  const leidas = leidasDe(fuente)
  if (leidas !== cuantos) {
    problemas.push(
      `${fuente} tiene ${cuantos} encabezados y se leyeron ${leidas}: ¿cambió su forma?`,
    )
  }
}

if (problemas.length > 0) {
  console.log('')
  for (const p of problemas) console.log(`  FALLA  ${p}`)
  console.log('')
  process.exit(1)
}

const porTipo = (tipo) => entidades.filter((e) => e.tipo === tipo).length

emit(
  SALIDA,
  `${JSON.stringify(catalogo, null, 2)}\n`,
  `${entidades.length} entidades · ${porTipo('decision')} decisiones · ${porTipo('pedido')} pedidos` +
    ` · ${porTipo('deuda')} deudas · ${porTipo('especificacion')} especificaciones · ${porTipo('principio')} principios`,
  { fuente: 'la documentación', comando: 'npm run catalogo' },
)
