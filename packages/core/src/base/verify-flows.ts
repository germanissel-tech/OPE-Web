import { type Flow, isGroup, type MenuEntry } from './flow'
import type { AnyOutcome } from './outcome'
import type { Screen } from './registry'

/**
 * **Las seis comprobaciones de arranque de los flujos** (`CU-47`).
 *
 * Fallan **al arrancar** y no al compilar; por qué se eligió ese escalón está
 * en la decisión.
 *
 * ## Por qué acá y no en la raíz de composición
 *
 * Porque son cuentas sobre listas. Puestas allá, probar cada una con su caso
 * roto obligaría a levantar una aplicación entera — y una comprobación difícil
 * de probar termina probada de a una, o no probada.
 *
 * La raíz llama a esto y **falla con lo que devuelve**; acá no se lanza nada.
 */

export type FlowInput = {
  readonly flows: readonly Flow[]
  readonly screens: readonly Screen[]
  /**
   * **Una entrada por pantalla, no por raíz.**
   *
   * ```
   * { welcome: 'welcome', about: 'welcome', articles: 'articles', article: 'articles' }
   * ```
   *
   * `article` está porque **pertenece** al catálogo, no porque sea raíz de
   * nada. Leerlo como «las que son raíz» lo deja lleno a medias —sólo las
   * raíces—, y cada pantalla que falte pierde su enlace pegado. Lo arma
   * `composeFeatures`.
   */
  readonly featureRootOf: Readonly<Record<string, string>>
  readonly outcomes: readonly AnyOutcome[]
  /**
   * **Qué desenlaces declara cada funcionalidad**, por su raíz (`CU-47`).
   *
   * Es lo que permite preguntar **por flujo** en vez de en general. Sin esto lo
   * único verificable es si algún flujo mapea cada desenlace, y eso aprueba
   * justo el caso que `CU-47` existe para permitir.
   */
  readonly outcomesOf: Readonly<Record<string, readonly string[]>>
  /** Lo que el menú lateral ofrece, en orden (`CU-48`). */
  readonly menu?: readonly MenuEntry[]
}

/**
 * Qué está mal, en frases que nombran **qué falta y dónde**.
 *
 * Devuelve todas y no la primera: quien arregla una quiere saber si quedan
 * otras antes de volver a levantar.
 */
