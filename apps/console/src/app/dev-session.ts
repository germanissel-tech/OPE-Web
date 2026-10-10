import type { Strings } from '@ope/core'
import type { SessionConfig } from '@ope/session'
import { createFakeSession } from '@ope/session/fake'
import { ADMIN_CAPABILITIES, READ_CAPABILITIES } from '../api/ope/identity'

/**
 * **La sesión de desarrollo, y sus datos de mentira.**
 *
 * Vive en su propio archivo y no en el punto de entrada por dos razones: se lee
 * de un vistazo que **esto no es configuración de la aplicación**, y se carga de
 * forma diferida, así que **no entra en el artefacto de producción** (`CU-36`).
 * Lo verifica `packages/core/checks/artifact.mjs` sobre la compilación.
 *
 * Los claims los arma la aplicación y no la falsa: qué capacidades existen lo
 * dice el módulo del contrato, y la falsa no tiene por qué conocerlo. Tienen
 * **la misma forma que los del bearer** (`operatorId`, `scope`) más
 * `capabilities`, que es lo que `identity.ts` lee para la falsa.
 */

/**
 * **Con qué capacidades se entra, para poder mirar la aplicación con menos.**
 *
 * `CU-3` dice que lo que un permiso no habilita no se muestra, y dice también
 * por qué eso se rompe sin que nadie lo note: *«el defecto no se ve con permisos
 * completos, que es como se mira una pantalla mientras se la escribe»*.
 *
 * **Se elige el papel y se vuelve a entrar**: las capacidades llegan con la
 * sesión, así que conceder o revocar una tiene efecto **con la sesión
 * siguiente** (`TAN-7`).
 */
const PAPELES = {
  todo: [...ADMIN_CAPABILITIES],
  lectura: [...READ_CAPABILITIES],
  ninguno: [],
} as const satisfies Record<string, readonly string[]>

type Papel = keyof typeof PAPELES

const RECUERDO = 'ope.dev.papel'
const EN_LA_URL = 'dev.papel'
/** `?dev.entrada=1` arranca en `anonymous`, para mirar la vista de ingreso sin backend. */
const CON_ENTRADA = 'dev.entrada'

const esPapel = (valor: string | null): valor is Papel => valor !== null && valor in PAPELES

/**
 * De la dirección, o de lo que se eligió la última vez.
 *
 * La dirección gana y **se recuerda**, así que se elige una vez y se sigue
 * navegando: `?dev.papel=lectura` y a partir de ahí toda la sesión es de
 * lectura, hasta que se elija otro.
 */
function papelElegido(): Papel {
  const pedido = new URLSearchParams(globalThis.location.search).get(EN_LA_URL)

  if (esPapel(pedido)) {
    globalThis.localStorage?.setItem(RECUERDO, pedido)
    return pedido
  }

  const recordado = globalThis.localStorage?.getItem(RECUERDO) ?? null
  return esPapel(recordado) ? recordado : 'todo'
}

/**
 * **La credencial de desarrollo, a la vista.**
 *
 * Es el token del operador de desarrollo de OPE-Backend (`config/dev-operators.json`
 * guarda su huella; el valor lo dice su `README`). Con `?dev.bearer=1` la vista
 * de ingreso la muestra en su explicación, para no tener que buscarla cada vez.
 *
 * Vive acá, en el módulo que no entra en el artefacto (`CU-36`), y por eso
 * mismo no hay que verificarla aparte: si esto viaja, viaja la falsa, y la
 * comprobación del artefacto ya falla por ella.
 */
export const DEV_BEARER = 'ope_dev_admin_token'

export function devBearerStrings(): Partial<Strings> {
  console.info(
    `[ope] ingreso con bearer contra el backend: la credencial de desarrollo es ${DEV_BEARER}`,
  )
  return {
    signInDetail: `En desarrollo, la credencial del operador de desarrollo del backend es ${DEV_BEARER}.`,
  }
}

export default function devSession(session: SessionConfig) {
  const papel = papelElegido()
  const conEntrada = new URLSearchParams(globalThis.location.search).has(CON_ENTRADA)

  /* **Se dice cuál está puesto y cómo cambiarlo.** Una forma de mirar la
     aplicación con menos permisos que hay que descubrir leyendo el código es una
     que no se usa nunca. */
  console.info(
    `[ope] sesión de desarrollo con el papel «${papel}»: ${PAPELES[papel].join(', ') || 'sin capacidades'}\n` +
      `      los otros: ${Object.keys(PAPELES).join(' · ')} — se eligen con ?${EN_LA_URL}=lectura · la vista de ingreso, con ?${CON_ENTRADA}=1`,
  )

  return createFakeSession({
    /* La traducción llega en la configuración: no se vuelve a armar acá. */
    toCapabilities: session.toCapabilities,
    noSession: conEntrada,
    claims: {
      sub: 'fake-operator',
      operatorId: 'fake-operator',
      name: 'Operador de desarrollo',
      scope: '*',
      capabilities: [...PAPELES[papel]],
    },
  })
}
