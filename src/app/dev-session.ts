import type { BaseConfig } from '@cuarzo/core'
import type { SessionConfig } from '@cuarzo/session'
import { createFakeSession } from '@cuarzo/session/fake'

/**
 * **La sesión de desarrollo, y sus datos de mentira.**
 *
 * Vive en su propio archivo y no en el punto de entrada por dos razones: se lee
 * de un vistazo que **esto no es configuración de la aplicación**, y se carga de
 * forma diferida, así que **no entra en el artefacto de producción** (`CU-36`).
 * Lo verifica `packages/core/checks/artifact.mjs` sobre la compilación.
 *
 * Los claims los arma la aplicación y no la falsa: el `clientId` es de acá, y la
 * falsa no tiene por qué conocerlo.
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
 * que pasa de verdad. Las capacidades llegan en el token, así que conceder o
 * revocar una tiene efecto **con la sesión siguiente** (`TAN-7`). Un cambiador
 * que las alterara en vivo mostraría algo que en producción no puede pasar.
 */
const PAPELES = {
  todo: ['catalog:read', 'catalog:write'],
  lectura: ['catalog:read'],
  ninguno: [],
} as const

type Papel = keyof typeof PAPELES

const RECUERDO = 'cuarzo.dev.papel'
const EN_LA_URL = 'dev.papel'

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

export default function devSession(session: SessionConfig, config: BaseConfig) {
  const papel = papelElegido()

  /* **Se dice cuál está puesto y cómo cambiarlo.** Una forma de mirar la
     aplicación con menos permisos que hay que descubrir leyendo el código es una
     que no se usa nunca. */
  console.info(
    `[cuarzo] sesión de desarrollo con el papel «${papel}»: ${PAPELES[papel].join(', ') || 'sin capacidades'}\n` +
      `         los otros: ${Object.keys(PAPELES).join(' · ')} — se eligen con ?${EN_LA_URL}=lectura`,
  )

  return createFakeSession({
    /* La traducción llega en la configuración: no se vuelve a armar acá. */
    toCapabilities: session.toCapabilities,
    claims: {
      sub: 'fake-1',
      name: 'Ana Operadora',
      preferred_username: 'aoperadora',
      resource_access: {
        [config.clientId]: { roles: [...PAPELES[papel]] },
      },
    },
  })
}
