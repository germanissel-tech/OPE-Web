import type { Notice } from '../base/notices'
import type { Announcement } from './action'
import type { FieldError, RequestFailed } from './envelope'

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
 * «El merchant está desactivado» es una respuesta, no un error: el sistema
 * funcionó y contestó que no. Mostrarlo como falla, con un identificador de
 * pedido al lado, le dice al operador que hay algo que reportar cuando lo único
 * que hay es una regla.
 *
 * **El `422` y el `409` son los que OPE usa para sus invariantes**, y de ahí
 * sale la distinción: `origin-already-registered` es `422`;
 * `merchant-deactivated`, `configuration-frozen` e `idempotency-conflict` —que
 * en OPE es «mismo cuerpo, otro contenido», un rechazo y no una clave mal
 * atada— son `409`. Ninguno es defecto nuestro: ésos son los `403`, y los
 * reconoce la puerta por su `type`.
 */
export function isBusinessRejection(failed: RequestFailed): boolean {
  return failed.status === 422 || failed.status === 409
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
    noRequestId: string
    serverUnreachable: string
  },
  /**
   * Las violaciones que **no son de ningún campo** —un puntero bajo `/query` o
   * `/headers`— y que por eso no tienen dónde dibujarse. Se dicen acá, con su
   * puntero, en vez de perderse: un rechazo que no se ve en ningún lado es el
   * modo de falla que `CU-49` nombra.
   */
  offForm: readonly FieldError[] = [],
): Notice {
  /* Sin servidor no hay mensaje ni identificador: no llegó a haber pedido, así
     que el texto lo pone el marco (`CU-43`). */
  if (!failed) {
    return { tone: 'error', title: strings.actionFailed, description: strings.serverUnreachable }
  }

  const violations = offForm.map((each) => `${each.pointer}: ${each.message}`)
  const said = [failed.message, ...violations].join(' · ')

  /* El texto es del servidor: el contrato lo escribe apto para mostrar, así que
     uno nuestro sería una segunda fuente. */
  if (isBusinessRejection(failed)) {
    /* **Sin identificador y se va sola**: no hay nada que reportar. */
    return {
      tone: 'warning',
      title: strings.actionRejected,
      description: said,
      duration: 6000,
    }
  }

  /* **Sin `duration`**: lleva el identificador, y uno que se va solo mientras el
     operador busca con qué anotarlo no sirve de nada. Y si el identificador no
     vino, **se dice que no vino**: un hueco se lee como un olvido nuestro, y un
     texto inventado se cita como si sirviera. */
  return {
    tone: 'error',
    title: strings.actionFailed,
    description: `${said} · ${strings.requestIdLabel}: ${failed.requestId ?? strings.noRequestId}`,
  }
}
