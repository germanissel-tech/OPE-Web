import { Dialog } from '@granito/ui'
import type { ReactNode } from 'react'
import { useStrings } from '../base/use-strings'

/**
 * **Una pregunta de sí o no con consecuencia** (`GR-37`, `GR-65`).
 *
 * Es el diálogo de granito con tres cosas fijadas que una pantalla olvidaría
 * en la tercera vez que lo arma: **la consecuencia es obligatoria** (el título
 * dice qué se va a hacer; la descripción, qué pasa después, y un «¿Seguro?» no
 * dice nada), **el confirmar se apaga mientras corre y dice por qué**, y los
 * dos botones tienen el texto del marco cuando la aplicación no da otro.
 *
 * No sabe qué confirma: recibe textos y una función. Lo que pasa al confirmar
 * —correr una acción, cerrar— es de quien lo abre, y cerrar también: un
 * diálogo que se cierra solo al confirmar se cierra también cuando lo que
 * confirmó falló, y el operador pierde la explicación.
 */
export type ConfirmDialogProps = {
  readonly open: boolean
  readonly title: string
  /** Qué pasa si confirma, dicho para quien decide. */
  readonly consequence: ReactNode
  /** El verbo de la consecuencia: «Apagar», «Desactivar»; no «Aceptar». */
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly tone?: 'primary' | 'danger'
  /** Mientras lo confirmado corre: el botón se apaga con su razón (`GR-65`). */
  readonly running?: boolean
  readonly onConfirm: () => unknown
  readonly onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  consequence,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  running = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const strings = useStrings()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={consequence}
      answers="yes-no"
      tone={tone}
      confirmLabel={confirmLabel ?? strings.confirm}
      cancelLabel={cancelLabel ?? strings.cancel}
      onConfirm={() => void onConfirm()}
      confirmDisabled={running}
      confirmDisabledReason={running ? strings.waiting : undefined}
    />
  )
}
