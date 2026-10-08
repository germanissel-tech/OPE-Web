import type { constraints, SchemaName } from './constraints'

/**
 * **Una invariante de schema, copiada con vigilancia** (`CU-38`).
 *
 * La capa 2 se evalúa de este lado —mira dos campos del mismo mensaje, así que
 * se contesta sin consultar nada— y eso significa **copiar la lógica del
 * backend**. Lo que sigue es cómo se evita que esa copia se pudra.
 *
 * Se escribe la regla declarada **al lado de la implementación**, y su tipo es
 * el texto literal que el contrato dice hoy:
 *
 * ```ts
 * demoInvariant('ArticleCreate', 'DISCOUNT_ABOVE_PRICE', 'discountedPrice <= price', …)
 * ```
 *
 * Si el backend cambia la regla, **deja de compilar**. Si el código no existe,
 * tampoco. No garantiza que la lógica coincida —**ninguna comprobación puede
 * hacer eso**. Lo que sí ata es el origen: la copia no se puede escribir sin
 * leer lo declarado, y deja de compilar cuando eso cambia.
 *
 * **Por qué la vigilancia va en este sentido y no en el otro.** Los dos errores
 * no son simétricos: una copia más laxa se descubre sola —el servidor rechaza y
 * el operador se entera— y **una más estricta no se descubre nunca**, porque
 * bloquea por algo que la API habría aceptado.
 */

type InvariantOf<Message extends SchemaName> = (typeof constraints)[Message]['invariants'][number]

/** El código de una invariante que ese mensaje declara. Otro no compila. */
type CodeOf<Message extends SchemaName> = InvariantOf<Message>['code']

/** La regla **tal como el contrato la declara hoy**. Si cambia, no compila. */
type RuleOf<Message extends SchemaName, Code extends CodeOf<Message>> = Extract<
  InvariantOf<Message>,
  { readonly code: Code }
>['rule']

export type Invariant<Values> = {
  readonly code: string
  /** Qué decirle al operador. Va al motivo del botón apagado (`GR-64`). */
  readonly explains: string
  /** Si los valores actuales la cumplen. */
  readonly holds: (values: Values) => boolean
}

export function demoInvariant<Message extends SchemaName, Code extends CodeOf<Message>, Values>(
  /* No se usa al correr: **es el que ata el código y la regla a un mensaje**, y
     sin él los dos se podrían copiar de cualquier otro. */
  _message: Message,
  code: Code,
  /** La regla declarada. **Se copia del contrato y el tipo lo verifica.** */
  rule: RuleOf<Message, Code>,
  holds: (values: Values) => boolean,
  explains: string,
): Invariant<Values> {
  /* `rule` no se usa al correr, y no sobra: **existe para que el compilador la
     compare** con la que el contrato declara hoy. Sacarla dejaría la copia sin
     nada que la ate a su origen. */
  void rule

  return { code, explains, holds }
}
