/**
 * **Los iconos propios son de la familia de granito** (`granito#PED-10`, `GR-72`).
 *
 * Los iconos son tres capas: granito los fundamentales, **cuarzo los que
 * comparten sus aplicaciones**, y cada aplicación los suyos. Eso sólo funciona
 * si las tres respetan la misma familia — mismo lienzo, mismo trazo, mismo
 * margen— así que granito publica el verificador y acá se corre.
 *
 * **Corre su programa, no uno parecido.** Si corriéramos otro estaríamos
 * exigiendo una cosa y verificando otra, que es peor que no verificar.
 *
 * ## Por qué esto existe en vez de una línea en `package.json`
 *
 * Su verificador **recibe archivos, no patrones**: con `"src/**\/*.tsx"` entre
 * comillas intenta abrir eso como un archivo y revienta. Sin comillas depende de
 * que el shell lo expanda, y en Windows los scripts de npm corren en uno que no
 * lo hace.
 *
 * Así que acá se resuelven los archivos y se los pasa. Va en el mismo pedido; el
 * día que su verificador expanda solo, esto se borra y queda una línea.
 *
 * ## Qué mira, y qué no
 *
 * Que se dibujen con su `icon()`, que nada se salga del lienzo, y que el tamaño
 * caiga en el rango de la familia. **No mira si el dibujo es bueno** —si el trazo
 * está resuelto, si la metáfora se entiende, si dos no se confunden entre sí—:
 * eso lo ve una persona, y granito lo dejó anotado.
 *
 * Hoy cuarzo **no dibuja ninguno**, así que pasa en verde. Se pone ahora y no
 * cuando haya cinco, que es cuando ya sería tarde.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, globSync, realpathSync } from 'node:fs'
import { join } from 'node:path'

import { ROOT } from './raiz.mjs'

const LINKED = join(ROOT, 'node_modules', '@granito', 'ui', 'verificador', 'iconos.mjs')

/**
 * **Se resuelve el enlace simbólico antes de invocarlo.**
 *
 * Su verificador comprueba que lo invoquen a él y no que lo importen, comparando
 * `process.argv[1]` con `import.meta.url`. Node resuelve los enlaces al cargar un
 * módulo, así que con `@granito/ui` enlazado por `file:` las dos rutas no
 * coinciden y **el programa termina sin hacer nada y sin decirlo**.
 *
 * Reportado en `granito#PED-14`. Mientras tanto se lo llama por su ruta real,
 * que es lo que él espera ver.
 */
const VERIFIER = existsSync(LINKED) ? realpathSync(LINKED) : LINKED

console.log('')

if (!existsSync(LINKED)) {
  /* Se informa y no se aprueba en silencio: sin el verificador no se revisó
     nada, y eso no es lo mismo que estar bien. */
  console.log('  --     no está el verificador de granito: los iconos no se revisaron')
  console.log('')
  process.exit(0)
}

/** Dónde puede haber un icono propio: lo compartido y lo de la aplicación. */
const files = ['packages/core/src/**/*.tsx', 'apps/*/src/**/*.tsx'].flatMap((pattern) =>
  globSync(pattern, { cwd: ROOT }),
)

const result = spawnSync(process.execPath, [VERIFIER, ...files], {
  stdio: 'inherit',
  cwd: ROOT,
})

process.exit(result.status ?? 1)
