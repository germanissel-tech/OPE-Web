/**
 * **La raíz del repositorio, calculada acá y no importada de `packages/`.**
 *
 * ## Por qué existe
 *
 * Los guiones de `tests/` **viajan al clon** y `packages/` **se borra en el paso
 * 2 del ritual**, así que una línea como
 *
 * ```js
 * import { ROOT } from '../packages/core/checks/context.mjs'
 * ```
 *
 * deja al clon con el guion adentro y sin nada que importar:
 * `ERR_MODULE_NOT_FOUND`, la primera vez que alguien lo corre.
 *
 * **Esto ya había pasado, y se arregló mal**: `tests/mock.mjs` lo sufrió —dejaba
 * al clon sin backend—, se corrigió calculando la raíz de su propia ubicación, y
 * **la corrección llegó a ese archivo y no a los otros seis**. Lo encontró
 * `las-animas/admin`, la primera aplicación, cuando `npm run tipos` murió: sin
 * `roles.ts` generado no se puede derivar del contrato qué capacidad exige cada
 * operación, que es lo que `CU-37` promete. Una garantía que en un clon no
 * existía.
 *
 * Un módulo y no dos líneas repetidas en cada guion: repetidas, el próximo se
 * escribe copiando al de al lado y **vuelve a importar de `packages/`** si copió
 * el equivocado.
 *
 * ## Y es más correcto, además de posible
 *
 * `ROOT` en las comprobaciones es `process.cwd()`: el directorio desde donde
 * alguien llamó. Acá se calcula **desde este archivo**, que es donde de verdad
 * está el repositorio — el contrato está al lado de estos guiones, no en el
 * directorio de quien los invocó.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** La raíz: la carpeta que contiene a `tests/`. */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
