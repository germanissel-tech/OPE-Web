import { createContext, useContext } from 'react'
import { Failure } from './failure'

/**
 * **El puerto de los avisos** (`CU-25`).
 *
 * Un aviso no pertenece a ninguna pantalla: una acción sale bien y hay que
 * decirlo, pero para entonces el operador puede haber navegado a otro lado. Si
 * viviera en la pantalla que lo disparó, se iría con ella.
 *
 * **Acá está sólo el puerto.** Quién lo dibuja es interfaz, y qué texto lleva
 * cada caso es de la puerta de acciones — las tres cosas vivían juntas y eso
 * obligaba a `data` a mirar hacia `ui`, que es la dirección que `CU-40`
 * prohíbe.
 */

/**
 * El tono, con los mismos cuatro nombres que usa granito.
 *
 * **Se declara acá y no se importa de allá**: un puerto que nombra a quien lo
 * va a dibujar deja de ser un puerto. Que coincidan lo verifica el compilador
 * donde se conectan, que es un solo lugar.
 */
export type NoticeTone = 'info' | 'success' | 'warning' | 'error'

export type Notice = {
  readonly tone: NoticeTone
  readonly title: string
  /**
   * Cuánto se queda. **Sin esto no se va sola**, y eso es deliberado en un
   * caso: granito lo dejó escrito — *un aviso que informa puede irse; uno que
   * trae un `requestId` para pedir ayuda no, porque el operador necesita poder
   * copiarlo*.
   */
  readonly duration?: number
  readonly description?: string
}

export type NoticesPort = {
  readonly notify: (notice: Notice) => void
}

export const NoticesContext = createContext<NoticesPort | null>(null)

/**
 * Lo que una acción usa para avisar.
 *
 * **Quien dispara una acción no avisa**: eso lo hace la puerta. Una pantalla que
 * escriba su propio aviso de «guardado» está reimplementando lo que `CU-25` puso
 * en un solo lugar.
 */
export function useNotices(): NoticesPort {
  const port = useContext(NoticesContext)
  if (!port) {
    throw new Failure(
      'wiring.outsideProvider',
      'useNotices() fuera de NoticesProvider. Los avisos los provee la raíz de composición.',
    )
  }
  return port
}
