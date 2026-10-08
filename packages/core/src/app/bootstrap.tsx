import {
  type AppSession,
  configureSession,
  type SessionConfig,
  type SessionPort,
  SessionProvider,
  useSession,
  useSessionControl,
} from '@ope/session'
import { Failure } from '../base/failure'
/* El núcleo dibuja con granito, así que **el núcleo trae sus estilos**. Pedirle
   a cada aplicación que los importe sería repartir una dependencia nuestra. */
import '@granito/ui/css'
import type { ReactNode } from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { BaseConfig } from '../base/config'
import type { ApplicationManifest } from '../base/manifest'
import { consoleTelemetry, type TelemetryPort, TelemetryProvider } from '../base/telemetry'
import { PreferencesProvider } from '../base/use-preferences'
import { StringsProvider } from '../base/use-strings'
import { WorkContextProvider } from '../base/use-work-context'
import { createQueryClient, QueryProvider } from '../data/query'
import { CannotStart } from '../ui/cannot-start'
import { Frame } from '../ui/frame'
import { NoticesProvider } from '../ui/use-notices'
import { ApplicationView, type Chrome, createApplication } from './create-application'

/**
 * **El arranque de una aplicación de Tandilia.**
 *
 * Se publica en vez de copiarse porque es **idéntico en las cuatro**: el
 * arranque del DOM, la pantalla de configuración faltante, la secuencia de
 * armado y el manejo de falla. Del lado de la aplicación quedan el manifiesto,
 * el shell y sus fixtures (`CU-42`).
 */

/** Cómo se lee la configuración. De dónde y con qué forma lo decide la aplicación. */
export type ConfigReader<Config> = () => Promise<Config>

export type BootstrapOptions<Config extends BaseConfig> = {
  /** Dónde se monta. Por omisión `#raiz`. */
  readonly container?: string
  readonly readConfig: ConfigReader<Config>
  /** Qué declara la aplicación, una vez leída su configuración. */
  readonly manifest: (config: Config) => ApplicationManifest
  /**
   * Cómo se dibuja el shell. **Por omisión, el del marco**: una aplicación sólo
   * lo pasa si necesita algo distinto.
   */
  readonly chrome?: Chrome
  /**
   * Cómo se construye el proveedor de sesión.
   *
   * **Recibe la `SessionConfig` ya armada**, así que no puede quedarse sin la
   * traducción de capacidades ni sin el plazo de reingreso.
   *
   * Y se resuelve de forma diferida para que la implementación de desarrollo
   * viva en su propio archivo y **no entre en el artefacto de producción**
   * (`CU-36`).
   */
  readonly buildProvider: (session: SessionConfig, config: Config) => Promise<SessionPort>
  /**
   * **Dónde deja rastro lo que pasa** (`CU-35`).
   *
   * Recibe la configuración porque un tablero real vive en algún lado, y a
   * dónde apunta se lee al arrancar (`CU-17`) — no se compila adentro.
   *
   * **Por omisión, la consola.** Es lo correcto en desarrollo, donde el que
   * mira es quien está programando. Una aplicación que no pase nada se despacha
   * registrando en la consola del navegador: sirve, y no lo mira nadie.
   */
  readonly telemetry?: (config: Config) => TelemetryPort
  /**
   * Qué compilación es ésta, para el registro (`CU-35`).
   *
   * **Obligatoria**, y no por rigor: siendo opcional se degradaba a un texto
   * cualquiera y **nadie se enteraba de que el tablero había dejado de poder
   * decir de qué build venía cada cosa**.
   *
   * Sale del complemento `opeBuild()` de `@ope/core/build`, que la arma
   * con la versión y el commit. Se pasa y no se lee de la configuración porque
   * **es del artefacto, no del despliegue**.
   */
  readonly version: string
  /**
   * Qué se ve si falta configuración.
   *
   * Lo pone la aplicación porque **el mensaje depende de qué configuración
   * espera**, y el marco no la conoce. Si no se pasa, se dibuja uno genérico.
   */
  readonly onMissingConfig?: (props: { error: unknown }) => ReactNode
  /**
   * **Dónde la aplicación inyecta lo suyo**: sus servicios contra cada sistema.
   *
   * Recibe la sesión —`authorize` y `observe`, **juntas**— porque el árbol no
   * puede pedirlas: `useSessionControl` expone `signOut`, `reenter` y `signIn`
   * y nada más, que es lo que `CU-10` garantiza. El único lugar donde existen es
   * acá, después de armar la sesión. Y van juntas para que un servicio no
   * pueda cablear una sin la otra: con `authorize` sola, un `401` en vuelo no
   * lo escucharía nadie.
   *
   * **Se llama una vez, al armar el árbol**, no en un dibujo: lo que devuelva
   * envuelve a la aplicación entera y por lo tanto tiene ciclo de vida
   * (`CU-36`).
   */
  readonly provide?: (props: {
    readonly config: Config
    readonly session: {
      readonly authorize: (request: Request) => Promise<Request>
      readonly observe: (response: Response) => void
    }
    readonly children: ReactNode
  }) => ReactNode
}

