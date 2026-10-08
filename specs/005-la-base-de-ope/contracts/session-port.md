# La puerta de sesión · `@ope/session`

**Carpeta**: `005-la-base-de-ope` · **Fecha**: 2026-10-08

La superficie de `@ope/session` después de esta feature. Es lo que `tests/gate.mjs` vigila por el
texto y lo que `bootstrap.tsx` consume. **Nada de lo exportado entrega un token** (`CU-10`): la
regla no cambia, y `signIn` la respeta porque recibe y no devuelve.

## Tipos

```ts
export type Claims = Readonly<Record<string, unknown>>
export type Capabilities = ReadonlySet<string>

export type SessionStatus =
  | 'resolving' | 'anonymous' | 'active' | 'unauthorized' | 'expiring' | 'waiting' | 'ended'

export type EndReason =
  | 'signed-out' | 'other-subject' | 'window-closed' | 'reentry-timeout' | 'idle-timeout'
  | 'token-rejected'          // NUEVO · the backend stopped recognising the credential

export type SessionState = {
  readonly status: SessionStatus
  readonly subject?: string
  readonly claims?: Claims
  readonly capabilities: Capabilities
  readonly reason?: EndReason
}

/** What the gate can honour. Nothing about any provider. */
export type SessionConfig = {
  readonly toCapabilities: (claims: Claims) => Capabilities
  readonly reentryTimeout?: number
}

export type SignInOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'rejected' | 'unreachable' }

export type SessionPort = {
  readonly resolve: () => Promise<void>
  readonly authorize: (request: Request) => Promise<Request>
  /** The adapter looks at every response; a 401 ends the session. Optional. */
  readonly observe?: (response: Response) => void
  /** The adapter's own entry, when it has one. Receives a credential; never returns one. */
  readonly signIn?: (credential?: string) => Promise<SignInOutcome>
  readonly signOut: () => Promise<void>
  readonly reenter: () => Promise<void>
  readonly getState: () => SessionState
  readonly subscribe: (listener: () => void) => () => void
}

export type SessionPortFactory = (config: SessionConfig) => Promise<SessionPort>
```

## Entradas

| entrada | exporta | quién la usa |
|---|---|---|
| `@ope/session` | `configureSession`, `SessionProvider`, `useSession`, `useCapabilities`, `useSessionControl`, los tipos | el núcleo |
| `@ope/session/fake` | `createFakeSession`, `FAKE_SESSION_MARKER`, `Simulation` | `dev-session.ts` de cada aplicación, las pruebas |
| `@ope/session/bearer` | `createBearerSession` | `main.tsx` de la consola |

`keycloak.ts` queda en `src/` **sin entrada** hasta que exista el adaptador OIDC.

## La puerta

```ts
export type AppSession = {
  readonly authorize: SessionPort['authorize']
  readonly observe: (response: Response) => void      // no-op when the adapter has none
  readonly signIn: SessionPort['signIn']               // undefined when the adapter has none
  readonly signOut: () => Promise<void>
  readonly reenter: () => Promise<void>
  readonly resolve: () => Promise<void>
  readonly subscribe: SessionPort['subscribe']
  readonly getState: () => SessionState
}

export async function configureSession(config: SessionConfig, build: SessionPortFactory): Promise<AppSession>
export function useSessionControl(): Pick<AppSession, 'signOut' | 'reenter' | 'signIn'>
```

`configureSession` falla si `toCapabilities` no es una función. **No valida nada más**: lo que un
adaptador necesita lo valida el adaptador al construirse.

## El bearer

```ts
export type BearerSessionOptions = {
  readonly toCapabilities: (claims: Claims) => Capabilities
  /**
   * Who the credential belongs to. The application writes it: it is the only one that knows
   * which operation of its backend answers that. Throws RequestFailed-like `{ status }` on 401.
   */
  readonly identify: (authorize: SessionPort['authorize']) => Promise<Claims>
  /** The header scheme. `Bearer` by default. */
  readonly scheme?: string
}

export function createBearerSession(options: BearerSessionOptions): SessionPort
```

Lo que `tests/gate.mjs` agrega a lo que ya vigila:

- `signIn` existe en `SessionPort` con la firma `(credential?: string) => Promise<SignInOutcome>` y
  `SignInOutcome` **no tiene ningún miembro** cuyo nombre contenga `token` ni `credential`.
- La entrada `bearer` nombra **un** mecanismo (`Bearer`) y la superficie principal no nombra ninguno.
