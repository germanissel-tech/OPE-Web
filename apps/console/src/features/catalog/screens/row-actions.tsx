import { EYE } from '@granito/ui'
import { ActionIconButton, useFlow, useOutcome } from '@ope/core'
import type { Article } from '../data/articles'
import { catalog } from '../feature'
import { catalogStrings } from '../strings'
import { ToggleActiveButton } from './toggle-active-button'

/**
 * Lo que se puede hacer con **una** fila.
 *
 * **Abrir la ficha es un control visible y no sólo el doble clic** (`CU-3`,
 * `granito#PED-9`). La razón no es que el gesto no se descubra —que también—:
 * **una acción visible se puede ocultar por capacidad y un gesto no.** El doble
 * clic navega igual para cualquiera, así que el día que llegar a la ficha
 * dependa de un permiso, el gesto lleva a un callejón sin cartel.
 *
 * El doble clic **se queda**: es un atajo real para quien opera la grilla ocho
 * horas por día. Lo que no puede ser es el único camino.
 *
 * Va con icono y no con la palabra porque **en una fila un verbo repetido veinte
 * veces es ruido**, y ver un registro tiene dibujo convencional. Su `label` no es
 * decoración: es cómo lo nombra un lector de pantalla.
 */
export function RowActions({ article }: { readonly article: Article }) {
  const { emit } = useOutcome()
  const flow = useFlow()

  return (
    <>
      {/* **Esta fila no sabe a dónde lleva.** Informa qué pasó, y qué exige
          llegar allá se lo pregunta al flujo — que es lo que deja la misma
          grilla sirviendo en dos recorridos distintos (`CU-47`, `CU-3`). */}
      <ActionIconButton
        {...flow.toReach(catalog.outcomes.articleChosen)}
        icon={EYE}
        label={catalogStrings.openArticle}
        onClick={() => emit(catalog.outcomes.articleChosen({ id: String(article.id) }))}
      />
      <ToggleActiveButton article={article} />
    </>
  )
}
