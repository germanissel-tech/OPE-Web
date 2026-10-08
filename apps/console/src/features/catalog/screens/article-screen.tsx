import { Block, Button, Field, Page, Region, TextInput } from '@granito/ui'
import { ActionButton, defineScreen, useOutcome, useScreenParams, useUnsavedWork } from '@ope/core'
import { useState } from 'react'
import { updateArticle } from '../data/update-article'
import { catalog } from '../feature'
import { catalogStrings } from '../strings'

/**
 * **Es el hola mundo de cuarzo, no una funcionalidad.** Se borra cuando la
 * aplicación escribe su primera pantalla propia — ver el `README.md` de
 * `features/`.
 *
 * El formulario, alcanzado desde la grilla con `goTo` **tipado** (`CU-41`).
 *
 * No tiene entrada de menú a propósito: su ruta lleva parámetro, y una entrada
 * de menú no tendría con qué completarlo.
 */
function ArticleScreen() {
  const { id } = useScreenParams(articleScreen)
  const { emit } = useOutcome()
  const [note, setNote] = useState('')

  /**
   * **Lo único que esta pantalla dice del asunto: si tiene algo escrito**
   * (`CU-47`).
   *
   * No sabe qué es abandonar, ni quién pregunta, ni con qué diálogo. Es un
   * renglón, y olvidarlo es un renglón que falta — no una lógica mal hecha.
   */
  useUnsavedWork(note !== '')

  return (
    <Page title={catalogStrings.article} context={id}>
      <Region>
        <Block>
          <p>{catalogStrings.reachedWith(id)}</p>

          {/* Un campo cualquiera, para que el hola mundo muestre el aviso. */}
          <Field label={catalogStrings.note} size="medium">
            {(props) => (
              <TextInput
                {...props}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            )}
          </Field>

          {/* **Volver es un control, no un gesto.** El menú y el botón atrás del
              navegador siguen andando, pero ninguno de los dos es de esta
              pantalla — y el del navegador es una pila, que no sabe de permisos.

              Lo que sabe la ficha es **que terminó**; a dónde lleva eso lo decide
              el paso del flujo activo (`CU-47`). */}
          {/* **Dos desenlaces, y la ficha no sabe a dónde lleva ninguno**: el
              flujo lo decide (`CU-47`). Editar apila; volver desapila. */}
          <ActionButton
            requires={updateArticle.requires}
            onClick={() => emit(catalog.outcomes.articleEditRequested({ id }))}
          >
            {catalogStrings.edit}
          </ActionButton>

          <Button onClick={() => emit(catalog.outcomes.articleClosed({ id }))}>
            {catalogStrings.backToCatalog}
          </Button>
        </Block>
      </Region>
    </Page>
  )
}

export const articleScreen = defineScreen({
  id: 'article',
  title: catalogStrings.article,
  path: '/catalog/:id',
  /* No hay con qué completar la URL en el menú: se llega desde la grilla. */
  capability: 'catalog:read',
  component: ArticleScreen,
})
