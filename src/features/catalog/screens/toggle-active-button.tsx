import { ActionButton, useAction } from '@cuarzo/core'
import type { Article } from '../data/articles'
import { toggleArticleActive } from '../data/toggle-active'
import { catalogStrings } from '../strings'

/**
 * El interruptor de **una** fila (`CU-46`).
 *
 * **Es un componente y no un `useAction` de la pantalla llamado con la fila.**
 * Parece lo mismo y no lo es: con uno solo para toda la grilla, `running` es de
 * la pantalla —ejecutar una fila apaga las veinte— y la clave de idempotencia
 * recuerda un solo cuerpo. Acá cada instancia trae lo suyo, que es lo que React
 * ya resuelve por alcance.
 *
 * **El rótulo sale del dato, no de una regla escrita acá.** Un botón fijo que se
 * apaga cuando no aplica deja media grilla con un control muerto — y peor, se
 * lee como si «ya está desactivado» fuera una regla de negocio cuando es la
 * operación inversa que falta.
 */
export function ToggleActiveButton({ article }: { readonly article: Article }) {
  const action = useAction(toggleArticleActive)

  return (
    <ActionButton
      /* En una fila, **el alto del control es el alto de la fila** (`GR-66`). */
      size="compact"
      requires={toggleArticleActive.requires}
      disabled={action.running}
      /* **Se devuelve la promesa**: granito apaga el botón mientras el `onClick`
         no resuelva (`GR-68`), así que con esto queda apagado hasta que el
         servidor conteste y no sólo la ventana del gesto. */
      onClick={() => action.run(article)}
    >
      {article.active ? catalogStrings.deactivate : catalogStrings.activate}
    </ActionButton>
  )
}
