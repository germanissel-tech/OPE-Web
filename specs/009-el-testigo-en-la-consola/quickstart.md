# Cómo se verifica · El testigo en la consola

## Lo que hace falta

- OPE-Backend con la 043 en `main` y `npm run dev` corriendo (el almacén durable: el de memoria no serializa).
- `npm run contract:sync` en OPE-Web, con el contrato `1.15.0`.
- La consola en `http://localhost:5173/?dev.bearer=1`, con el token del operador de desarrollo.

## Contra el backend real, con dos pestañas

1. **Sin nadie en el medio**: publicar la plataforma cambiando un valor → «Se publicó la versión».
2. **Otro valor en el medio**: abrir la publicación de la plataforma en las dos pestañas; en la primera cambiar el
   reintento sugerido y publicar; en la segunda cambiar la duración de la sesión y publicar → se publica sin
   avisar nada, y la versión nueva tiene los dos cambios.
3. **El mismo valor en el medio**: lo mismo, cambiando el mismo valor en las dos → la segunda muestra el choque con
   el valor de antes y el de ahora; lo tecleado sigue.
4. **La configuración de un merchant**: lo mismo sobre la de un merchant; en el medio, publicar desde la API un
   cambio de un anclaje → la segunda publica y el anclaje nuevo sigue estando.
5. **La identidad después del interruptor**: abrir la edición de la identidad, apagar el interruptor desde la
   ficha en la otra pestaña, guardar la identidad → se guarda sin avisar nada.
6. **El historial**: con un experimento activo, publicar una correctiva → el historial muestra el experimento en
   «Mediciones reiniciadas»; también en el historial del merchant.
7. **Una versión vieja del merchant**: abrirla desde su historial → una sola petición en la pestaña de red.

## Romperle algo a cada comprobación

| se rompe | lo agarra |
|---|---|
| comparar los textos del formulario en vez de las hojas | la prueba del choque falso por unidad |
| lo no editado tomado de la versión de al abrir | la prueba del reintento del merchant |
| una escritura que olvida el testigo | la prueba del cliente, y el compilador |
| un valor declarado después de abrir que la fusión pierde | la prueba de la fusión con un valor nuevo |

## Lo corrido

_(se completa al implementar, con fecha, tramo por tramo)_
