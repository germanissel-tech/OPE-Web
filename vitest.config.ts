import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const ROOT = dirname(fileURLToPath(import.meta.url))

/**
 * Las pruebas de todo el monorepo, desde la raíz.
 *
 * Los paquetes prueban en `tests/` aparte de su `src/`, porque lo que está en su
 * `src/` se publica; una aplicación prueba al lado de lo que prueba (`CU-15`).
 * Los dos lugares se nombran acá, y nada más: un patrón más ancho agarraría
 * `node_modules` de granito, que viene enlazado por `file:` con sus pruebas.
 */
export default defineConfig({
  plugins: [react()],

  /**
   * **Un solo React.**
   *
   * granito lo declara como par —correctamente—, pero se instala con `file:` y
   * trae el suyo en su `node_modules` para poder construirse. Sin esto, un
   * componente de granito toma ese React y el nuestro toma el otro: **dos
   * instancias, y los ganchos dejan de funcionar** con un `useContext` de
   * `null` que no dice nada. Vite lo resuelve solo al servir; Vitest no.
   */
  resolve: {
    dedupe: ['react', 'react-dom'],
    /**
     * **Las aplicaciones prueban contra el código fuente de los paquetes**, no
     * contra `dist/`. Con `dist/`, Vitest carga `@ope/core` como dependencia
     * externa y la pantalla termina con dos Reacts —el del paquete compilado y
     * el de la prueba— y un `useReducer` de `null` que no dice nada. Las
     * pruebas de los paquetes ya importan `../src`; esto hace lo mismo para
     * las de `apps/`.
     */
    alias: [
      {
        find: /^@ope\/core\/testing$/,
        replacement: resolve(ROOT, 'packages/core/src/testing/index.ts'),
      },
      { find: /^@ope\/core$/, replacement: resolve(ROOT, 'packages/core/src/index.ts') },
      {
        find: /^@ope\/session\/(fake|bearer)$/,
        replacement: resolve(ROOT, 'packages/session/src/$1.ts'),
      },
      { find: /^@ope\/session$/, replacement: resolve(ROOT, 'packages/session/src/gate.tsx') },
    ],
  },

  test: {
    include: [
      'packages/*/tests/**/*.test.{ts,tsx,mjs}',
      'apps/*/src/**/*.test.{ts,tsx}',
      'tests/**/*.test.mjs',
    ],
    /* El artefacto del contrato se sincroniza, no se prueba: lo vigila
       `ope-check conformity`. */
    exclude: ['**/node_modules/**', 'contracts/ope/**'],
    /**
     * **granito se procesa, no se carga como externo.** Cargado por Node, su
     * `Table` trae `@tanstack/react-virtual` desde el `node_modules` de granito
     * y ése pide **el React de granito**: dos instancias, y `useReducer` de
     * `null`. Procesado por Vite, sus `import 'react'` pasan por `dedupe` y
     * caen en el nuestro. Las pruebas del núcleo no lo notaron porque ninguna
     * dibujaba una `Table`.
     */
    server: { deps: { inline: [/@granito\//, /@tanstack\/react-virtual/] } },
  },
})
