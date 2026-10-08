import { defineFeature, outcome } from '@ope/core'
import { merchantScreen } from './screens/merchant-screen'
import { merchantsScreen } from './screens/merchants-screen'
import { newMerchantScreen } from './screens/new-merchant-screen'
import { rotateScreen } from './screens/rotate-screen'

/**
 * Lo que esta funcionalidad aporta.
 *
 * **Es el hola mundo de OPE-Console**: la primera colección real del backend,
 * con sus cuatro estados, el cursor, un alta y una acción de fila que exige
 * capacidad. Las pantallas del panel son la feature siguiente y se copian de
 * acá.
 *
 * Es lo que hace que la raíz de composición crezca **una línea por
 * funcionalidad y no una por pantalla** (`CU-36`): cada funcionalidad junta lo
 * suyo, y la raíz junta las funcionalidades.
 */
export const merchants = defineFeature({
  screens: [merchantsScreen, merchantScreen, newMerchantScreen, rotateScreen],

  /* A dónde cae un cerrar sin pila (`CU-47`): una ficha abierta por un enlace
     pegado no tiene escalón abajo, y cerrarla tiene que hacer algo. */
  root: merchantsScreen,

  /**
   * **Volver es un destino nombrado, no un paso atrás** (`CU-44`): una pila de
   * historia no sabe de permisos. La grilla emite `merchantChosen` y la ficha
   * `merchantClosed`; a dónde lleva cada uno lo dice `app/flows.ts` (`CU-47`).
   */
  outcomes: {
    merchantChosen: outcome<{ merchantId: string }>('merchants.merchantChosen'),
    merchantClosed: outcome<{ merchantId: string }>('merchants.merchantClosed'),

    /* El alta: la grilla pide una, la pantalla de alta termina con el merchant
       creado o se cancela. Qué pantalla es el alta y a dónde cae cada cosa lo
       dice el flujo, no la grilla. `from` dice desde dónde se pidió. */
    merchantRequested: outcome<{ from: string }>('merchants.merchantRequested'),
    merchantCreated: outcome<{ merchantId: string }>('merchants.merchantCreated'),
    newMerchantCancelled: outcome<{ from: string }>('merchants.newMerchantCancelled'),

    /* Rotar: la ficha pide la rotación de una clase, y la pantalla de rotación
       vuelve. Es pantalla y no diálogo (`GR-37`), así que es un desenlace. */
    rotationRequested: outcome<{ merchantId: string; kind: string }>('merchants.rotationRequested'),
    rotationClosed: outcome<{ merchantId: string }>('merchants.rotationClosed'),
  },
})
