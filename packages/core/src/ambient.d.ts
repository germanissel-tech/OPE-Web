/**
 * La hoja de estilos de granito, declarada **acá y no en la aplicación**.
 *
 * `bootstrap.tsx` la importa, así que el paquete la necesita para compilar por
 * su cuenta — y eso es lo que publicar exige (`CU-40`).
 *
 * `vite/client` no alcanza: declara `*.css` para rutas de archivo, y
 * `@granito/ui/css` es una subruta de `exports`, no un archivo. **Es un hueco
 * de empaquetado de granito** —sus entradas `./css` no declaran `types`— y está
 * pedido; mientras tanto se cubre de este lado, sin tocar el repositorio de al
 * lado (principio IV).
 */

declare module '@granito/ui/css'
