import { createContext, useContext } from 'react'
import type { WorkContext } from './context'
import { Failure } from './failure'
import { useCurrentScreen } from './routes'
import { useWorkContextValues } from './use-work-context'

/**
 * **El registro es un puerto, y hay algo que nunca sale** (`CU-35`).
 *
 * Entra igual que la autenticación: el esqueleto define la interfaz y la
 * aplicación enchufa una implementación en la raíz (`CU-36`). Hoy un tablero,
 * mañana otro, y nada del resto del código se entera.
 *
 * **Lo que nunca sale es ningún dato de una persona.** Ni su nombre, ni su
 * saldo, ni nada con que reconstruirla — y la forma de garantizarlo no es una
 * regla que alguien recuerde: **es que no haya dónde ponerlo.**
 *
 * Cada evento declara sus campos y **ninguno acepta un objeto libre**. No hay
 * un `payload`, ni un `Record<string, unknown>`, ni un `extra`. Meter el estado
 * de un componente acá no es algo que esté prohibido: es algo que no compila.
 *
 * Alcanza con tan poco porque el `requestId` **ya alcanza para encontrarlo del
 * otro lado**, donde el dato sí está y sí corresponde que esté.
 */

export type TelemetryEvent = ScreenFailed | RequestFailed | ScreenOpened | ActionRan

/** Una pantalla reventó por un error de programación (`CU-30`). */
type ScreenFailed = {
  readonly kind: 'screenFailed'
  /**
   * El que se le muestra al operador, **y el mismo que llega acá** (`CU-30`).
   *
   * No es un `requestId` porque no hubo pedido: se genera al fallar, y sirve
   * para encontrar esto cuando alguien lo menciona.
   */
  readonly id: string
  /** Cuál reventó. El identificador de la pantalla, no su título. */
  readonly screen: string
  /**
   * Qué error fue: su clase y su mensaje, **y nada más**.
   *
   * Ni la pila con las propiedades, ni el estado del componente. Un error de
   * programación suele arrastrar adentro lo que estaba mostrando, y un volcado
   * entero es la exposición que `CU-35` prohíbe, disfrazada de diagnóstico.
   *
   * `CU-35` anota además el borde que esto no cierra, y qué se hace con él.
   */
  readonly error: string
}

/**
 * **Un error que es defecto nuestro, no del operador** (`CU-25`, `CU-34`).
 *
 * Son dos y las dos significan lo mismo: la pantalla ofreció algo que no
 * correspondía. Un `403` porque `CU-3` dice que lo que un permiso no habilita
 * **no se muestra**, y un `IDEMPOTENCY_KEY_REUSE` porque la puerta ató mal la
 * clave.
 *
 * **Se deja rastro y por eso existe este evento**: sin él, tratarlos como un
 * fallo cualquiera esconde un defecto nuestro atrás de un cartel amable, y
 * nadie se entera nunca.
 */
type RequestFailed = {
  readonly kind: 'requestFailed'
  /** El del pedido. Es lo que correlaciona con el otro lado, donde está el dato. */
  readonly requestId: string
  /** Del enum cerrado del contrato. Es sobre esto que se ramifica. */
  readonly code: string
  /** Desde cuál se pidió — que es lo que permite encontrar la que está mal. */
  readonly screen: string
}

/** Qué pantalla se abrió. Un tablero saca de acá qué se usa y qué no. */
type ScreenOpened = {
  readonly kind: 'screenOpened'
  readonly screen: string
}

/**
 * Cuánto tardó una acción, y cómo terminó.
 *
 * **La duración se mide donde ya se sabe**: la puerta abre y cierra el intento,
 * así que no hace falta instrumentar nada más. Un tablero ve acá si algo se
 * está poniendo lento antes de que alguien lo reporte.
 */
type ActionRan = {
  readonly kind: 'actionRan'
  /** El identificador de la acción, no lo que mandó. */
  readonly action: string
  readonly screen: string
  readonly durationMs: number
  /**
   * Cómo terminó.
   *
   * `rejected` es el servidor contestando que no —una regla— y **no es una
   * falla**: separarlo acá es lo que evita que un tablero cuente reglas de
   * negocio como errores del sistema (`CU-25`).
   */
  readonly outcome: 'ok' | 'rejected' | 'failed'
}

