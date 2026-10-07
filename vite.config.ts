import { cuarzoBuild } from '@cuarzo/core/build'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * `config.json` vive en `public/`, así que se copia tal cual al artefacto y se
 * lee al arrancar en vez de hornearse al compilar (CU-17). Eso es lo que
 * permite promover **una sola compilación** de pruebas a producción.
 *
 * Y por CU-36 tiene que servirse **sin caché**. Eso es una cabecera del
 * servidor que publica, no algo que Vite pueda garantizar: si el navegador lo
 * guarda, promover el mismo artefacto no cambia nada y la aplicación apunta al
 * emisor equivocado sin que falle nada.
 */
export default defineConfig({
  /* `cuarzoBuild` hornea qué compilación es ésta —versión y commit— para el
     registro (`CU-35`). Es un complemento y no un `define` acá porque copiado
     se borra, y entonces el tablero deja de poder decir de qué build vino cada
     cosa sin que nada falle. */
  plugins: [react(), cuarzoBuild()],

  /**
   * **Un solo React.**
   *
   * granito lo declara como par —correctamente—, pero se instala con `file:` y
   * trae el suyo en su `node_modules` para poder construirse. Sin esto, un
   * componente de granito toma ese React y el nuestro toma el otro: **dos
   * instancias, y los ganchos dejan de funcionar** con un `useContext` de
   * `null` que no dice nada.
   *
   * Vite lo resuelve solo al servir; Vitest no.
   */
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: true },
})
