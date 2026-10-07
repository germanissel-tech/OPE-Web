/**
 * **La prueba de que `CU-29` no se puede olvidar: sin el testigo no compila.**
 *
 * No necesita corredor de pruebas. La verifica `tsc -b`, que ya corre: cada
 * `@ts-expect-error` **falla si el error que espera no ocurre** —TypeScript lo
 * reporta como directiva sin usar—, así que este archivo pasa a rojo tanto si el
 * tipado se afloja como si alguien lo rompe.
 *
 * Es la garantía más fuerte de las cinco, y acá vale más que en otros lados: sin
 * el testigo, el servidor rechaza la escritura con `412` **en producción y no
 * antes**, así que el error aparece lejos de quien lo escribió.
 *
 * Vive al lado de lo que prueba y no en `packages/`: lo que se verifica depende
 * de `roles.ts`, que se genera del contrato de **esta** aplicación.
 *
 * **Es una restricción y no una transformación**, y el intento anterior enseña
 * por qué: intersectar el tipo de entrada no funciona porque ese tipo se infiere
 * del propio parámetro, así que la intersección se muerde la cola. Restringirlo
 * sí: el que declara la operación escribe la entrada entera, y el compilador
 * verifica que tenga lo que el contrato exige.
 */

import type { ArticleCreate } from '../../../api/demo/client'
import { demoOperation } from '../../../api/demo/operations'

type ConTestigo = {
  readonly articleId: number
  readonly body: ArticleCreate
  readonly version: string
}

type SinTestigo = {
  readonly articleId: number
  readonly body: ArticleCreate
}

/* Lo que TIENE que compilar: la entrada lleva el testigo. */
demoOperation('updateArticle', (demo, input: ConTestigo) =>
  demo.updateArticle(input.articleId, input.body, input.version),
)

/* Y una que no lo exige sigue sin pedirlo: la protección se activa por contrato,
   no por estar puesta en todas partes. */
demoOperation('deactivateArticle', (demo, articleId: number) => demo.deactivateArticle(articleId))

/* ── Y lo que NO ─────────────────────────────────────────────────────────── */

// @ts-expect-error — el contrato exige `If-Match`, así que la entrada lleva testigo
demoOperation('updateArticle', (demo, input: SinTestigo) =>
  demo.updateArticle(input.articleId, input.body, '"inventado"'),
)
