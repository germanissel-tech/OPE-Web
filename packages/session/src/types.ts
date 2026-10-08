/**
 * Los tipos de `@ope/session`.
 *
 * **No hay ningún tipo para el token, y no es un olvido.** La puerta autoriza
 * pedidos, así que nada fuera del adaptador necesita verlo — y no exponerlo es
 * lo que hace que «una pantalla no puede obtener un token» sea **una verdad del
 * tipo** y no una convención que alguien tiene que recordar (`CU-10`).
 *
 * **Y no hay ningún tipo para un proveedor.** La puerta no sabe si entra por
 * redirección o con una credencial escrita: cada adaptador recibe su propia
 * configuración, tipada y suya, y la puerta sólo recibe lo que puede honrar.
 */

/** Lo que la credencial dice de quién entró, sin interpretar. El módulo lo transporta. */
export type Claims = Readonly<Record<string, unknown>>

/**
 * Lo que esta aplicación permite. El módulo **nunca las interpreta**
 * (principio III): sólo mira si están vacías, porque vacías significan
 * `unauthorized`.
 */
export type Capabilities = ReadonlySet<string>

/** Los siete estados. `ended` es terminal: no se vuelve sin recargar el documento. */
export type SessionStatus =
  | 'resolving'
  | 'anonymous'
  | 'active'
  | 'unauthorized'
  | 'expiring'
  | 'waiting'
  | 'ended'

/** Por qué se terminó. Sirve para decirle al operador algo distinto en cada caso. */
export type EndReason =
  | 'signed-out'
  | 'other-subject'
  | 'window-closed'
  | 'reentry-timeout'
  | 'idle-timeout'
  /** El backend dejó de reconocer la credencial en vuelo: un `401` a un pedido cualquiera. */
  | 'token-rejected'

export type SessionState = {
  readonly status: SessionStatus
  /** El `sub` de los claims. **Lo único que se compara** para saber si volvió otra persona. */
  readonly subject?: string
  readonly claims?: Claims
  readonly capabilities: Capabilities
  /** Sólo cuando `status` es `ended`. */
  readonly reason?: EndReason
}

/**
 * **Lo que la puerta puede honrar, y nada de ningún proveedor.**
 *
 * Un emisor, un client, una URL de ingreso: eso es de un adaptador, y lo
 * recibe el adaptador al construirse, tipado como suyo. Acá queda lo que es
 * igual para cualquiera.
 */
export type SessionConfig = {
  /**
   * Obligatoria, y la pone la aplicación. Traduce lo que la credencial trae a
   * lo que esta aplicación permite.
   *
   * Vive del lado de la aplicación porque el módulo no puede conocer
   * `merchants:write`. Si devuelve vacío, el estado es `unauthorized`, y ese
   * estado **no redirige a ningún lado**.
   */
  readonly toCapabilities: (claims: Claims) => Capabilities
  /**
   * Cuánto se espera a que vuelva, con la ventana abierta — `CU-9`.
   *
   * **Lo honra el adaptador que tenga reingreso**, que es quien sabe cuándo se
   * abrió la ventana. Uno que no lo tiene, lo ignora: con él `expiring` y
   * `waiting` no se alcanzan nunca.
   */
  readonly reentryTimeout?: number
}

/**
 * Cómo se construye un adaptador.
 *
 * **Recibe la configuración**, y ésa es la garantía que importa: ningún
 * adaptador puede construirse sin `toCapabilities`, porque le llega adentro. Sin
 * esto, quien escriba el adaptador real puede armar un `SessionPort` válido
 * —el tipo no la pide— y quedarse con capacidades vacías.
 */
export type SessionPortFactory = (config: SessionConfig) => Promise<SessionPort>

/**
 * Cómo terminó un intento de entrar.
 *
 * **Sin la credencial adentro, en ninguna de las dos ramas.** `signIn` recibe
 * y no devuelve: es lo que mantiene la regla de `CU-10` con una entrada nueva.
 */
export type SignInOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'rejected' | 'unreachable' }

/**
 * La puerta, del lado del adaptador. Existe porque **una interfaz no demuestra
 * nada si nunca se ejerce contra otra cosa** (`CU-10`): la falsa y el bearer
 * son dos implementaciones, y el día que haya OIDC será la tercera.
 *
 * Nótese que **no tiene un método para obtener la credencial**: la
 * implementación la guarda donde quiera, y `authorize` es la única forma de
 * usarla.
 */
export type SessionPort = {
  /** Resuelve el estado inicial. Se llama una vez, antes de dibujar. */
  readonly resolve: () => Promise<void>
  /** La pieza central: recibe un pedido y devuelve el mismo pedido, autorizado. */
  readonly authorize: (request: Request) => Promise<Request>
  /**
   * Mira cada respuesta, antes de que la lea nadie. **Opcional**: un adaptador
   * que renueva por su cuenta no lo necesita; uno con una credencial opaca sí,
   * porque el primer `401` **es** el fin y nadie más lo escucha.
   */
  readonly observe?: (response: Response) => void
  /**
   * La entrada propia del adaptador, cuando la tiene. **Opcional**: un adaptador
   * por redirección entra solo. Recibe una credencial y **nunca devuelve una**.
   */
  readonly signIn?: (credential?: string) => Promise<SignInOutcome>
  /** Termina la sesión. Con un proveedor compartido, la de **todas** las aplicaciones — `CU-12`. */
  readonly signOut: () => Promise<void>
  /** El operador apretó «volver a entrar»: abre la ventana. */
  readonly reenter: () => Promise<void>
  readonly getState: () => SessionState
  readonly subscribe: (listener: () => void) => () => void
}
