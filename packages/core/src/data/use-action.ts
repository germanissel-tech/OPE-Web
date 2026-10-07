import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Failure } from '../base/failure'
import { useNotices } from '../base/notices'
import { useCurrentScreen } from '../base/routes'
import { useTelemetry } from '../base/telemetry'
import { useStrings } from '../base/use-strings'
import type { Action, Operations, Resolved } from './action'
import { type Clash, clashBetween, mergedOnto } from './conflict'
import { type FieldError, RequestFailed } from './envelope'
import { failureNotice, isBusinessRejection, successNotice } from './notice'
import { useServices } from './service'

/**
 * **La puerta de acciones** (`CU-25`, `CU-34`).
 *
 * Una acción declara qué hace y qué invalida; **todo lo demás pasa acá**, una
 * vez, para las cuatro aplicaciones:
 *
 * | | |
 * |---|---|
 * | Sale bien | Un aviso, y se invalida **lo que la acción declaró** |
 * | Vuelve `error.fields` | Los mensajes van **a los campos** que los pidieron (`CU-5`) |
 * | Cualquier otro error | Un aviso con el **identificador del pedido** |
 * | Siempre | **No se reintenta.** Reejecutar algo que nadie volvió a pedir es peor que fallar |
 */

export type ActionResult<Input> = {
  /**
   * Ejecuta, y **devuelve una promesa que se puede esperar**.
   *
   * granito apaga el botón mientras el `onClick` no resuelva (`GR-68`), así que
   * devolverla es lo que hace que quede apagado **toda la operación** y no sólo
   * la ventana del gesto.
   *
   * **Nunca rechaza**: el error ya lo trató la puerta —el aviso, los campos, el
   * rastro— y propagarlo dejaría un rechazo sin atrapar en cada `onClick`.
   */
  readonly run: (input: Input) => Promise<void>
  readonly running: boolean
  /**
   * Lo que el servidor rechazó, campo por campo.
   *
   * **Lo consume el formulario**, que es el único que sabe qué control
   * corresponde a cada nombre.
   */
  readonly fields: readonly FieldError[]
  /**
   * **Qué cambió de lo que el operador tocó**, si hubo choque (`CU-29`).
   *
   * Vacío quiere decir que no hay nada que decidir — que es el caso frecuente:
   * cuando lo que el otro cambió no se cruza con lo editado, la puerta guarda
   * sobre la versión nueva y esto nunca se llena.
   *
   * **Lo tecleado no está acá y no se toca.** Sigue en el formulario, entero.
   */
  readonly clash: readonly Clash[]
  /** Descartar el choque sin guardar: el operador se queda editando. */
  readonly dismissClash: () => void
}

/**
 * Lo que la pantalla aporta para que la puerta pueda decidir (`CU-29`).
 *
 * Son tres cosas y **las tres las tiene ya**: cargó el registro, es dueña del
 * formulario, y sabe cómo volver a pedirlo. La decisión dice que la comparación
 * vive en la puerta y que *«lo que cada formulario aporta es qué campos tocó el
 * operador, que ya lo sabe»* — esto es eso, dicho en tres campos.
 *
 * Se pasa y no se adivina: un contexto que lo tomara solo haría que una pantalla
 * quede protegida o no según dónde esté montada, que es peor que no estarlo.
 */
export type Concurrency = {
  /** Los valores tal como llegaron al abrir. La referencia para comparar. */
  readonly loaded: Readonly<Record<string, unknown>>
  /**
   * Los que el operador tiene **en el instante en que el servidor rechaza**.
   *
   * Es una función y no un valor por dos razones, y la segunda pesa más: se lee
   * cuando llega el rechazo, así que no puede quedar vieja; y pedirla como valor
   * obliga a la pantalla a **construir el formulario antes que la puerta**, con
   * lo cual no puede pasarle `fields` — y los errores que el servidor devuelve
   * por campo no se muestran en ningún lado.
   *
   * **Lo que devuelve no se toca.**
   */
  readonly onScreen: () => Readonly<Record<string, unknown>>
  /** Cómo volver a pedir el registro, con su testigo nuevo. */
  readonly reread: () => Promise<{
    readonly values: Readonly<Record<string, unknown>>
    readonly version: string
  }>
  /**
   * **Cómo se rearma el intento con los valores fusionados** (`CU-29`).
   *
   * La puerta sabe **qué** mandar —lo del servidor con lo que el operador
   * cambió encima— y no sabe **con qué forma**: el cuerpo de una escritura es
   * del contrato de cada aplicación. Así que calcula la fusión y pide que la
   * pantalla la convierta en una entrada.
   *
   * Sin esto el reintento mandaría el cuerpo original, que incluye los campos
   * que el operador **no** tocó — y ésos son del otro. Pisarlos en silencio es
   * lo que el mecanismo existe para evitar.
   */
  readonly retryWith: (
    values: Readonly<Record<string, unknown>>,
    version: string,
  ) => Readonly<Record<string, unknown>>
}