/**
 * **El sobre: lo que acompaña a todo evento** (`CU-35`).
 *
 * Un evento dice *qué pasó*. El sobre dice **cuándo, dónde y en qué contexto**, y
 * sin eso el registro no se puede consultar: no hay cómo ordenar, ni cómo
 * separar cuatro aplicaciones que reportan al mismo lugar, ni cómo contestar la
 * pregunta que esta decisión promete —**si un error es frecuente o único**—,
 * que necesita algo con qué agrupar.
 *
 * **Lo llena el marco, en un solo lugar.** No cada llamador, que se olvidaría, ni
 * cada implementación, que estamparía distinto y no se podría probar.
 *
 * Y es **uniforme, no por tipo de evento**, que es lo que lo vuelve consultable
 * — `CU-35` dice qué se pierde con la otra forma.
 */
export type Recorded = {
  /**
   * Cuándo, en ISO.
   *
   * **Es el reloj del navegador**, y eso no se puede arreglar desde acá: una
   * máquina de mostrador con la hora mal produce eventos fuera de orden. Para lo
   * que se correlaciona con el servidor está el `requestId`; para lo que sólo
   * pasó en el navegador, esto es lo único que hay.
   */
  readonly at: string
  /** Cuál de las aplicaciones. Sale del manifiesto. */
  readonly app: string
  /** Qué compilación. Sin esto, «¿esto es nuevo?» no se contesta. */
  readonly version: string
  /**
   * Con qué agrupar, **sin identificar a nadie**.
   *
   * Es opaco y por pestaña, y **jamás el `sub`**: con el sujeto adentro, el
   * tablero pasaría a tener el historial de navegación de una persona
   * identificada, que es exactamente lo que esta decisión rechaza.
   *
   * Sobrevive a recargar porque si no, un operador que recarga después de un
   * error aparece como dos — y ahí «frecuente o único» vuelve a contestarse mal.
   */
  readonly session: string
  /** En qué pantalla. **En todos**, para que una consulta por pantalla sea una. */
  readonly screen: string
  /**
   * Lo que agrega la aplicación, de lo que declaró en su manifiesto.
   *
   * **Sin elegir es `null`, no `undefined`.** No es un gusto: `undefined`
   * desaparece al serializar a JSON, así que la clave no llegaría al tablero — y
   * una consulta no podría distinguir «no hay sucursal elegida» de «esta
   * aplicación no tiene sucursales». Con `null` el campo existe y está vacío,
   * que es lo que hace falta para consultar.
   */
  readonly context: Readonly<Record<string, string | null>>
  /** Qué pasó. */
  readonly event: TelemetryEvent
}

/**
 * **Lo que una aplicación agrega al sobre** (`CU-35`).
 *
 * Una terminal de mostrador y un panel de administración no se describen igual,
 * así que el contexto lo declara la aplicación. Los eventos no: qué clase de
 * cosas pasan es lo mismo en las cuatro, y ésa es la línea.
 *
 * **El valor es un contexto de trabajo, no un texto.** Es la primera de las tres
 * restricciones con las que esto se aceptó: `CU-26` ya garantiza que ahí adentro
 * van identificadores, así que meter un dato de una persona necesita **un paso
 * deliberado** —declarar un contexto y guardar mal— en vez de escribirlo acá.
 *
 * ```ts
 * telemetry: { envelope: { branch: currentBranch } }
 * ```
 *
 * Declarar un campo sin decir de dónde sale **no compila**, y por eso el que lo
 * escribe no puede olvidarse: no hay nada que completar después.
 */
export type TelemetryEnvelope = Readonly<Record<string, WorkContext>>

/**
 * **Lo que la aplicación implementa.** Recibe el sobre ya armado.
 *
 * Quien emite manda **un evento pelado** —`useTelemetry().record({ kind: … })`—
 * y el marco le pone el sobre en el camino. Son dos formas a propósito: si el
 * que emite tuviera que armar el sobre, habría veinte lugares donde olvidar un
 * campo.
 */
