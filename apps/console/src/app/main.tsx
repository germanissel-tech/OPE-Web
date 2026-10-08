import { bootstrapApplication, consoleTelemetry, ServicesProvider } from '@ope/core'
import { createDemoClient, demoService } from '../api/demo/client'
import { readConfig } from './config'
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
   * aplicación: es donde elige su proveedor.
   *
   * La carga es diferida para que la implementación de desarrollo no entre en el
   * artefacto de producción (`CU-36`): la rama desaparece al compilar.
   */
  buildProvider: async (session, config) => {
    if (!import.meta.env.DEV) throw new Error('Esta aplicación todavía no tiene sesión real.')
    const { default: devSession } = await import('./dev-session')
    return devSession(session, config)
  },

  /**
   * Contra qué sistemas habla, y con qué autorización.
   *
   * **Es el único lugar donde `authorize` existe**: el árbol no puede pedirla
   * —`useSessionControl` no la expone, y eso es lo que `CU-10` garantiza—, así
   * que los servicios se arman acá y se reciben.
   *
   * Crece una línea por sistema (`CU-22`), y cada uno con **su** URL base: un
   * token que sirve para todos ejerce más de lo que necesita.
   */
  provide: ({ config, authorize, children }) => (
    <ServicesProvider services={[demoService(createDemoClient(config.systems.demo, authorize))]}>
      {children}
    </ServicesProvider>
  ),
})
