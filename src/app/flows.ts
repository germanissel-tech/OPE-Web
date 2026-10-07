import { closes, defineFlow, group, omits, opens } from '@cuarzo/core'
import { TAG } from '@granito/ui'
import { catalog } from '../features/catalog/feature'
import { articleScreen } from '../features/catalog/screens/article-screen'
import { articlesScreen } from '../features/catalog/screens/articles-screen'
import { editArticleScreen } from '../features/catalog/screens/edit-article-screen'
import { catalogStrings } from '../features/catalog/strings'
import { home } from '../features/home/feature'
import { aboutScreen } from '../features/home/screens/about-screen'
import { welcomeScreen } from '../features/home/screens/welcome-screen'

/**
 * **El mapa de cómo se atraviesa esta aplicación** (`CU-47`).
 *
 * Reemplaza a las aristas sueltas de `routing.ts`: acá hay recorridos con
 * nombre y con raíz, y **el flujo entero se lee en un lugar**.
 *
 * En un archivo y no en una carpeta con `index.ts`, que `CU-15` prohíbe.
 * Una aplicación con muchos flujos parte esto en archivos y arma la lista
 * acá mismo — lo que no puede tener es un barril.
 */

/**
 * **El recorrido del catálogo** (`CU-47`).
 *
 * Es el único ejemplo que viaja en el esqueleto, y el que hay que copiar. Tres
 * renglones dicen todo lo que hoy está repartido entre dos pantallas y un
 * archivo de rutas: **acá se lee el flujo entero**.
 */
export const catalogFlow = defineFlow({
  id: 'catalog',
  root: articlesScreen,
  steps: [
    /* Apila la ficha. Si ya estuviera en la pila —el mismo artículo—,
       desenrolla hasta ella en vez de duplicarla. */
    opens(catalog.outcomes.articleChosen, articleScreen, ({ id }) => ({ id })),

    /* Apila la edición sobre la ficha. **Cerrarla vuelve a la ficha**, no a la
       grilla: el operador estaba mirando ese artículo antes de editarlo. */
    opens(catalog.outcomes.articleEditRequested, editArticleScreen, ({ id }) => ({ id })),

    /* Desapila. Con la pila vacía —un enlace pegado a la ficha— cae a la raíz
       de la funcionalidad, que es esta grilla. */
    closes(catalog.outcomes.articleClosed),
  ],
})

/**
 * **Por dónde se entra** (`CU-47`).
 *
 * El paso al catálogo nombra **el flujo y no la pantalla**, y eso es lo que
 * dice que se abandona éste y empieza aquél. Nombrando la pantalla, el catálogo
 * quedaría apilado sobre el inicio y cerrarlo devolvería acá — que no es lo que
 * un ítem de menú significa.
 */
export const homeFlow = defineFlow({
  id: 'home',
  root: welcomeScreen,
  steps: [opens(home.outcomes.catalogRequested, catalogFlow)],
})

/**
 * **Las pantallas del marco** (`CU-47`).
 *
 * `about` no la abre ningún desenlace: la abre el menú de usuario, que es
 * marco y está afuera de la regla. Sin declararla en algún lado, la
 * comprobación de arranque la denunciaría como pantalla que nadie alcanza — y
 * tendría razón, porque no puede distinguirla de una que quedó huérfana.
 *
 * **Por eso la pertenencia se declara y no se infiere.** Cayendo sola a un
 * flujo de sistema, una pantalla que quedó sin su paso pasaría a estar bien
 * en silencio, que es exactamente lo que la comprobación 1 existe para agarrar.
 *
 * No va al menú: se llega desde el menú de usuario, que **apila sobre el flujo
 * activo** y no lo abandona.
 */
export const systemFlow = defineFlow({
  id: 'system',
  root: aboutScreen,
  steps: [
    /* **«Acerca de» es del `home`, y acá el `home` no ofrece su recorrido.**
       Parado en la ficha del esqueleto no hay botón que lleve al catálogo, y
       eso se dice — no se deja adivinar. Sin este renglón, el arranque no
       distingue esta decisión de un paso que alguien olvidó (`CU-47`). */
    omits(home.outcomes.catalogRequested),
  ],
})

/** Los que esta aplicación tiene. La lee el manifiesto. */
export const flows = [homeFlow, catalogFlow, systemFlow]

/**
 * **Lo que ofrece el menú lateral, en orden** (`CU-48`).
 *
 * Está en el menú **el que está acá**: `systemFlow` no figura, y por eso no se
 * ofrece — no hace falta que declare que no quiere.
 *
 * Un nivel: un grupo toma flujos, no grupos. Los iconos son opcionales en los
 * dos, y granito reserva el espacio igual.
 */
export const menu = [homeFlow, group(catalogStrings.catalogSection, [catalogFlow], TAG)]
