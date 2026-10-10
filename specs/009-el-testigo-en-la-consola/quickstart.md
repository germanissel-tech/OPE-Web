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

**2026-10-10, contra el backend real** (`main` con la 043, `npm run dev` sobre el almacén durable). La otra
pestaña fue la API con el mismo operador: escribe en el medio igual que una pestaña, y se ve qué mandó.

| paso | lo que pasó |
|---|---|
| 1 y 2 | Abierta la plataforma, la API publicó el reintento en 9 s; la consola cambió la sesión a 45 min y publicó: `412`, relectura, segundo intento con el testigo nuevo. Ese intento fue `409` —había un experimento activo y la sesión cuenta—; con motivo, `201`: la versión 251 tiene 45 min **y** 9 s. |
| 3 | La API pasó el reintento a 11 s y la consola tecleó 13: `412`, relectura, y el choque «Reintento sugerido · Al abrir: 9 · Ahora: 11»; ningún segundo `POST`, y el 13 sigue en el campo. |
| 4 | Merchant nuevo de prueba. Abierta su publicación, la API declaró el anclaje `price` en `.precio`; la consola declaró el holdout en 9 % y publicó: `412`, relectura, `201`. La versión 2 tiene `holdoutShare: 0.09` y el anclaje `.precio`. |
| 5 | Abierta la identidad, la API apagó el interruptor (el testigo pasó de `:1` a `:2`); la consola cambió el nombre y guardó: `412`, relectura, `200`, sin aviso de choque. La ficha dice el nombre nuevo y «Apagado». |
| 6 | El historial de la plataforma muestra en «Mediciones reiniciadas» los experimentos que reinició la 251. En el del merchant no se vio: el merchant de prueba no tiene experimento activo; lo cubre la prueba. |
| 7 | Abrir la versión 1 del merchant desde su historial: una sola petición, `GET …/configuration/versions/1`. |

**Lo que dejó a la vista**: el choque muestra los valores en unidades del contrato y sin formato —«9» y «11»
segundos se leen bien, una duración se leería en milisegundos—. No pierde nada ni decide mal; es presentación, y
queda en `estado.md` como lo que sigue.
