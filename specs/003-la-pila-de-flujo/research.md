# Investigación · La pila de flujo

**Carpeta**: `003-la-pila-de-flujo` · **Fecha**: 2026-08-23

Cuatro incógnitas, **medidas y no leídas**. La cuarta cambió lo que la especificación declaraba.

---

## 1 · Dónde vive la pila: `location.state`, no `history.state` crudo

**Decisión**: la pila y el flujo viajan en el `state` del ruteador, y no se toca la History API.

**Por qué**: React Router **ya es dueño** de `history.state` — guarda ahí lo suyo (`usr`, `key`,
`idx`). Escribir el nuestro al lado sería pelearle a la biblioteca por un lugar que ya administra,
y cada `navigate` nos lo pisaría.

Lo que hace `location.state` es exactamente lo que hacía falta:

- **Va por entrada**, no global. Ésa es la propiedad de la que depende todo el diseño: el flujo y la
  pila no son estado de la aplicación, son estado del escalón.
- **Vuelve al retroceder**, sin código nuestro. Medido: al ir a `/b` con `{ pila: ['a','b'] }` y
  retroceder, la pantalla es `a` y el estado es `null` — el de la entrada a la que se llegó.
- **Sale por `useLocation()`**, así que redibujar cuando el navegador se mueve es lo que React ya
  hace. Sin escuchar `popstate` a mano, que es donde estas cosas se desincronizan.

**Alternativa descartada**: `history.pushState` directo. Da control total y obliga a reimplementar
lo que el ruteador ya resuelve —y a coordinar dos dueños del mismo objeto.

**Lo que queda por verificar en un navegador de verdad**: que sobreviva al **F5**. El ruteador lo
serializa en `history.state`, que el navegador persiste al recargar, pero ni la memoria ni jsdom lo
pueden demostrar. Va a [`quickstart.md`](quickstart.md) como paso a mano.

## 2 · Cómo se desenrolla: `navigate(-n)`

**Decisión**: desenrollar es un solo `navigate(-n)`, con `n` calculado sobre la pila del estado.

**Medido**: con tres entradas y `navigate(-2)` se llega a la primera, en un paso.

**Por qué importa que sea uno solo**: retroceder de a uno dispararía un redibujo por escalón, y el
operador vería pasar las pantallas intermedias.

**El costo, que ya está escrito en la especificación**: retroceder deja las entradas de arriba
vivas, así que el botón «adelante» queda encendido. Se aceptó, con prueba.

## 3 · Cómo se sabe en qué flujo estamos: no se sabe, se lee

**Decisión**: no hay «flujo actual» en ningún lado. Se lee del `state` de la entrada donde estamos.

**Por qué**: cualquier copia en `useState` o en un contexto propio **se desincroniza con el botón
«atrás»** — el navegador retrocede y la copia sigue creyendo lo anterior. Es el defecto clásico de
mezclar historia con estado de React, y no aparece hasta que alguien usa el navegador como
navegador.

`useFlow()` es entonces **una lectura y una envoltura de `navigate`**, no un almacén.

**Cuando el estado viene vacío** —enlace pegado, pestaña nueva— aplica la regla ya decidida: el
flujo es el que arranca en la raíz de la funcionalidad de esa pantalla, con la pila vacía.

## 4 · El «atrás» sí se puede interceptar · **corrige la especificación**

**Decisión**: el aviso de trabajo sin guardar cubre también el botón «atrás», con `useBlocker`.

**La especificación decía lo contrario**, y con un argumento que suena bien:

> *«`popstate` avisa después de que el navegador ya se movió; no se puede cancelar»*

**Es cierto y no alcanza.** El ruteador no cancela: **rebota**. Deja que el navegador se mueva y lo
devuelve. La sonda lo muestra: con trabajo sin guardar, después de retroceder la pantalla sigue
siendo la misma y el bloqueo se observó.

```
después de atrás, estoy en: b        ← no se movió
bloqueos observados: ["b"]
```

**Por qué se corrigió antes de planificar y no después**: era **un límite declarado que no
existía**. Es la imagen espejo de lo que este repositorio persigue —una garantía declarada que no
existe— y engaña igual: quien lee la especificación deja de buscar.

**Lo que sigue sin cubrirse, y ahora sí es un límite de verdad**: **cerrar la pestaña y recargar**.
Eso es del navegador, no del ruteador; lo único disponible es su diálogo genérico, sin nuestro
texto y sin nuestros botones.

**Lo que queda por verificar en un navegador de verdad**: que el rebote no se vea feo. En memoria no
hay animación ni barra de direcciones. Va a [`quickstart.md`](quickstart.md), y es de las pocas
cosas que **sólo puede mirar una persona**.

---

## Cómo se midió

Una sonda temporal con `createMemoryRouter`, tres pruebas, borrada después de leerla. **No quedó en
el repositorio a propósito**: era para decidir, y lo que tiene que quedar son las pruebas de la
conducta que se implemente — una sonda que sobrevive se confunde con una garantía.

Lo que la sonda **no puede** decir está anotado arriba en cada punto, y va a los pasos a mano de
`quickstart.md`. La memoria no tiene barra de direcciones, no recarga, y no dibuja.
