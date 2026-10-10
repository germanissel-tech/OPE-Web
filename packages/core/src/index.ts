/**
 * La superficie pública de `@ope/core`.
 *
 * **No es un archivo barril de los que prohíbe `CU-15`**: aquéllos re-exportan
 * una carpeta entera con `export *` y rompen el sacudido de árbol. Acá cada
 * nombre está escrito, que es lo que un paquete publicado necesita para tener
 * una entrada.
 *
 * Adentro hay tres categorías con límites propios (`CU-40`): **base**,
 * **data** e **ui**.
 */

export { type BootstrapOptions, bootstrapApplication } from './app/bootstrap'
export {
  type Application,
  ApplicationView,
  type Chrome,
  createApplication,
} from './app/create-application'
export {
  type BaseConfig,
  baseSchema,
  IncompleteConfig,
  readConfig,
  readConfigWith,
} from './base/config'
export {
  type ContextLife,
  defineWorkContext,
  type WorkContext,
} from './base/context'
export { Failure, type FailureCode, isFailure } from './base/failure'
export { composeFeatures, defineFeature, type Feature } from './base/feature'
export {
  closes,
  type Destination,
  defineFlow,
  type Flow,
  type FlowDefinition,
  finishes,
  group,
  isGroup,
  type MenuEntry,
  type MenuGroup,
  omits,
  opens,
  type Step,
} from './base/flow'
export {
  type FlowState,
  type Move,
  type StackEntry,
  toClose,
  toEnter,
  toFinish,
  toOpen,
} from './base/flow-state'
export {
  buildUrl,
  NavigationProvider,
  useNavigation,
  useScreenParams,
} from './base/go-to'
export {
  type ApplicationManifest,
  defineApplication,
  type UserMenuEntry,
  type UserMenuManifest,
} from './base/manifest'
export { type Notice, type NoticesPort, type NoticeTone, useNotices } from './base/notices'
export {
  type AnyOutcome,
  type Outcome,
  type OutcomeEvent,
  outcome,
  type Payload,
} from './base/outcome'
export {
  type AnyPreference,
  definePreference,
  fixed,
  type Preference,
  type PreferenceSpec,
} from './base/preference'
export { standardPreferences } from './base/preferences/standard'
export { type Theme, theme } from './base/preferences/theme'
export { tooltips } from './base/preferences/tooltips'
export {
  createRegistry,
  defineScreen,
  isVisible,
  type Reachable,
  type RouteParams,
  type Screen,
  type ScreenDefinition,
  toReach,
} from './base/registry'
export {
  AuthorizationProvider,
  buildRoutes,
  type RouteObject,
  useCapabilities,
} from './base/routes'
export {
  baseUrl,
  because,
  type Field,
  mapOf,
  milliseconds,
  parse,
  type Read,
  type Shape,
  text,
  url,
  type ValueOf,
} from './base/schema'
export type { NavigationPort, Services, SessionView } from './base/services'
export type {
  SessionStatusName,
  SessionViewContext,
  SessionViews,
} from './base/session-views'
export { DEFAULT_STRINGS, type Strings } from './base/strings'
export {
  consoleTelemetry,
  type TelemetryEvent,
  type TelemetryPort,
  TelemetryProvider,
  useTelemetry,
} from './base/telemetry'
export {
  durationFrom,
  durationIn,
  exactDecimals,
  type Presentation,
  percentToRate,
  rateToPercent,
  scaledRange,
  type TimeUnit,
} from './base/units'
export { TYPING_DELAY_MS, useDebounced } from './base/use-debounced'
export { type OutcomePort, OutcomeProvider, useOutcome } from './base/use-outcome'
export {
  type PreferenceRow,
  PreferencesProvider,
  usePreferences,
} from './base/use-preferences'
export { StringsProvider, useStrings } from './base/use-strings'
export { useWorkContext, WorkContextProvider } from './base/use-work-context'
export { type FlowInput, verifyFlows } from './base/verify-flows'
export {
  type Action,
  type ActionSpec,
  defineAction,
  type Invalidation,
  isEnabled,
  type Operation,
  type Operations,
  operation,
} from './data/action'
export { createOpeClient, type OpeClient, type SessionHooks } from './data/client'
export {
  type Collection,
  type CollectionOptions,
  type CollectionQuery,
  useCollection,
} from './data/collection'
export { type Clash, clashBetween } from './data/conflict'
export type { ContractModule, OperationRequirement } from './data/contract'
export {
  type FieldError,
  failedWith,
  fieldNameOf,
  PROBLEM_NAMESPACE,
  type RejectedField,
  RequestFailed,
  UNKNOWN_PROBLEM,
  unwrap,
} from './data/envelope'
export { failureNotice, isBusinessRejection, successNotice } from './data/notice'
export { createQueryClient, QueryProvider } from './data/query'
export {
  defineService,
  type Registration,
  type ServiceKey,
  ServicesProvider,
  useService,
} from './data/service'
export { type ActionResult, useAction } from './data/use-action'
export { type FlowPort, FlowProvider, type FlowWiring, useFlow } from './data/use-flow'
export { useLoadedOnce } from './data/use-loaded-once'
export {
  ActionButton,
  type ActionButtonProps,
  ActionIconButton,
  type ActionIconButtonProps,
} from './ui/action-button'
export { CannotStart } from './ui/cannot-start'
export { ConfirmDialog, type ConfirmDialogProps } from './ui/confirm-dialog'
export { ConflictDialog, type ConflictDialogProps } from './ui/conflict-dialog'
export { constraintsOf } from './ui/constraints-of'
export { Frame, type FrameProps } from './ui/frame'
export { LoadMoreCursor, type LoadMoreCursorProps } from './ui/load-more'
export { buildMenu } from './ui/menu'
export { type QueryLike, Result, type ResultProps, type ResultState } from './ui/result'
export { type GridQuery, type GridResult, type GridStates, resultOf } from './ui/result-of'
export { ScreenError } from './ui/screen-error'
export { SecretOnce, type SecretOnceProps } from './ui/secret-once'
export {
  defaultSessionViews,
  Forbidden,
} from './ui/session-views'
export { SignIn, type SignInProps } from './ui/sign-in'
export { useUnsavedWork } from './ui/unsaved-work'
export { useActionColumn } from './ui/use-action-column'
export {
  type FieldConstraints,
  type Form,
  type MessageConstraints,
  type ShapeStrings,
  shapeErrorOf,
  useForm,
} from './ui/use-form'
export { NoticesProvider, useNoticeHost } from './ui/use-notices'
export { type TableQuery, useTableQuery } from './ui/use-table-query'
export { UserBar, type UserBarProps } from './ui/user-bar'
