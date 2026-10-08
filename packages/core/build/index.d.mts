/**
 * **Qué compilación es ésta**, horneada al compilar (`CU-35`).
 *
 * Una línea en `vite.config.ts`, y cuarzo decide qué la identifica: la versión
 * de `package.json` y el commit corto. Sin repositorio lo dice —`+sin-commit`—
 * en vez de mentir con una versión que parece precisa.
 *
 * Define `__OPE_BUILD__`, que es lo que se le pasa a `bootstrapApplication`.
 *
 * ## Por qué el tipo se declara acá y no se importa de vite
 *
 * Esto decía `import type { Plugin } from 'vite'`, y con eso **vite entraba en
 * la superficie pública del paquete**. Instalado desde un `.tgz` no se nota:
 * el paquete vive bajo el `node_modules` de la aplicación y resuelve su único
 * vite. Enlazado por carpeta —que es como se consume un paquete hermano sin
 * registro— TypeScript resuelve desde la ruta real y toma **el vite de
 * cuarzo**: dos instalaciones de la misma versión, dos identidades de tipo
 * estructuralmente idénticas, y comparar `UserConfig` contra sí mismo agota el
 * límite de profundidad con `TS2321`.
 *
 * Es la misma clase de problema que `vite.config.ts` ya describe para React
 * —«dos instancias, y los ganchos dejan de funcionar»— pero en tipos, y sin un
 * `dedupe` que lo tape: ahí el comentario dice que «Vite lo resuelve solo al
 * servir; Vitest no». `tsc` tampoco.
 *
 * Lo encontró `las-animas/admin`, la primera aplicación, al salir del
 * directorio temporal donde el ritual la había dejado apuntando.
 *
 * **Se declara la forma que se devuelve, que es todo lo que vite necesita.** Un
 * complemento es un objeto con nombre y ganchos, y éste tiene uno solo. Con eso
 * el paquete deja de nombrar a vite en su API, y las dos instalaciones dejan de
 * tener que ser la misma.
 *
 * `vite` igual se declara como `peerDependency`: **corre adentro de su
 * compilación**, y un paquete que no lo declara le pide a npm que resuelva algo
 * que nadie pidió.
 */
export declare function opeBuild(): {
  readonly name: 'ope-build'
  config(
    config: unknown,
    env: { readonly command: 'build' | 'serve' },
  ): { readonly define: Readonly<Record<string, string>> }
}
