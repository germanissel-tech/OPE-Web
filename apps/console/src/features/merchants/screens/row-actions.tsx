import { EYE } from '@granito/ui'
import { ActionIconButton, useFlow, useOutcome } from '@ope/core'
import type { Merchant } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'
import { DeactivateButton } from './deactivate-button'

/**
 * Lo que se puede hacer con **una** fila.
 *
 * **Abrir la ficha es un control visible y no sólo el doble clic** (`CU-3`,
 * `granito#PED-9`): una acción visible se puede ocultar por capacidad y un
 * gesto no. El doble clic se queda como atajo; lo que no puede ser es el único
 * camino.
 */
export function RowActions({ merchant }: { readonly merchant: Merchant }) {
  const { emit } = useOutcome()
  const flow = useFlow()

  return (
    <>
      {/* **Esta fila no sabe a dónde lleva.** Informa qué pasó, y qué exige
          llegar allá se lo pregunta al flujo (`CU-47`, `CU-3`). */}
      <ActionIconButton
        {...flow.toReach(merchants.outcomes.merchantChosen)}
        icon={EYE}
        label={merchantsStrings.openMerchant}
        onClick={() => emit(merchants.outcomes.merchantChosen({ merchantId: merchant.merchantId }))}
      />
      <DeactivateButton merchant={merchant} compact />
    </>
  )
}
