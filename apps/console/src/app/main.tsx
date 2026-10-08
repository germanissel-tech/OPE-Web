import { bootstrapApplication, consoleTelemetry, ServicesProvider } from '@ope/core'
import { createDemoClient, demoService } from '../api/demo/client'
import { createClient, opeService } from '../api/ope/client'
import { readConfig } from './config'
import { identity } from './identity'
import { createManifest } from './manifest'

/**
 * El punto de entrada. **Sólo dice qué usa esta aplicación**; el arranque, el
 * shell, la configuración y la pantalla de falla los pone `@ope/core`
 * (`CU-42`).
 */
await bootstrapApplication({
  readConfig,
  manifest: createManifest,

  /**
   * **Dónde deja rastro lo que pasa** (`CU-35`).
   *
   * Acá va el tablero de esta aplicación. `consoleTelemetry` es el de
   * desarrollo, donde el que mira es quien está programando; el día que haya
   * uno de verdad **se cambia esta línea y nada más** — ni la puerta de
   * acciones, ni el límite de error, ni ninguna pantalla se entera de cuál le
   * tocó.
   *
   * Recibe la configuración porque a dónde apunta un tablero se lee al arrancar
   * (`CU-17`), no se compila adentro.
   */
  telemetry: () => consoleTelemetry,

  /* **Del artefacto, no del despliegue**: lo hornea Vite de `package.json`, así
     que el mismo build promovido a producción reporta la misma versión. */
  version: __OPE_BUILD__,

  /**
   * Contra qué autentica. **Es lo único con lógica que queda acá**, y es de la
   * aplicación: es donde elige su adaptador.
   *
   * En producción, la credencial opaca por operador de OPE (`ADR-031` del
   * backend) con `identify` de esta aplicación. En desarrollo, la falsa, cargada
   * de forma diferida para que no entre en el artefacto (`CU-36`): la rama
   * desaparece al compilar. **Con `?dev.bearer=1` se usa el bearer también en
   * desarrollo**, para probar el ingreso contra el backend real.
   */
  buildProvider: async (session, config) => {
    const wantsBearer = new URLSearchParams(globalThis.location.search).has('dev.bearer')
    if (import.meta.env.DEV && !wantsBearer) {
      const { default: devSession } = await import('./dev-session')
      return devSession(session)
    }
    const { createBearerSession } = await import('@ope/session/bearer')
    return createBearerSession({
      toCapabilities: session.toCapabilities,
      identify: identity(config).identify,
    })
  },

  /**
   * Contra qué sistemas habla, y con qué sesión.
   *
   * **Es el único lugar donde `authorize` y `observe` existen**: el árbol no
   * puede pedirlas —`useSessionControl` no las expone, y eso es lo que `CU-10`
   * garantiza—, así que los servicios se arman acá y se reciben.
   *
   * Crece una línea por sistema (`CU-22`), y cada uno con **su** URL base. El
   * `demo` del hola mundo se va con él en el tramo 5 de la 005.
   */
  provide: ({ config, session, children }) => (
    <ServicesProvider
      services={[
        opeService(createClient(config.systems.ope, session)),
        demoService(createDemoClient(config.systems.demo, session.authorize)),
      ]}
    >
      {children}
    </ServicesProvider>
  ),
})
