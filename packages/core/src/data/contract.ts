/**
 * **La forma del módulo que el backend emite por consumidor** (`TAN-7`).
 *
 * El backend es quien sabe qué exige cada operación; el frontend publica **qué
 * forma tiene lo que espera recibir** y verifica que lo recibido la tenga
 * (`ope-check conformity`). Así la capacidad de una acción se deriva del
 * contrato y nunca se escribe (`CU-37`): un módulo con otra forma no compila
 * contra esto, y un módulo despegado del bundle no pasa la comprobación.
 *
 * El núcleo **no sabe qué es `merchants:read`**: sabe que es una de las que el
 * módulo lista. Por eso `Capability` es un parámetro y no una unión escrita
 * acá — la aplicación lo cierra con su módulo, y el portal cerrará el suyo.
 */

/** Lo que el contrato exige de una operación. */
export type OperationRequirement<Capability extends string = string> = {
  /** Los `x-required-capabilities` de la operación, en el orden del contrato. */
  readonly capabilities: readonly Capability[]
  /** Si la operación declara `x-idempotency`: repetirla con el mismo cuerpo no duplica. */
  readonly idempotent: boolean
}

/**
 * El módulo entero: de qué contrato salió, para qué consumidor, su vocabulario
 * y lo que exige cada operación.
 */
export type ContractModule<
  Ops extends Readonly<Record<string, OperationRequirement<Capability>>>,
  Capability extends string = string,
> = {
  readonly CONTRACT: { readonly version: string; readonly sha256: string }
  readonly CONSUMER: string
  readonly CAPABILITIES: readonly Capability[]
  readonly OPERATIONS: Ops
}
