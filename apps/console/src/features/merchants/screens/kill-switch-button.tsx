import { ActionButton, ConfirmDialog, useAction } from '@ope/core'
import { useState } from 'react'
import type { Merchant } from '../data/merchants'
import { setKillSwitch } from '../data/set-kill-switch'
import { merchantsStrings } from '../strings'

/**
 * Apagar o encender OPE para **un** merchant (01 §14.2), con confirmación.
 *
 * Es un sí/no con consecuencia, así que es un diálogo y no una pantalla
 * (`GR-37`): no hay error de negocio que explicar más que el `409`, que es un
 * aviso, y no devuelve nada que leer. La consecuencia de apagar se dice entera;
 * encender también confirma, para que el gesto sea el mismo.
 *
 * **Sobre un desactivado no se dibuja**: no tiene interruptor, y un botón que
 * sólo puede responder `409` no se ofrece.
 */
export function KillSwitchButton({
  merchant,
  onRejected,
}: {
  readonly merchant: Merchant
  /** Qué hace quien lo dibuja si el servidor dijo que no: volver a pedir lo que mostraba. */
  readonly onRejected?: () => void
}) {
  const [asking, setAsking] = useState(false)
  const action = useAction(setKillSwitch, {
    onDone: () => setAsking(false),
    onRejected: () => {
      setAsking(false)
      onRejected?.()
    },
  })

  if (merchant.status === 'deactivated') return null

  const turningOff = merchant.status === 'active'
  const { merchantId } = merchant

  return (
    <>
      <ActionButton
        type="button"
        tone={turningOff ? 'danger' : 'secondary'}
        requires={setKillSwitch.requires}
        disabled={action.running}
        /* Abrir la pregunta se puede repetir; la respuesta la cuida el diálogo (`GR-68`). */
        repeatable
        onClick={() => setAsking(true)}
      >
        {turningOff ? merchantsStrings.turnOff : merchantsStrings.turnOn}
      </ActionButton>
      <ConfirmDialog
        open={asking}
        title={
          turningOff
            ? merchantsStrings.turnOffTitle(merchantId)
            : merchantsStrings.turnOnTitle(merchantId)
        }
        consequence={
          turningOff ? merchantsStrings.turnOffConsequence : merchantsStrings.turnOnConsequence
        }
        confirmLabel={turningOff ? merchantsStrings.turnOff : merchantsStrings.turnOn}
        tone={turningOff ? 'danger' : 'primary'}
        running={action.running}
        onConfirm={() => action.run({ merchantId, enabled: !turningOff })}
        onClose={() => setAsking(false)}
      />
    </>
  )
}
