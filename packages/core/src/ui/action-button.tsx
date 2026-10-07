import { Button, type ButtonProps, IconButton, type IconButtonProps } from '@granito/ui'
import type { ReactNode } from 'react'
import type { Reachable } from '../base/registry'
import { useCapabilities } from '../base/routes'
import { isEnabled } from '../data/action'

/**
 * **El botón se deriva de la acción** (`CU-37`, `CU-3`).
 *
 * Si la sesión no la habilita, **no se dibuja**. Con eso `CU-3` deja de
 * depender de que alguien se acuerde de envolver cada botón en un `if`, que es
 * el olvido que produce la interfaz ofreciendo lo que la API rechaza.
 *
 * **Son tres clases y se confunden siempre**, porque las tres terminan en un
 * botón que no se puede apretar. Cuál es cuál está en `CU-46`, y granito llegó
 * a la misma tabla por su lado (`GR-64`).
 *
 * Acá se resuelve **la del permiso**, que es la única que no se dibuja. Las
 * otras dos las pone quien lo usa, con `disabled` — y con `disabledReason`
 * cuando hay un motivo que el operador no puede adivinar.
 */
export type ActionButtonProps = Omit<ButtonProps, 'children'> &
  Reachable & {
    readonly children: ReactNode
  }

export function ActionButton({ requires, offered, children, ...props }: ActionButtonProps) {
  const capabilities = useCapabilities()

  /* **Dos razones distintas para no estar**, y las dos terminan igual acá.
     `offered: false` es del flujo —acá esta acción no se ofrece (`CU-47`)—; la
     capacidad es de la sesión. Confundirlas haría que un permiso de más
     resucitara un control que el recorrido no tiene. */
  if (offered === false) return null
  if (!isEnabled({ requires }, capabilities)) return null

  return <Button {...props}>{children}</Button>
}

/**
 * Lo mismo, con un icono.
 *
 * Existe porque **en una fila un verbo repetido veinte veces es ruido**, y
 * granito ya lo dice: cuando la acción tiene dibujo propio, un icono dice lo
 * mismo sin repetir la palabra. Lo que no cambia es la garantía: **si la sesión
 * no lo habilita, no se dibuja**.
 *
 * Su `label` no es decoración: es cómo lo nombra un lector de pantalla, y lo que
 * muestra el globo.
 */
export type ActionIconButtonProps = IconButtonProps & Reachable

export function ActionIconButton({ requires, offered, ...props }: ActionIconButtonProps) {
  const capabilities = useCapabilities()

  if (offered === false) return null
  if (!isEnabled({ requires }, capabilities)) return null

  return <IconButton {...props} />
}
