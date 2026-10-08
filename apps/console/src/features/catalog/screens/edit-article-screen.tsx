import { Block, Button, Region, Page as Sheet } from '@granito/ui'
import {
  ConflictDialog,
  defineScreen,
  Result,
  useAction,
  useForm,
  useLoadedOnce,
  useOutcome,
  useScreenParams,
} from '@ope/core'
import { type Article, useArticle, useRereadArticle } from '../data/articles'
import { articleConstraints, discountFitsInPrice } from '../data/create-article'
import { updateArticle } from '../data/update-article'
import { catalog } from '../feature'
import { catalogStrings } from '../strings'
import { ArticleFields, type ArticleValues } from './article-fields'

/**
 * **Lo que entra en la comparación** (`CU-29`).
 *
 * Son los cuatro campos del formulario **más `active`**, que el formulario no
 * edita y la escritura manda igual. Un campo que la escritura manda y la
 * comparación no mira es invisible: no produce choque, así que se guarda callado
 * y el reintento lo pisa con el valor que se leyó al abrir. Una desactivación
 * ajena se revierte sola.
 *
 * Por eso la regla no es «lo que el formulario toca» sino **lo que la escritura
 * manda**: todo lo que va en el cuerpo se puede pisar.
 */
type Compared = ArticleValues & { readonly active: boolean }

/**
 * Un artículo, con la forma que tiene en el formulario.
 *
 * **Una sola conversión para los tres usos** —los valores iniciales, la
 * referencia para comparar, y la relectura—: con dos, la comparación compararía
 * un número contra su texto y daría choques inventados.
 */
function comoFormulario(article: Article): ArticleValues {
  return {
    name: article.name,
    price: article.price,
    discountedPrice: article.discountedPrice ?? '',
    stock: article.stock === undefined ? '' : String(article.stock),
  }
}

/** El artículo entero, con la forma que compara la puerta. */
function comoRegistro(article: Article): Compared {
  return { ...comoFormulario(article), active: article.active }
}

/**
 * Lo que la puerta fusionó, **leído campo por campo y no afirmado**.
 *
 * La fusión vuelve como un registro sin forma —la puerta es de las cuatro
 * aplicaciones y no sabe qué cuerpo tiene ésta—, así que acá hay que convertir.
 * Un `as` diría que ya tiene esta forma sin mirarla, y el día que la comparación
 * deje de declarar un campo seguiría diciendo que está.
 *
 * Y `active` se exige en vez de completarse: **con una omisión, dejar de
 * compararlo desactivaría artículos en silencio**, que es la peor manera posible
 * de enterarse.
 */
function comoFusionado(values: Readonly<Record<string, unknown>>): Compared {
  if (typeof values.active !== 'boolean') {
    throw new Error('La fusión volvió sin `active`: la comparación dejó de declararlo.')
  }

  return {
    name: String(values.name ?? ''),
    price: String(values.price ?? ''),
    discountedPrice: String(values.discountedPrice ?? ''),
    stock: String(values.stock ?? ''),
    active: values.active,
  }
}

/**
 * El cuerpo de la escritura, **armado una sola vez para los dos caminos**.
 *
 * Con dos armadas —una en el guardado y otra en el reintento— alcanza con que
 * una tome un campo del formulario en vez de la fusión para que ese campo vuelva
 * a pisar al otro operador. Un solo lugar no puede quedar a medias.
 */
function cuerpo(values: Compared) {
  return {
    name: values.name,
    price: values.price,
    discountedPrice: values.discountedPrice || undefined,
    stock: values.stock === '' ? undefined : Number(values.stock),
    active: values.active,
  }
}

/**
 * **Cómo se llama cada campo para el operador** (`CU-43`).
 *
 * Es un registro sobre `Compared` y no un `if`: agregar un campo a la
 * comparación **sin rótulo no compila**. Con un ternario sobre `price`, todo lo
 * demás cae en la rama que sobra, y un choque de stock sale bajo el título
 * «Nombre» — diciéndole al operador que el nombre pasó de `10` a `99`.
 */
const articleLabels: Record<keyof Compared, string> = {
  name: catalogStrings.name,
  price: catalogStrings.price,
  discountedPrice: catalogStrings.discountedPrice,
  stock: catalogStrings.stock,
  active: catalogStrings.status,
}

/**
 * **El formulario, montado recién cuando el artículo llegó.**
 *
 * Está separado por una razón concreta y no por prolijidad: `useForm` toma sus
 * valores iniciales **una sola vez**, en el primer dibujo. Con el formulario
 * adentro de la pantalla, ese primer dibujo ocurre mientras el artículo todavía
 * viaja, así que los campos nacen vacíos **y se quedan vacíos** aunque el
 * registro llegue un instante después.
 *
 * Lo encontró el punto de control: la pantalla cargaba, el título mostraba el
 * artículo, y los cuatro campos estaban en blanco. Ninguna prueba lo vio, porque
 * ninguna prueba espera medio segundo.
 *
 * Un componente aparte se monta **con el dato ya en la mano**, así que no hay
 * instante en que los valores iniciales sean los equivocados.
 */