/**
 * Arranca. Hace **una** cosa: encadenar los pasos en orden y montar.
 *
 * Cada paso es una dependencia recibida, no una decisión de acá: qué se lee,
 * qué se declara, cómo se dibuja y qué sesión se usa los pone quien llama
 * (`CU-36`).
 */
export async function bootstrapApplication<Config extends BaseConfig>(
  options: BootstrapOptions<Config>,
) {
  const selector = options.container ?? 'raiz'
  const container = document.getElementById(selector)
  if (!container)
    throw new Failure('startup.missingContainer', `Falta <div id="${selector}"> en index.html`)

  const root = createRoot(container)

  let config: Config
  try {
    config = await options.readConfig()
  } catch (error) {
    console.error(error)
    const MissingConfig = options.onMissingConfig ?? CannotStart
    root.render(<MissingConfig error={error} />)
    return
  }

  const manifest = options.manifest(config)
  const gate = await configureSession(
    /* Sólo lo que la puerta puede honrar: lo que un adaptador necesita de un
       proveedor lo recibe el adaptador en `buildProvider`, tipado como suyo. */
    { toCapabilities: manifest.toCapabilities },
    /* El adaptador se construye **con la configuración**, así que no puede
       quedarse sin la traducción de capacidades. */
    (session) => options.buildProvider(session, config),
  )

  /* Las dos se arman UNA vez, acá, y nunca adentro de un render (`CU-36`). */
  const queries = createQueryClient()
  const application = createApplication(
    manifest,
    options.chrome ??
      /* **Se reenvía entero, y no campo por campo.** Copiar prop por prop hace
         que agregar una al marco sea un cambio en dos lugares, y el segundo no
         falla al olvidarse: la prop nueva simplemente no llega. Con
         `onNavigate` eso deja al menú lateral recargando la aplicación, y con
         eso el aviso de `CU-47` deja de existir por ese camino. */
      ((props) => <Frame {...props} />),
  )

  const application_ = (
    <QueryProvider client={queries}>
      {/* Quién lo cumple **lo eligió la aplicación**, que es lo que `CU-35` pide.
          Acá sólo se lo pone donde el árbol lo puede recibir. */}
      <TelemetryProvider
        value={{
          port: options.telemetry?.(config) ?? consoleTelemetry,
          app: manifest.name,
          version: options.version,
          envelope: manifest.telemetry?.envelope ?? {},
        }}
      >
        <NoticesProvider>
          <ApplicationRoot
            gate={gate}
            application={application}
            manifest={manifest}
            waitThresholdMs={config.waitThresholdMs}
          />
        </NoticesProvider>
      </TelemetryProvider>
    </QueryProvider>
  )

  root.render(
    <StrictMode>
      <StringsProvider strings={manifest.strings}>
        {options.provide
          ? options.provide({
              config,
              session: { authorize: gate.authorize, observe: gate.observe },
              children: application_,
            })
          : application_}
      </StringsProvider>
    </StrictMode>,
  )

  /* Se dibuja primero y se resuelve después, sin esperar: mientras el estado es
     `resolving` no se ve nada (`CU-9`). */
  void gate.resolve()
}

/**
 * La costura entre la sesión y el marco.
 *
 * **Acá se resuelve el rótulo de la barra**, porque es donde están los claims
 * que la aplicación traduce (`CU-27`).
 */
function ApplicationRoot({
  gate,
  application,
  manifest,
  waitThresholdMs,
}: {
  gate: AppSession
  application: ReturnType<typeof createApplication>
  manifest: ApplicationManifest
  waitThresholdMs: number
}) {
  return (
    <SessionProvider gate={gate}>
      <SessionAwareApplication
        application={application}
        manifest={manifest}
        waitThresholdMs={waitThresholdMs}
      />
    </SessionProvider>
  )
}

function SessionAwareApplication({
  application,
  manifest,
  waitThresholdMs,
}: {
  application: ReturnType<typeof createApplication>
  manifest: ApplicationManifest
  waitThresholdMs: number
}) {
  const session = useSession()
  const { reenter, signIn } = useSessionControl()
  /* Las preferencias y los contextos van adentro de la sesión porque **se
     estampan con el sujeto** (`CU-26`): antes de resolverla no se sabe de quién
     son, y lo guardado siempre pertenece a alguien. */
  const subject = typeof session.claims?.sub === 'string' ? session.claims.sub : undefined

  return (
    <PreferencesProvider subject={subject} preferences={manifest.userMenu?.preferences ?? []}>
      <WorkContextProvider subject={subject} contexts={manifest.contexts ?? []}>
        <ApplicationView
          application={application}
          status={session.status}
          capabilities={session.capabilities}
          endReason={session.reason}
          reenter={() => void reenter()}
          signIn={signIn}
          userCaption={manifest.userCaption?.(session.claims ?? {})}
          waitThresholdMs={waitThresholdMs}
        />
      </WorkContextProvider>
    </PreferencesProvider>
  )
}
