import { TAG } from '@granito/ui'
import { closes, defineFlow, group, omits, opens } from '@ope/core'
import { home } from '../features/home/feature'
import { aboutScreen } from '../features/home/screens/about-screen'
import { welcomeScreen } from '../features/home/screens/welcome-screen'
import { merchants } from '../features/merchants/feature'
import { merchantScreen } from '../features/merchants/screens/merchant-screen'
import { merchantsScreen } from '../features/merchants/screens/merchants-screen'
import { merchantsStrings } from '../features/merchants/strings'

/**
 * **El mapa de cómo se atraviesa esta aplicación** (`CU-47`).
 *
 * Acá hay recorridos con nombre y con raíz, y **el flujo entero se lee en un
 * lugar**. En un archivo y no en una carpeta con `index.ts`, que `CU-15`
 * prohíbe.
 */

/**
 * **El recorrido de los merchants** (`CU-47`).
 *
 * Dos renglones dicen todo lo que de otro modo estaría repartido entre dos
 * pantallas y un archivo de rutas: la grilla abre la ficha, y la ficha vuelve.
 */
export const merchantsFlow = defineFlow({
  id: 'merchants',
  root: merchantsScreen,
  steps: [
    /* Apila la ficha. Si ya estuviera en la pila —el mismo merchant—,
       desenrolla hasta ella en vez de duplicarla. */
    opens(merchants.outcomes.merchantChosen, merchantScreen, ({ merchantId }) => ({ merchantId })),

    /* Desapila. Con la pila vacía —un enlace pegado a la ficha— cae a la raíz
       de la funcionalidad, que es la grilla. */
    closes(merchants.outcomes.merchantClosed),
  ],
})

/**
 * **Por dónde se entra** (`CU-47`).
 *
 * El paso a los merchants nombra **el flujo y no la pantalla**: se abandona
 * éste y empieza aquél. Nombrando la pantalla, la grilla quedaría apilada sobre
 * el inicio y cerrarla devolvería acá — que no es lo que un ítem de menú
 * significa.
 */
export const homeFlow = defineFlow({
  id: 'home',
  root: welcomeScreen,
  steps: [opens(home.outcomes.merchantsRequested, merchantsFlow)],
})

/**
 * **Las pantallas del marco** (`CU-47`).
 *
 * `about` la abre el menú de usuario, que apila sobre el flujo activo y no lo
 * abandona. Sin declararla en algún lado, el arranque la denunciaría como
 * pantalla que nadie alcanza — y tendría razón.
 */
export const systemFlow = defineFlow({
  id: 'system',
  root: aboutScreen,
  steps: [
    /* «Acerca de» es del `home`, y acá el `home` no ofrece su recorrido: se
       dice, para que el arranque no lo confunda con un paso olvidado. */
    omits(home.outcomes.merchantsRequested),
  ],
})

/** Los que esta aplicación tiene. La lee el manifiesto. */
export const flows = [homeFlow, merchantsFlow, systemFlow]

/**
 * **Lo que ofrece el menú lateral, en orden** (`CU-48`).
 *
 * Está en el menú **el que está acá**: `systemFlow` no figura, y por eso no se
 * ofrece. Un nivel: un grupo toma flujos, no grupos.
 */
export const menu = [homeFlow, group(merchantsStrings.merchantsSection, [merchantsFlow], TAG)]
