# Cómo se comprueba · La configuración versionada

**Carpeta**: `008-la-configuracion-versionada` · **Fecha**: 2026-10-09

Lo que una persona corre para ver que la feature hace lo que la spec dice. Las cifras de estado no
van acá: las informan `npm test` y `ope-check`.

## Lo que hace falta

- OPE-Backend al lado (`../backend`) en su `main`, con `npm run contract:types` corrido.
- El operador de desarrollo del backend: la vista de ingreso muestra su credencial con
  `?dev.bearer=1`.
- **Dos merchants que se comportan distinto**: «Tienda de desarrollo» (`dev-merchant`) tiene en la
  semilla un experimento **activo**, así que toda versión no correctiva vuelve `409`; un merchant
  creado desde la consola, sin experimentos, publica directo.
- Granito en su carpeta hermana de Tandilia, sólo lectura.

```sh
# en ope/mvp/web
npm test                   # ope-check, pruebas de core, session y console
```

## Contra el backend real

```sh
# terminal 1 — en ope/mvp/backend
npm run dev

# terminal 2 — en ope/mvp/web
npm run dev
```

Abrir `http://localhost:5173/?dev.bearer=1` y entrar con la credencial que la vista muestra.

### Escenario 1 · La configuración de un merchant

1. Abrir la ficha de un merchant creado desde la consola → «Configuración» al pie.
2. La vista dice las tres versiones: `platform-N`, `defaults-N` y «sin versión propia».
3. Cada valor dice su origen: todos «heredado de los defaults».
4. Las tasas se leen con `%`; la frescura de stock, en minutos; la del catálogo, en horas.
5. El historial dice que todavía no hay versiones.

### Escenario 2 · Publicar, declarar y heredar

1. «Publicar una versión» → la pantalla precargada; todo heredado.
2. Declarar el holdout y ponerlo en `7` → publicar. El aviso dice «se publicó la versión 1».
3. La vista dice `7 %` con origen «declarado»; el historial muestra la versión 1 con el operador.
4. Publicar de nuevo sin tocar nada → «no cambió nada: sigue la versión 1».
5. Volver a heredar el holdout → publicar → versión 2; el holdout vuelve a «heredado».
6. Declarar una escalera que no crece (`5`, `3`) → el `422` cae en la escalera, no al pie.

### Escenario 3 · El congelamiento

1. Abrir la configuración de «Tienda de desarrollo» y publicar cualquier cambio.
2. Vuelve `409`: la pantalla explica que hay una medición en curso y pide correctiva con motivo, sin
   perder lo cargado.
3. Marcar correctiva sin motivo → error en el motivo, sin ir al servidor.
4. Con motivo → se publica; el historial la muestra correctiva, con su motivo.

### Escenario 4 · Plataforma y defaults

1. El menú tiene «Configuración» con «Plataforma» y «Defaults de tratamiento».
2. «Plataforma» → la versión que rige y sus valores en su unidad; el historial.
3. Publicar un cambio en la ventana de sesión → como el experimento de desarrollo la alcanza, vuelve
   `409`; correctiva con motivo → el aviso dice qué medición reinició (`exp_dev_000001`).
4. «Defaults de tratamiento» → los valores, más el resumen de la política de decisión.
5. Abrir una versión vieja del historial → lo que contenía, de sólo lectura.

### Escenario 5 · Lo que no se ve

1. `?dev.papel=lectura` (sesión falsa) → las tres vistas sin ningún «publicar».
2. Un operador con alcance acotado (`scope: ["…"]` en `config/dev-operators.json` del backend) →
   ve plataforma y defaults, sin «publicar»; publica la configuración de sus merchants.

## Romperle algo a cada comprobación

| se rompe | lo agarra |
|---|---|
| la tasa convertida multiplicando por 100 | la prueba de unidades, con `0.07` |
| una duración que redondea en vez de fallar | la prueba de unidades, con `0.0001 s` |
| el cuerpo que pierde `anchors` | la prueba de `configuration-body` |
| el error de la escalera mandado al pie | la prueba del núcleo con una lista como destino, y la de la publicación |
| `constraintsOf` que no sigue un `ref` | la prueba de `constraintsOf` con `freshness` |
| «publicar» en plataforma con alcance acotado | la prueba de la vista de plataforma |
| el aviso que dice «se publicó» sobre un `200` repetido | la prueba de la acción |

## Lo corrido

_(se completa al implementar, con fecha, tramo por tramo)_