/**
 * Las operaciones con **su servicio y su clave** ya puestos.
 *
 * Es lo que hace que una acción no escriba ninguna de las dos cosas (`CU-34`,
 * `CU-36`): quien la declara escribe `ops.create.run(input)`, y el servicio y la
 * clave del intento viajan igual.
 *
 * La clave se liga a **todas y no sólo a las que la piden**: una que no la exige
 * la recibe y no la usa, y así no hay que acordarse de cuál era cuál.
 */
export function resolveOperations<Ops extends Operations>(
  operations: Ops,
  services: ReadonlyMap<string, unknown>,
  key: string | undefined,
): Resolved<Ops> {
  const resolved = Object.entries(operations).map(([name, each]) => {
    if (!services.has(each.serviceId)) {
      throw new Failure(
        'wiring.outsideProvider',
        `La operación "${each.id}" habla con el servicio "${each.serviceId}", que nadie registró.`,
      )
    }

    const service = services.get(each.serviceId)
    return [name, { run: (input: never) => each.run(service, input, key) }]
  })

  return Object.fromEntries(resolved) as Resolved<Ops>
}

/**
 * Los intentos sin resolver, **por cuerpo**.
 *
 * Una sola ranura alcanzaba mientras la única acción vivía en un diálogo. En
 * una grilla no: anular la fila A, que falle, anular la B, y volver a A la
 * habría dado por otro intento —clave nueva— y el servidor la habría aplicado
 * dos veces. Nada de eso se ve en pantalla.
 */
export type Attempts = ReadonlyMap<string, string>

/**
 * **La clave se ata al cuerpo del intento** (`CU-34`).
 *
 * Mismo cuerpo, misma clave: es un reintento, y el servidor devuelve lo de
 * antes en vez de aplicar dos veces. Cuerpo distinto, clave nueva: es otro
 * intento.
 *
 * **No se deriva del cuerpo**, y eso es deliberado: dos cobros idénticos
 * legítimos darían la misma clave, y el segundo se perdería en silencio. Lo
 * que evita ese caso es `forgetAttempt`, que borra el intento al salir bien —
 * el segundo cobro sale con clave nueva porque el primero dejó de figurar
 * entre los pendientes.
 *
 * Devuelve el mapa además de la clave en vez de tocarlo: así se puede probar
 * qué pasa en cada secuencia, y lo que falla acá no se ve fallar.
 */
export function attemptKey(
  attempts: Attempts,
  input: unknown,
  idempotent: boolean,
): { readonly key: string | undefined; readonly attempts: Attempts } {
  if (!idempotent) return { key: undefined, attempts }

  const body = JSON.stringify(input)
  const known = attempts.get(body)
  if (known) return { key: known, attempts }

  const key = crypto.randomUUID()
  return { key, attempts: new Map(attempts).set(body, key) }
}

/** El intento salió: el próximo con el mismo cuerpo es **otro** intento. */
export function forgetAttempt(attempts: Attempts, input: unknown): Attempts {
  const rest = new Map(attempts)
  rest.delete(JSON.stringify(input))
  return rest
}

/**
 * Los códigos que significan que **la pantalla está mal, no el operador**.
 *
 * Los tres dejan rastro, porque los tres son defectos nuestros que el operador
 * no puede corregir: un `403` dice que la interfaz ofreció algo que no
 * correspondía, un reuso de clave que la puerta la ató mal, y un pedido que
 * tenía que ser condicional y no lo era, que la pantalla escribió sin el testigo
 * que había leído (`CU-49`).
 */
const OURS = new Set(['FORBIDDEN', 'IDEMPOTENCY_KEY_REUSE', 'PRECONDITION_REQUIRED'])

