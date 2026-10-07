/**
 * Informa dónde está la implementación, leyendo las casillas de `tasks.md`.
 *
 * No hay ningún número escrito a mano acá ni allá: todo se deriva de las
 * casillas. Es la regla de TAN-4 —«no se escribe lo que un script puede
 * informar»— y existe porque un contador a mano se desactualiza en una sesión
 * y nadie lo corrige.
 *
 * Y una advertencia que el informe repite: **una casilla no cierra un tramo.**
 * Lo cierra su punto de control, que es lo único verificable.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/**
 * **Cuál es la especificación en curso, preguntada y no clavada.**
 *
 * Estaba escrita a mano —`specs/002-el-esqueleto`—, así que el día que se abrió
 * la 003 esto siguió informando la anterior **sin decir nada**. Un informe que
 * miente sobre cuál trabajo describe es peor que no tenerlo: el número se ve
 * bien y es de otra cosa.
 *
 * Spec Kit ya deja escrito cuál es la activa al crearla. Se lee de ahí, y la
 * última carpeta de `specs/` queda de respaldo para cuando ese archivo no está.
 */
function currentFeature() {
  const pointer = join(ROOT, '.specify', 'feature.json')
  if (existsSync(pointer)) {
    const declared = JSON.parse(readFileSync(pointer, 'utf8')).feature_directory
    if (declared && existsSync(join(ROOT, declared, 'tasks.md'))) return declared
  }

  const specs = join(ROOT, 'specs')
  if (!existsSync(specs)) {
    console.log('  --     no hay specs/: no hay avance que informar')
    return null
  }

  const withTasks = readdirSync(specs)
    .filter((name) => existsSync(join(specs, name, 'tasks.md')))
    .sort()

  return withTasks.length > 0 ? `specs/${withTasks.at(-1)}` : null
}

const FEATURE = currentFeature()

if (!FEATURE) {
  console.error('No encuentro ninguna especificación con tasks.md')
  process.exit(1)
}

const TASKS_FILE = join(ROOT, ...FEATURE.split('/'), 'tasks.md')

/**
 * **Lo que quedó abierto en otra especificación.**
 *
 * Al dejar de estar clavado en una carpeta, esto pasó a informar la activa — y
 * con eso, **las tareas abiertas de la anterior se volvieron invisibles**. Es la
 * misma mentira que el archivo clavado, con el signo cambiado: antes informaba
 * la vieja creyendo ser la nueva, ahora informaría la nueva olvidando la vieja.
 *
 * No las cuenta para el porcentaje —el avance es el de la activa— pero **no
 * deja que desaparezcan**.
 */
function openElsewhere() {
  const specs = join(ROOT, 'specs')
  /* sin sujeto: sin `specs/` no hay otras especificaciones que listar, y que no
     haya ninguna ya lo dijo quien buscó la activa. */
  if (!existsSync(specs)) return []

  return readdirSync(specs)
    .filter((name) => `specs/${name}` !== FEATURE)
    .map((name) => ({ name, file: join(specs, name, 'tasks.md') }))
    .filter((each) => existsSync(each.file))
    .map(({ name, file }) => ({
      name,
      open: readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => /^- \[ \] T\d+/.test(line)).length,
    }))
    .filter((each) => each.open > 0)
}

const WIDTH = 13

const phases = []
let current = null

for (const line of readFileSync(TASKS_FILE, 'utf8').split('\n')) {
  const phase = line.match(/^## Fase \d+ · (?:Tramo (\d+) — )?(.+)$/)
  if (phase) {
    current = {
      label: phase[1] ? `TRAMO ${phase[1]}` : 'CIERRE',
      title: phase[1] ? phase[2] : '',
      tasks: [],
      checkpoint: '',
    }
    phases.push(current)
    continue
  }

  if (!current) continue

  const task = line.match(/^- \[([ xX])\] (T\d+) (.+)$/)
  if (task) {
    current.tasks.push({
      done: task[1] !== ' ',
      id: task[2],
      /* Sin las marcas de paralelo y de tramo, y sin el markdown: lo que se
         imprime en una terminal tiene que leerse en una terminal. */
      what: task[3]
        .replace(/^\[P\] /, '')
        .replace(/^\[E\d+\] /, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\*\*/g, '')
        .replace(/`/g, ''),
    })
    continue
  }

  const checkpoint = line.match(/^\*\*Punto de control\*\*: (.+)$/)
  if (checkpoint) current.checkpoint = checkpoint[1].replace(/\*\*/g, '').replace(/`/g, '')
}

if (phases.length === 0) {
  console.error('No pude leer ninguna phase de tasks.md. ¿Cambió el formato?')
  process.exit(1)
}

/**
 * **Y ningún punto de control es tan sospechoso como ninguna fase.**
 *
 * El patrón decía `Punto de checkpoint` y el archivo escribe `Punto de control`
 * desde que se tradujo: **cero coincidencias, y ni una queja**. El informe
 * terminaba insistiendo en que lo que cierra un tramo es su punto de control y
 * no podía mostrar ninguno.
 *
 * Esta guarda es la que faltaba: el mismo renombre, la próxima vez, falla.
 */
if (phases.every((f) => !f.checkpoint)) {
  console.error(`Leí ${phases.length} fases y ningún punto de control. ¿Cambió el formato?`)
  process.exit(1)
}

/* El primero que tenga algo sin hacer es donde estamos. */
const inProgress = phases.find((f) => f.tasks.some((t) => !t.done))
const labelWidth = Math.max(...phases.map((f) => f.label.length))
const titleWidth = Math.max(...phases.map((f) => f.title.length))

let doneCount = 0
let total = 0

console.log('')

for (const f of phases) {
  const readyCount = f.tasks.filter((t) => t.done).length
  doneCount += readyCount
  total += f.tasks.length

  const filled = f.tasks.length === 0 ? 0 : Math.round((readyCount / f.tasks.length) * WIDTH)
  const bar = '#'.repeat(filled) + '.'.repeat(WIDTH - filled)

  const status =
    readyCount === f.tasks.length && f.tasks.length > 0
      ? 'listo'
      : f === inProgress
        ? 'en curso'
        : ''

  console.log(
    '  ' +
      f.label.padEnd(labelWidth) +
      '  ' +
      f.title.padEnd(titleWidth) +
      '  [' +
      bar +
      ']  ' +
      String(readyCount).padStart(2) +
      '/' +
      String(f.tasks.length).padEnd(2) +
      '  ' +
      status,
  )
}

console.log('')

if (!inProgress) {
  console.log(`  ${doneCount} de ${total} · todas las tareas están marcadas`)
  console.log('')
  console.log('  Marcar no es terminar: lo cierra el punto de control del último tramo.')
  const last = phases.filter((f) => f.checkpoint).at(-1)
  if (last) console.log(`  ${last.checkpoint}`)
  console.log('')
  process.exit(0)
}

const nextTask = inProgress.tasks.find((t) => !t.done)

console.log(`  ${doneCount} de ${total} · ${inProgress.label.toLowerCase()} en curso`)
console.log('')
console.log(`  siguiente   ${nextTask.id}  ${nextTask.what}`)
if (inProgress.checkpoint) console.log(`  control     ${inProgress.checkpoint}`)
console.log('')
console.log('  Una casilla no cierra un tramo: lo cierra su punto de control.')

for (const each of openElsewhere()) {
  console.log(
    `  Y ${each.open === 1 ? 'queda 1 tarea' : `quedan ${each.open} tareas`} sin hacer en ${each.name}.`,
  )
}
console.log('')
