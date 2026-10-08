import { ActionButton, ConfirmDialog, useAction } from '@ope/core'
import { useState } from 'react'
import { deactivateMerchant } from '../data/deactivate-merchant'
import type { Merchant } from '../data/merchants'
import { merchantsStrings } from '../strings'

/**
 * Desactivar **un** merchant (`CU-46`).
 *
 * **Es un componente y no un `useAction` de la pantalla llamado con la fila.**
 * Con uno solo para toda la grilla, `running` es de la pantalla —ejecutar una
 * fila apaga las veinte—. Acá cada instancia trae lo suyo.
 *
 * **Pide confirmación con la consecuencia dicha** (`GR-37`): es terminal, y lo
 * que no se puede deshacer no se dispara con un clic que pudo ser para la fila
 * de al lado. El diálogo se cierra cuando la acción terminó bien; si el
 * servidor dijo que no, queda abierto con el aviso a la vista.
 *
 * **Sobre uno ya desactivado no se dibuja**: un botón que repite lo que ya pasó
 * se lee como si «ya está desactivado» fuera una regla que la pantalla inventó
 * cuando es la operación que ya no aplica.
 */
export function DeactivateButton({
  merchant,
  compact = false,
  onRejected,
}: {
  readonly merchant: Merchant
  /** En una fila, **el alto del control es el alto de la fila** (`GR-66`). */
  readonly compact?: boolean
  /** Qué hace quien lo dibuja si el servidor dijo que no: volver a pedir lo que mostraba. */
  readonly onRejected?: () => void
}) {
  const [asking, setAsking] = useState(false)
  const action = useAction(deactivateMerchant, {
    onDone: () => setAsking(false),
    onRejected: () => {
      setAsking(false)
      onRejected?.()
    },
  })

  if (merchant.status === 'deactivated') return null

  return (
    <>
      <ActionButton
        type="button"
        size={compact ? 'compact' : undefined}
        tone="danger"
        requires={deactivateMerchant.requires}
        disabled={action.running}
        /* Abrir la pregunta se puede repetir: lo que no se repite es la
           respuesta, y eso lo cuida el diálogo (`GR-68`). */
        repeatable
        onClick={() => setAsking(true)}
      >
        {merchantsStrings.deactivate}
      </ActionButton>
      <ConfirmDialog
        open={asking}
        title={merchantsStrings.deactivateTitle(merchant.merchantId)}
        consequence={merchantsStrings.deactivateConsequence}
        confirmLabel={merchantsStrings.deactivate}
        tone="danger"
        running={action.running}
        onConfirm={() => action.run(merchant)}
        onClose={() => setAsking(false)}
      />
    </>
  )
}
