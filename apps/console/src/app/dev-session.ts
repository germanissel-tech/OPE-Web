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
 * dice el módulo del contrato, y la falsa no tiene por qué conocerlo.
 */

/**
 * **Con qué capacidades se entra, para poder mirar la aplicación con menos.**
 *
 * `CU-3` dice que lo que un permiso no habilita no se muestra, y dice también
 * por qué eso se rompe sin que nadie lo note: *«el defecto no se ve con permisos
 * completos, que es como se mira una pantalla mientras se la escribe»*. Con una
 * sesión falsa que concede todo, esa advertencia se cumplía sobre sí misma —
 * había que editar este archivo para ver el otro caso, así que no lo veía nadie.
 *
 * **Se elige el papel y se vuelve a entrar**, y eso no es una limitación: es lo
 * que pasa de verdad. Las capacidades llegan con la sesión, así que conceder o
 * revocar una tiene efecto **con la sesión siguiente** (`TAN-7`). Un cambiador
 * que las alterara en vivo mostraría algo que en producción no puede pasar.
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
      sub: 'fake-1',
      name: 'Ana Operadora',
      preferred_username: 'aoperadora',
      capabilities: [...PAPELES[papel]],
    },
  })
}