export type TelemetryPort = {
  readonly record: (recorded: Recorded) => void
}

type Setup = {
  readonly port: TelemetryPort
  readonly app: string
  readonly version: string
  readonly envelope: TelemetryEnvelope
}

const TelemetryContext = createContext<Setup | undefined>(undefined)

export const TelemetryProvider = TelemetryContext.Provider

/**
 * El identificador de sesión: **opaco, por pestaña, y no se guarda con nadie**.
 *
 * Vive en `sessionStorage` sin estampar con el sujeto —a diferencia de todo lo
 * de `CU-26`— y eso es deliberado: **no pertenece a nadie**. Atarlo a una
 * persona sería justamente convertirlo en lo que no puede ser.
 */
const SESSION_KEY = 'cuarzo.telemetry.session'

function sessionId(): string {
  try {
    const known = globalThis.sessionStorage?.getItem(SESSION_KEY)
    if (known) return known
    const fresh = crypto.randomUUID()
    globalThis.sessionStorage?.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    /* Sin almacenamiento se agrupa peor, y no se deja de registrar. */
    return 'sin-sesion'
  }
}

/**
 * El registro, o uno que no hace nada.
 *
 * **No falla si nadie lo proveyó**, y es la única excepción de esta clase en el
 * repositorio: los demás puertos revientan afuera de su proveedor. Acá reventar
 * sería que **el registro de un error tape al error** — y el que se pierde es el
 * que se estaba tratando de registrar.
 */
export type TelemetryRecorder = {
  readonly record: (event: TelemetryEvent) => void
}

export function useTelemetry(): TelemetryRecorder {
  const setup = useContext(TelemetryContext)
  const screen = useCurrentScreen()
  const contexts = useWorkContextValues()

  if (!setup) return SILENT

  return {
    record: (event) =>
      setup.port.record({
        at: new Date().toISOString(),
        app: setup.app,
        version: setup.version,
        session: sessionId(),
        screen,
        context: Object.fromEntries(
          Object.entries(setup.envelope).map(([field, context]) => [
            field,
            contexts.get(context.id) ?? null,
          ]),
        ),
        event,
      }),
  }
}

const SILENT: TelemetryRecorder = { record: () => {} }

/**
 * El registro de desarrollo: la consola.
 *
 * En desarrollo **no se le manda nada a un tablero de producción** (`CU-35`), y
 * el que mira es quien está programando.
 */
/**
 * **Un evento que nadie manejó no compila.**
 *
 * Sin esto el `switch` de abajo se lee como si obligara a manejarlos todos y no
 * obliga: un evento nuevo compila y **se descarta en silencio**. Lo peor que
 * puede hacer un registro es no registrar sin decirlo.
 *
 * Es la contracara del canje de la unión cerrada: si agregar un evento fuera
 * gratis, cada implementación se quedaría atrás por su cuenta.
 */
function unhandled(event: never): never {
  throw new Failure(
    'declaration.unhandledEvent',
    `Nadie sabe registrar "${(event as TelemetryEvent).kind}".`,
  )
}

export const consoleTelemetry: TelemetryPort = {
  record: (recorded) => {
    /* **Un titular corto y el sobre entero al lado.** Las dos cosas, y no una:
       el titular se lee de un vistazo mientras se programa, y el sobre es lo
       único que deja ver **si se está llenando**. Sin él, un campo que quedara
       vacío no se notaría hasta consultar el tablero meses después — que es
       exactamente cómo se escapan estos defectos. */
    const { event, screen } = recorded

    switch (event.kind) {
      case 'screenFailed':
        console.error(`[reventó] ${screen} · ${event.id}`, recorded)
        return
      case 'requestFailed':
        /* Es un defecto nuestro, así que va como error aunque el operador ya
           haya visto un aviso amable (`CU-25`). */
        console.error(`[defecto] ${event.code} en ${screen}`, recorded)
        return
      case 'screenOpened':
        console.info(`[pantalla] ${screen}`, recorded)
        return
      case 'actionRan':
        console.info(
          `[acción] ${event.action} · ${event.durationMs}ms · ${event.outcome}`,
          recorded,
        )
        return
      default:
        unhandled(event)
    }
  },
}
