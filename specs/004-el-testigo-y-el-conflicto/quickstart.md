# Cómo se comprueba · El testigo y el conflicto

**Carpeta**: `004-el-testigo-y-el-conflicto` · **Fecha**: 2026-08-29

Lo que las pruebas agarran solas está en `npm test`. Acá va **lo que sólo se ve mirando**, que son
dos cosas — y que sean dos es la señal de que lo demás está mecanizado.

```bash
npm run simulado    # el simulado, que ahora emite el testigo y lo hace cumplir
npm run dev
```

---

## Cómo provocar el choque a mano

Hace falta simular al otro editor. Con dos pestañas alcanza:

1. Abrir un artículo para editar en **las dos**.
2. En la primera, cambiar algo y guardar.
3. En la segunda —que quedó con el testigo viejo—, cambiar algo y guardar.

La tercera es la que dispara todo.

---

## Lo que la máquina no puede mirar

**1 · Que la comparación se entienda de un vistazo.** Es la que más importa y la única para la que no
hay red. Cambiar **el mismo campo** en las dos pestañas y mirar el diálogo: ¿se entiende qué había
cuando abriste y qué hay ahora, sin leerlo dos veces?

**Está compuesto con piezas de granito** —el `Dialog` y `FormattedValue`— porque no tienen un
componente de comparación. Si no se entiende, **es una propuesta a granito y no un parche acá**
(principio IV, investigación §5).

**2 · Que el texto no prometa quién escribió.** Leer el aviso: no puede decir «otro operador». Con el
legacy escribiendo sobre la misma base, el cambio puede no venir de nadie del panel — lo dice `CU-29`
de este lado y `ADR-012` del backend.

---

## Lo que sí agarra una prueba, y no hace falta mirar

Está acá para que no se revise a mano por las dudas:

- **El caso sin cruce**: cambiar campos distintos en cada pestaña y guardar. **No tiene que aparecer
  nada**: se guarda sobre la versión nueva y listo. Es el caso frecuente, y el que decide si esto es
  una protección o un estorbo.
- Que lo tecleado sobreviva al choque, entero.
- Que el segundo rechazo seguido no reintente solo.
- Que una escritura sobre una operación que declara testigo **no compile** sin él.
- Que el conflicto no caiga en el camino de los errores de campo (`CU-38`).
- Que el aviso lleve el identificador del pedido (`CU-4`).

---

## El punto de control

**Editar un artículo, provocar el choque, y que el operador pueda decidir sin haber perdido nada.**

Y el criterio negativo, que es el que se olvida: **cambiar campos distintos no tiene que interrumpir
a nadie**. Si aparece un diálogo ahí, la protección se volvió el estorbo que `CU-29` quería evitar —
y eso no lo dice ninguna prueba tan claro como usarlo dos minutos.
