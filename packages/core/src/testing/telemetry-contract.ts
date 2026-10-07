import { Failure } from '../base/failure'
import type { Recorded, TelemetryEvent, TelemetryPort } from '../base/telemetry'

/**
 * **Lo que toda implementación del registro tiene que cumplir** (`CU-35`).
 *
 * El tipo `TelemetryPort` garantiza **la forma**: que hay un `record` y qué
 * recibe. No garantiza **la conducta**, y ahí es donde se rompe un adaptador
 * nuevo: uno que hable con un tablero por red compila perfecto y puede tirar,
 * bloquear, o tirar los eventos al vacío.
 *
 * Esto se publica para que el día que exista un adaptador de verdad, la pregunta
 * «¿sigue funcionando?» tenga una respuesta que no sea probarlo a mano:
 *
 * ```ts
 * it('cumple el contrato del registro', () => telemetryContract(grafanaTelemetry))
 * ```
 *
 * **No usa ningún marco de pruebas a propósito**: tira una `Failure` con lo que
 * falló. Así se puede llamar desde vitest, desde otra cosa, o desde un arranque
 * en desarrollo.
 *
 * ## Lo que verifica, y por qué cada una
 *
 * | | qué rompe si no se cumple |
 * |---|---|
 * | **Nunca tira** | Es lo que más duele: el registro de un error se convierte en otro error, y el original se pierde |
 * | **No bloquea** | Un `record` que devuelve una promesa hace que quien lo llama espere a la red — adentro de un manejador de errores |
 * | **No muta el evento** | Quien llama puede seguir usándolo; un adaptador que le agregue campos se los pasa al siguiente |
 *
 * ## Lo que NO puede verificar, y conviene saberlo
 *
 * **Que efectivamente registre.** Una implementación que trague todo en silencio
 * pasa esta prueba: desde afuera no hay forma de observar el efecto de un puerto
 * sin conocer su destino. Lo que sí está cubierto del otro lado es que **no se
 * olvide un tipo de evento**, y eso lo hace el compilador — la unión es cerrada
 * y hay una guarda de exhaustividad.
 */

/** Uno de cada tipo. Si aparece un evento nuevo, la exhaustividad obliga a sumarlo. */
const EVENTS: readonly TelemetryEvent[] = [
  { kind: 'screenFailed', id: 'abc', screen: 'catalogGrid', error: 'TypeError: x' },
  { kind: 'requestFailed', requestId: 'req-1', code: 'FORBIDDEN', screen: 'catalogGrid' },
  { kind: 'screenOpened', screen: 'catalogGrid' },
  {
    kind: 'actionRan',
    action: 'article.create',
    screen: 'catalogGrid',
    durationMs: 12,
    outcome: 'ok',
  },
]

/**
 * El sobre con el que llegan, armado como lo arma el marco.
 *
 * **Con contexto propio adentro**, que es lo que una aplicación agrega: si un
 * adaptador sólo anduviera con el sobre vacío, se rompería el día que alguien
 * declare el suyo — y ese día nadie va a volver a correr esto.
 */
const enveloped = (event: TelemetryEvent): Recorded => ({
  at: '2026-08-23T03:00:00.000Z',
  app: 'demo',
  version: 'v1',
  session: 'abc',
  screen: 'catalogGrid',
  context: { branch: '7' },
  event,
})

const SAMPLES: readonly Recorded[] = EVENTS.map(enveloped)

const violates = (what: string, detail: string): never => {
  throw new Failure('declaration.brokenTelemetry', `El registro ${what}. ${detail}`)
}

export function telemetryContract(port: TelemetryPort): void {
  for (const recorded of SAMPLES) {
    const before = JSON.stringify(recorded)

    let returned: unknown
    try {
      returned = port.record(recorded)
    } catch (error) {
      /* Acá no se deja pasar: si el registro tira, quien lo llamó estaba
         justamente tratando un error, y **el original se pierde**. */
      violates(
        'tira al recibir un evento',
        `Con "${recorded.event.kind}" tiró ${error instanceof Error ? error.name : 'algo'}. ` +
          'Un adaptador que habla por red atrapa sus propias fallas: no las propaga.',
      )
    }

    if (typeof (returned as { then?: unknown } | undefined)?.then === 'function') {
      /* El tipo dice `void` y una función `async` es asignable a `void`, así que
         el compilador no lo agarra. Acá sí. */
      violates(
        'devuelve una promesa',
        `Con "${recorded.event.kind}". Quien llama no la espera, así que una falla adentro ` +
          'queda sin atrapar. Lo que va por red se manda y se olvida.',
      )
    }

    if (JSON.stringify(recorded) !== before) {
      violates(
        'modifica el evento que recibe',
        `Con "${recorded.event.kind}". Quien lo mandó puede seguir usándolo, y lo agregado viaja con él.`,
      )
    }
  }
}