export function verifyFlows(input: FlowInput): readonly string[] {
  const problems: string[] = []

  const flowIds = new Set(input.flows.map((flow) => flow.id))
  const declaredOutcomes = new Set(input.outcomes.map((each) => each.id))
  const registered = new Set(input.screens.map((screen) => screen.id))

  /** Toda pantalla que algún flujo alcanza: su raíz, o el destino de un paso. */
  const reachable = new Set<string>()

  for (const flow of input.flows) {
    reachable.add(flow.root.id)

    for (const step of flow.steps) {
      /* 3 · Un paso que quedó vivo después de borrar lo que lo usaba. Es el que
         `CU-44` marca como el que se pudre en silencio. */
      if (!declaredOutcomes.has(step.outcome)) {
        problems.push(
          `El flujo "${flow.id}" tiene un paso para "${step.outcome}", y ninguna funcionalidad declara ese desenlace.`,
        )
      }

      if (step.destination === undefined) continue

      if (step.destination.kind === 'screen') {
        reachable.add(step.destination.screen.id)
        if (!registered.has(step.destination.screen.id)) {
          problems.push(
            `El flujo "${flow.id}" lleva a la pantalla "${step.destination.screen.id}", que no está registrada.`,
          )
        }
        continue
      }

      /* 4 · El destino es otro flujo. Se resuelve acá y no al declararlo,
         porque puede venir diferido para evitar el ciclo de módulos. */
      const target = resolve(step.destination.flow)
      if (target === undefined || !flowIds.has(target.id)) {
        problems.push(
          `El flujo "${flow.id}" lleva a un flujo que no existe, en el paso de "${step.outcome}".`,
        )
      }
    }
  }

  /* 1 · Una pantalla que ningún flujo alcanza es interfaz muerta: tiene ruta,
     entra por URL, y ya nadie la abre. */
  for (const screen of input.screens) {
    if (!reachable.has(screen.id)) {
      problems.push(
        `La pantalla "${screen.id}" no está en ningún flujo: ni es raíz de uno, ni la abre ningún paso.`,
      )
    }
  }

  /**
   * 2 · **Cada flujo dice qué hace con cada desenlace de las funcionalidades
   * que toca.** Un paso, o `omits`.
   *
   * Se pregunta **por flujo** y no en general: preguntando en general, uno que
   * mapea alcanza para todos, y el segundo flujo que comparta una pantalla
   * aprueba sin decir nada. El porqué de la granularidad —la funcionalidad y no
   * la pantalla— está en `CU-47`.
   */
  for (const flow of input.flows) {
    const declaredHere = new Set(flow.steps.map((step) => step.outcome))

    for (const root of featuresIn(flow, input)) {
      for (const outcome of input.outcomesOf[root] ?? []) {
        if (declaredHere.has(outcome)) continue

        problems.push(
          `El flujo "${flow.id}" toca pantallas de la funcionalidad que arranca en "${root}", y no dice qué hace con "${outcome}". Poné un paso —opens, finishes o closes— o \`omits\` si en este flujo esa acción no se ofrece.`,
        )
      }
    }
  }

  /* 5 · **Se recorren las pantallas, no los valores del mapa.** El mapa puede
     estar completo de un lado y ser parcial del otro: recorrer sus valores
     confirma que las raíces existan y **no ve la pantalla que falta**.

     Y lo que falta no se nota al arrancar. La pantalla anda; el agujero aparece
     cuando alguien la abre desde un favorito, sin estado y sin con qué armar la
     pila. */
  for (const screen of input.screens) {
    const root = input.featureRootOf[screen.id]

    if (root === undefined) {
      problems.push(
        `La pantalla "${screen.id}" no declara de qué funcionalidad es: sin eso, un enlace pegado a ella no sabe dónde empieza el recorrido.`,
      )
      continue
    }

    if (!registered.has(root)) {
      problems.push(
        `La pantalla "${screen.id}" dice venir de "${root}", que no está entre las pantallas registradas.`,
      )
    }
  }

  for (const root of new Set(Object.values(input.featureRootOf))) {
    /* 6 · Es lo que hace determinístico el enlace pegado: sin exactamente uno,
       no hay con qué elegir en qué flujo entra quien llega sin estado. */
    const starting = input.flows.filter((flow) => flow.root.id === root)
    if (starting.length !== 1) {
      problems.push(
        starting.length === 0
          ? `Ningún flujo arranca en "${root}", que es la raíz de una funcionalidad: un enlace pegado a sus pantallas no sabría en qué flujo entra.`
          : `${starting.length} flujos arrancan en "${root}": un enlace pegado a sus pantallas no sabría en cuál entra.`,
      )
    }
  }

  /* ── El menú lateral (`CU-48`) ──────────────────────────────────────── */

  const listed = new Map()
  const labels = new Set<string>()

  for (const entry of input.menu ?? []) {
    /* Un grupo declarado y vacío es una declaración muerta: ocupa un renglón
       del menú para no ofrecer nada. */
    if (isGroup(entry) && entry.items.length === 0) {
      problems.push(`El grupo "${entry.label}" del menú no tiene ningún flujo.`)
    }

    /* **El rótulo de un grupo es su identidad**: de ahí sale el `id` con el que
       el menú decide cuál está desplegado. Repetido, abrir uno abre los dos y
       React avisa por claves duplicadas — que es la clase de defecto que `CU-48`
       quiso eliminar por construcción. */
    if (isGroup(entry)) {
      if (labels.has(entry.label)) {
        problems.push(`Dos grupos del menú se llaman "${entry.label}": abrir uno abriría los dos.`)
      }
      labels.add(entry.label)
    }

    for (const flow of isGroup(entry) ? entry.items : [entry]) {
      /* Cuál gana dependería del orden, y ése es el defecto que aparece meses
         después y en una sola máquina. */
      if (listed.has(flow.id)) {
        problems.push(`El flujo "${flow.id}" está dos veces en el menú.`)
      }
      listed.set(flow.id, true)
    }
  }

  return problems
}

/** Un destino diferido puede no estar todavía; eso es una falla, no una excepción. */
function resolve(flow: () => Flow): Flow | undefined {
  try {
    return flow()
  } catch {
    return undefined
  }
}

/**
 * Las funcionalidades que un flujo toca, por su raíz.
 *
 * Son las de sus pantallas: la raíz del flujo y los destinos de sus pasos. Un
 * destino que nombra **otro flujo** no cuenta — ahí se abandona éste.
 */
function featuresIn(flow: Flow, input: FlowInput): ReadonlySet<string> {
  const screens = [flow.root.id]
  for (const step of flow.steps) {
    if (step.destination?.kind === 'screen') screens.push(step.destination.screen.id)
  }

  const roots = new Set<string>()
  for (const screen of screens) {
    const root = input.featureRootOf[screen]
    if (root !== undefined) roots.add(root)
  }
  return roots
}
