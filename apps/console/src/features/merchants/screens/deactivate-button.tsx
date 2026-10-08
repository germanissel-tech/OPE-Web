import { ActionButton, useAction } from '@ope/core'
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
 * **Sobre uno ya desactivado no se dibuja**: es terminal, y un botón que
 * repite lo que ya pasó se lee como si «ya está desactivado» fuera una regla
 * que la pantalla inventó cuando es la operación que ya no aplica.
 */
export function DeactivateButton({
  merchant,
  compact = false,
}: {
  readonly merchant: Merchant
  /** En una fila, **el alto del control es el alto de la fila** (`GR-66`). */
  readonly compact?: boolean
}) {
  const action = useAction(deactivateMerchant)

  if (merchant.status === 'deactivated') return null

  return (
    <ActionButton
      type="button"
      size={compact ? 'compact' : undefined}
      tone="danger"
      requires={deactivateMerchant.requires}
      disabled={action.running}
      /* **Se devuelve la promesa**: granito apaga el botón mientras el `onClick`
         no resuelva (`GR-68`). */
      onClick={() => action.run(merchant)}
    >
      {merchantsStrings.deactivate}
    </ActionButton>
  )
}
