# Cómo se comprueba · La pila de flujo

**Carpeta**: `003-la-pila-de-flujo` · **Fecha**: 2026-08-23

Lo que las pruebas agarran solas está en `npm test`. Acá va **lo que sólo se ve en un navegador de
verdad**, que es poco y por eso importa: si esta lista crece, algo se está dejando sin mecanizar.

```bash
npm run simulado    # el backend simulado en :4010
npm run dev         # el esqueleto
```

---

## Lo que la máquina no puede mirar

**1 · Sobrevivir al F5.** Filtrar el catálogo, ir a la página tres, abrir un artículo, y recargar.
Tiene que volver **el mismo artículo**, y cerrar tiene que devolver a la grilla **con el filtro y la
página**. Ni la memoria ni jsdom recargan, así que esto no lo cubre ninguna prueba.

**2 · Que el rebote del «atrás» no se vea feo.** Escribir algo en la ficha, apretar «atrás», y mirar
la pantalla, no el resultado. El ruteador deja que el navegador se mueva y lo devuelve; la pregunta
es si eso se percibe como un parpadeo. **Si molesta, es un pedido a granito y no un parche acá.**

**3 · El enlace pegado.** Copiar la dirección de un artículo, abrirla en una pestaña nueva, y
cerrar. Tiene que caer en la grilla del catálogo, no en un vacío.

**4 · Que el filtro se comparta.** Filtrar, copiar la dirección, abrirla en otra pestaña: tiene que
aparecer filtrada. Es lo que se gana al mudar `useTableQuery` a la URL, y lo que se pierde si se
hizo mal.

**5 · Que el menú se sienta bien.** Estando adentro de una ficha, abrir «Acerca de» desde el menú de
usuario y cerrarla: tiene que volver **a la ficha**. Después, el ítem del menú lateral: tiene que
llevar al catálogo limpio. **Son dos gestos parecidos con resultados distintos a propósito**, y esto
es exactamente lo que hay que sentir antes de darlo por bueno.

---

## Lo que sí agarra una prueba, y no hace falta mirar

Está acá para que no se revise a mano por las dudas:

- Los tres verbos, con la regla de desenrollado y la identidad pantalla + parámetros.
- Los siete casos del botón «atrás», **incluidas las dos arrugas** —la entrada «adelante» que queda
  viva, y el «atrás» que no se ve después de terminar—. Se prueban para que queden fijadas: si
  alguien las cambia sin querer, falla.
- El aviso de trabajo sin guardar en los cuatro caminos, que **no** aparezca al terminar, y que
  cancelar deje la pila y el flujo como estaban.
- Las seis comprobaciones de arranque, cada una con su caso roto.
- Que una pantalla no importe a otra pantalla.

---

## El punto de control

**El catálogo entero, a mano, sin volver a filtrar nunca.** Ése es el criterio, y es el de `GR-73`:
*«perder dónde estabas te obliga a rehacer el camino»*. Si en algún momento hay que volver a
escribir el filtro, algo falta.

Y granito avisó que `GR-73` **se trazó en papel**. El catálogo es el primer flujo real, así que lo
que aparezca acá es material para ellos y no un parche de este lado.
