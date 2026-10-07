import type { Notice } from '../base/notices'
import type { Announcement } from './action'
import type { RequestFailed } from './envelope'

/**
 * **Qué dice el aviso de una acción** (`CU-25`).
 *
 * Vive con la puerta y no con el anfitrión que lo dibuja: quién decide **qué
 * pasó** es la puerta; **cómo se ve** es interfaz. Estaban juntos, y eso obligaba
 * a `data` a mirar hacia `ui` — la dirección que `CU-40` prohíbe.
 *
 * Y no es sólo prolijidad de capas: acá adentro está la diferencia entre una
 * falla y un rechazo de negocio, que es una decisión sobre **lo que pasó**, no
 * sobre cómo mostrarlo.
 */

/**
 * Cuánto se queda un aviso de éxito.
 *
 * **Con descripción dura más porque hay más para leer.** Los dos son de granito:
 * su demo usa 6000 con cuerpo, y el aviso de una línea no necesita tanto.
 */
const READ_TITLE = 4000
const READ_BOTH = 6000

/**
 * El aviso de una acción que salió bien.
 *
 * Es una función aparte y no dos líneas adentro de la puerta **para poder
 * probarla**: la duración es una decisión, y una decisión sin prueba se
 * cambia sin que nadie se entere.
 */
export function successNotice(
  announced: string | Announcement | undefined,
  fallbackTitle: string,
): Notice {
  const announcement = typeof announced === 'string' ? { title: announced } : announced

  return {
    tone: 'success',
    title: announcement?.title ?? fallbackTitle,
    description: announcement?.description,
    duration: announcement?.description ? READ_BOTH : READ_TITLE,
  }
}

/**
 * **Un rechazo de negocio no es una falla** (`CU-25`).
 *
 * «Sólo se anulan los comprobantes que carga el operador» es una respuesta, no
 * un error: el sistema funcionó y contestó que no. Mostrarlo como falla, con un
 * identificador de pedido al lado, le dice al operador que hay algo que
 * reportar cuando lo único que hay es una regla.
 *
 * **El `409` es el que el contrato usa para sus invariantes**, y de ahí sale la
 * distinción. Con una excepción, que ya estaba decidida: reusar una clave de
 * idempotencia con otro cuerpo también vuelve `409` y **sí es defecto nuestro**
 * (`CU-34`) — significa que la puerta ató mal la clave.
 */
const REUSED_KEY = 'IDEMPOTENCY_KEY_REUSE'

export function isBusinessRejection(failed: RequestFailed): boolean {
  return failed.status === 409 && failed.code !== REUSED_KEY
}

/**
 * El aviso de una acción que no salió.
 *
 * Se separa de la puerta **para poder probarlo**: qué tono lleva cada caso y
 * cuándo aparece el identificador no se ve fallar — un rechazo mostrado como
 * falla se lee perfectamente bien, y le enseña al operador a desconfiar.
 */
export function failureNotice(
  failed: RequestFailed | undefined,
  strings: {
    actionFailed: string
    actionRejected: string
    requestIdLabel: string
    serverUnreachable: string
  },
): Notice {
  /* Sin servidor no hay mensaje ni identificador: no llegó a haber pedido, así
     que el texto lo pone el marco (`CU-43`). */
  if (!failed) {
    return { tone: 'error', title: strings.actionFailed, description: strings.serverUnreachable }
  }

  /* El texto es del servidor: el contrato lo escribe en castellano y apto para
     mostrar, así que uno nuestro sería una segunda fuente. */
  if (isBusinessRejection(failed)) {
    /* **Sin identificador y se va sola**: no hay nada que reportar. */
    return {
      tone: 'warning',
      title: strings.actionRejected,
      description: failed.message,
      duration: 6000,
    }
  }

  /* **Sin `duration`**: lleva el identificador, y uno que se va solo mientras el
     operador busca con qué anotarlo no sirve de nada. */
  return {
    tone: 'error',
    title: strings.actionFailed,
    description: `${failed.message} · ${strings.requestIdLabel}: ${failed.requestId}`,
  }
}
