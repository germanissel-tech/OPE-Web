import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

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
  resolve: { dedupe: ['react', 'react-dom'] },

  test: {
    include: [
      'packages/*/tests/**/*.test.{ts,tsx,mjs}',
      'apps/*/src/**/*.test.{ts,tsx}',
      'tests/**/*.test.mjs',
    ],
  },
})
