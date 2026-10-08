/**
 * Los tipos de `@ope/session`.
 *
 * **No hay ningún tipo para el token, y no es un olvido.** La puerta autoriza
 * pedidos, así que nada fuera del proveedor necesita verlo — y no exponerlo es
 * lo que hace que «una pantalla no puede obtener un token» sea **una verdad del
 * tipo** y no una convención que alguien tiene que recordar (`CU-10`).
 */

/** Lo que el token trae, sin interpretar. El módulo no lo lee: lo transporta. */
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

export type SessionState = {
  readonly status: SessionStatus
  /** El `sub` del token. **Lo único que se compara** para saber si volvió otra persona. */
  readonly subject?: string
  readonly claims?: Claims
  readonly capabilities: Capabilities
  /** Sólo cuando `status` es `ended`. */
  readonly reason?: EndReason
}

export type SessionConfig = {
  /** Obligatorio. Es configuración y no código — `CU-10`. */
  readonly issuer: string
  /** Obligatorio. */
  readonly clientId: string
  /**
   * Obligatoria, y la pone la aplicación. Traduce lo que el token trae a lo que
   * esta aplicación permite.
   *
   * Vive del lado de la aplicación porque el módulo no puede conocer
   * `ctacte-panel` ni `receipts:write`. Y ahí está la única forma propia del
   * proveedor —`resource_access.<client>.roles`, porque OIDC estándar no tiene
   * claim de roles—, así que **la costura cae del lado correcto sin forzarla**.
   *
   * Si devuelve vacío, el estado es `unauthorized`, y ese estado **no redirige
   * al proveedor**.
   */
  readonly toCapabilities: (claims: Claims) => Capabilities
  /**
   * Cuánto se espera a que vuelva, con la ventana abierta — `CU-9`.
   *
   * **Lo honra el proveedor**, que es quien sabe cuándo se abrió la ventana. La
   * puerta le entrega la configuración entera justamente para que pueda: una
   * opción que se acepta y nadie lee es peor que no tenerla.
   */
  readonly reentryTimeout?: number
}

/**
 * Cómo se construye un proveedor.
 *
 * **Recibe la configuración**, y ésa es la garantía que importa: ningún
 * proveedor puede construirse sin `toCapabilities`, porque le llega adentro. Sin
 * esto, quien escriba el adaptador real puede armar un `SessionPort` válido
 * —el tipo no la pide— y quedarse con capacidades vacías.
 */
export type SessionPortFactory = (config: SessionConfig) => Promise<SessionPort>

/**
 * La segunda implementación de la puerta. Existe porque **una interfaz no
 * demuestra nada si nunca se ejerce contra otra cosa** (`CU-10`).
 *
 * Nótese que **no tiene un método para obtener el token**: la implementación lo
 * guarda donde quiera, y `authorize` es la única forma de usarlo.
 */
export type SessionPort = {
  /** Resuelve el estado inicial. Se llama una vez, antes de dibujar. */
  readonly resolve: () => Promise<void>
  /** La pieza central: recibe un pedido y devuelve el mismo pedido, autorizado. */
  readonly authorize: (request: Request) => Promise<Request>
  /** Termina la sesión del realm, o sea la de **todas** las aplicaciones — `CU-12`. */
  readonly signOut: () => Promise<void>
  /** El operador apretó «volver a entrar»: abre la ventana. */
  readonly reenter: () => Promise<void>
  readonly getState: () => SessionState
  readonly subscribe: (listener: () => void) => () => void
}