function ArticleForm({ article }: { readonly article: Article }) {
  const { id } = useScreenParams(editArticleScreen)
  const { emit } = useOutcome()
  const reread = useRereadArticle()

  /* **La referencia y el testigo, congelados al montar** (`CU-29`). Leídos de la
     consulta viva se corren solos, y por qué eso saltea la protección entera
     está en `useLoadedOnce`, que es donde se puede verificar.

     **El testigo va vacío**: OPE no emite `ETag` y el núcleo ya no lo lee del
     sobre. La ruta de `CU-29` queda dormida; el hola mundo se retira en el
     tramo 5 de la 005. */
  const original = useLoadedOnce({
    values: comoRegistro(article),
    version: '',
  })

  /**
   * Lo que el operador tiene ahora, con la forma que se compara.
   *
   * Se declara como función y no como valor porque **la puerta la llama cuando
   * llega el rechazo**: leída antes, sería la de un render anterior. Y estar
   * declarada acá —izada— es lo que deja que la puerta se construya antes que el
   * formulario, que es lo que hace falta para poder pasarle `action.fields`.
   */
  function enPantalla(): Compared {
    return {
      name: form.values.name.trim(),
      price: form.values.price.trim(),
      discountedPrice: form.values.discountedPrice.trim(),
      stock: form.values.stock.trim(),
      /* El formulario no lo toca, así que nunca difiere de la referencia y nunca
         choca. Entra para que la fusión conserve el del servidor. */
      active: original.values.active,
    }
  }

  const action = useAction(updateArticle, {
    onDone: () => emit(catalog.outcomes.articleClosed({ id })),
    concurrency: {
      loaded: original.values,
      onScreen: enPantalla,
      /**
       * **Cómo se rearma el intento con lo fusionado.**
       *
       * La puerta calcula qué mandar —lo del servidor con lo que el operador
       * cambió encima— y no sabe con qué forma: el cuerpo es del contrato. Acá
       * se convierte en la entrada de la acción.
       *
       * Los campos que el operador no tocó **salen de la fusión**, no del
       * formulario: son del otro, y mandarlos con lo que quedó cargado se los
       * borra sin que nadie se entere.
       */
      retryWith: (values, version) => ({
        articleId: Number(id),
        body: cuerpo(comoFusionado(values)),
        version,
      }),
      reread: async () => {
        const fresh = await reread(Number(id))

        /* Sin testigo del transporte (OPE no emite `ETag`), la relectura
           devuelve el registro con la versión vacía. La puerta nunca llega acá
           hoy: ningún problema del catálogo despierta `stale-version`. */
        return { values: comoRegistro(fresh), version: '' }
      },
    },
  })

  const form = useForm<ArticleValues>(
    comoFormulario(article),
    articleConstraints,
    catalogStrings.shape,
    /* **Lo que el servidor rechazó, campo por campo.** Sin esto, un rechazo de
       validación al editar no se veía en ningún lado: la puerta calla a
       propósito cuando vienen campos —«el formulario los muestra donde se
       corrigen»— y el formulario no los estaba recibiendo. */
    action.fields,
  )

  const invariant = discountFitsInPrice.holds(form.values)
    ? undefined
    : discountFitsInPrice.explains

  const save = () => {
    if (!form.attempt()) return

    return action.run({
      articleId: Number(id),
      body: cuerpo(enPantalla()),
      /* **El testigo de la versión que se leyó**, el de al abrir. Sin esto no
         compila, y es lo que hace que el servidor pueda rechazar en vez de
         dejar pisar. */
      version: original.version,
    })
  }

  return (
    <>
      <Block>
        <ArticleFields form={form} />
        <Button
          onClick={save}
          disabled={action.running || invariant !== undefined}
          disabledReason={invariant}
        >
          {catalogStrings.save}
        </Button>
      </Block>

      {/* **Los rótulos son de esta pantalla**: `price` es el nombre del contrato
          y no cómo se llama para el operador (`CU-43`). */}
      <ConflictDialog
        clash={action.clash}
        onClose={action.dismissClash}
        labelOf={(field) => articleLabels[field as keyof Compared] ?? field}
      />
    </>
  )
}

/**
 * **La edición, y el primer caso real de `CU-29`.**
 *
 * ## Por qué es una región y no un diálogo
 *
 * Editar exige **haber leído el registro**: el testigo sale de esa lectura y sin
 * él la escritura no compila. Y `GR-42` fija que **un diálogo no espera un dato
 * del servidor** — abrirlo vacío y llenarlo cuando llegue es exactamente lo que
 * prohíbe.
 *
 * Es la entrada 3 de la deuda, y la forma la eligió `granito#PED-8`: una región
 * de la misma página, con la grilla a la vista.
 */
function EditArticleScreen() {
  const { id } = useScreenParams(editArticleScreen)
  const article = useArticle(Number(id))

  return (
    <Sheet title={catalogStrings.editArticle} context={id}>
      <Region>
        {/* Los cuatro estados. El vacío **no se parte en dos** acá y está bien:
            un `GET` individual no tiene «los filtros no dan resultados», tiene
            «no existe». */}
        <Result
          query={article}
          empty={{ title: catalogStrings.articleNotFound }}
          noMatches={{ title: catalogStrings.articleNotFound }}
          filtered={false}
          isEmpty={(loaded) => loaded === undefined}
        >
          {(loaded) => <ArticleForm article={loaded} />}
        </Result>
      </Region>
    </Sheet>
  )
}

export const editArticleScreen = defineScreen({
  id: 'editArticle',
  title: catalogStrings.editArticle,
  path: '/catalog/:id/edit',
  component: EditArticleScreen,
  capability: 'catalog:write',
})