/**
 * **El rechazo por versión vieja, reconocido por su código** (`CU-14`, `CU-29`).
 *
 * Nunca por el mensaje: es castellano para una persona y cambia sin que eso sea
 * un cambio de contrato. Y **nunca por el `412` a secas**: el estado de HTTP no
 * alcanza para saber qué hacer, y el enum del contrato sí.
 */
const STALE = 'STALE_VERSION'

/** Lo que la pantalla le dice a la puerta, todo opcional. */
export type ActionOptions<Output> = {
  /**
   * Qué hace la pantalla cuando salió bien: cerrar un diálogo, vaciar un
   * formulario.
   *
   * **Sólo con éxito**, y por eso lo pone la puerta y no el botón: un
   * `onClick` que cierra el diálogo lo cierra también cuando falló, y el
   * operador pierde lo que había escrito junto con el error que explica por qué.
   */
  readonly onDone?: (output: Output) => void
  /**
   * Con qué comparar si el servidor rechaza por versión vieja (`CU-29`).
   *
   * **Sin esto, un rechazo por conflicto se trata como cualquier otro error**:
   * se avisa y no se pisa nada. Es menos que la protección entera, y sigue
   * siendo mejor que guardar encima.
   */
  readonly concurrency?: Concurrency
}

export function useAction<Input, Output, Ops extends Operations>(
  action: Action<Input, Output, Ops>,
  options: ActionOptions<Output> = {},
): ActionResult<Input> {
  const { onDone, concurrency } = options
  const [clash, setClash] = useState<readonly Clash[]>([])
  const queries = useQueryClient()
  const services = useServices()
  const telemetry = useTelemetry()
  const screen = useCurrentScreen()

  /* Se anota **cómo terminó y cuánto tardó**, y un rechazo de negocio no cuenta
     como falla: sin separarlos, un tablero cuenta reglas de negocio como
     errores del sistema y el número no dice nada (`CU-25`, `CU-35`). */
  const record = (outcome: 'ok' | 'rejected' | 'failed', started: number) => {
    telemetry.record({
      kind: 'actionRan',
      action: action.id,
      screen,
      durationMs: Math.round(performance.now() - started),
      outcome,
    })
  }
  const { notify } = useNotices()
  const strings = useStrings()

  /**
   * **La clave se ata al cuerpo del intento** (`CU-34`).
   *
   * Por qué al cuerpo y no al abrir el formulario ni al apretar el botón, y
   * por qué **no se deriva** del cuerpo, está en `CU-34`.
   */
  const attempts = useRef<Attempts>(new Map())

  const keyFor = (input: Input): string | undefined => {
    const next = attemptKey(attempts.current, input, action.idempotent)
    attempts.current = next.attempts
    return next.key
  }

  const mutation = useMutation({
    /* Nunca. Lo que hace seguro reintentar es la clave, y quien reintenta es el
       operador — no una política por omisión (`CU-25`, `CU-9`). */
    retry: false,
    mutationFn: async (input: Input) => {
      const key = keyFor(input)
      /* Se mide acá porque **acá ya se sabe**: la puerta abre y cierra el
         intento, así que no hay que instrumentar nada más (`CU-35`). */
      const started = performance.now()
      try {
        const output = await action.run(input, resolveOperations(action.operations, services, key))
        record('ok', started)
        return output
      } catch (error) {
        const rejected = error instanceof RequestFailed && isBusinessRejection(error)
        record(rejected ? 'rejected' : 'failed', started)
        throw error
      }
    },
    onSuccess: (output, input) => {
      attempts.current = forgetAttempt(attempts.current, input)

      notify(successNotice(action.announces?.(output, input), strings.actionDone))

      for (const key of action.invalidates?.(input, output) ?? []) {
        void queries.invalidateQueries({ queryKey: key })
      }

      onDone?.(output)
    },
    onError: (error) => {
      const failed = error instanceof RequestFailed ? error : undefined

      /* **Los dos que son defecto nuestro dejan rastro** (`CU-25`, `CU-34`): un
         `403` significa que la interfaz ofreció algo que no correspondía, y un
         reuso de clave que la puerta la ató mal. Sin esto se los trata como un
         fallo cualquiera y **nadie se entera nunca**. */
      if (failed && OURS.has(failed.code)) {
        telemetry.record({
          kind: 'requestFailed',
          requestId: failed.requestId,
          code: failed.code,
          screen,
        })
      }

      /**
       * **El conflicto no es un error de campos ni un fallo cualquiera**
       * (`CU-29`, `CU-38`).
       *
       * Se trata antes que los otros dos y sale del camino: mandarlo a los
       * campos le mostraría al operador un formulario que parece mal llenado, y
       * tratarlo como fallo genérico le diría «no anda» sobre algo que sí
       * funcionó — el servidor hizo exactamente lo que tenía que hacer.
       *
       * **Lo que se muestra lo resuelve el efecto de abajo**, porque releer es
       * asíncrono y esto no puede esperar.
       */
      if (failed?.code === STALE) return

      /* Los que vuelven a los campos no llevan aviso: el formulario los muestra
         donde se corrigen, y un aviso encima sería decirlo dos veces. */
      if (failed && failed.fields.length > 0) return

      notify(failureNotice(failed, strings))
    },
  })

  const failed = mutation.error instanceof RequestFailed ? mutation.error : undefined

  /**
   * **Releer, comparar, y decidir por el operador sólo cuando no hay nada que
   * decidir** (`CU-29`).
   *
   * Sin cruce se guarda con el testigo nuevo y **el operador no se entera de
   * nada**: es el caso frecuente, y el que separa una protección de un estorbo
   * diario. Con cruce se muestra, y lo tecleado sigue donde estaba.
   *
   * **No es un reintento** (`CU-25`). Un reintento repite el mismo intento; esto
   * arma uno nuevo, con otro testigo, después de haber verificado que no pisa a
   * nadie. Que se parezcan es justamente el error que `CU-29` anticipa —
   * «va a aparecer disfrazado de reintento»— y por eso vuelve a pasar por `run`
   * en vez de reenviar la llamada anterior.
   */
  const resolveClash = async (rejected: RequestFailed) => {
    if (!concurrency) return

    let fresh: Awaited<ReturnType<Concurrency['reread']>>
    try {
      fresh = await concurrency.reread()
    } catch {
      /* **No se puede comparar, así que no se decide.** Se avisa con el
         identificador del pedido y no se guarda: peor que el caso bueno, y
         mejor que pisar el trabajo del otro. */
      notify(failureNotice(rejected, strings))
      return
    }

    const onScreen = concurrency.onScreen()
    const crossed = clashBetween(concurrency.loaded, onScreen, fresh.values)
    if (crossed.length > 0) {
      setClash(crossed)
      return
    }

    /* **Lo del servidor con lo del operador encima**, no el cuerpo original: los
       campos que no tocó son del otro, y mandarlos los pisaría. */
    const merged = mergedOnto(fresh.values, concurrency.loaded, onScreen)
    await attempt(concurrency.retryWith(merged, fresh.version) as Input, true)
  }

  /**
   * Un intento, y **qué hacer si el servidor vuelve a rechazar por versión**.
   *
   * `afterMerge` dice si éste ya es el reintento fusionado. Con él en `true` la
   * puerta **no vuelve a fusionar**: releería, compararía contra la misma
   * referencia y escribiría otra vez, en un ciclo que sólo termina cuando el
   * tercero deja de escribir. `CU-29` describe **una** relectura; encadenarlas
   * sería inventar una política de reintento que `CU-25` prohíbe.
   *
   * Dos rechazos seguidos quieren decir que alguien está escribiendo ahora
   * mismo: se avisa con el identificador del pedido y no se guarda nada.
   */
  const attempt = async (input: Input, afterMerge: boolean): Promise<void> => {
    setClash([])

    /* **El error se toma del rechazo y no de `mutation.error`.** Ese otro es el
       del render en que se creó esta función, así que después de un `await`
       puede ser el de la vuelta anterior — o ninguno. Es la clase de defecto que
       anda en la primera prueba y falla en la segunda. */
    const rejected = await mutation.mutateAsync(input).then(
      () => undefined,
      /* Se traga a propósito: el error ya lo trató la puerta. */
      (error: unknown) => (error instanceof RequestFailed ? error : undefined),
    )

    if (rejected?.code !== STALE) return

    if (afterMerge) {
      notify(failureNotice(rejected, strings))
      return
    }

    await resolveClash(rejected)
  }

  const run = (input: Input) => attempt(input, false)

  return {
    run,
    running: mutation.isPending,
    fields: failed?.fields ?? [],
    clash,
    dismissClash: () => setClash([]),
  }
}
