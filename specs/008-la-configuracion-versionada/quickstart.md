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

**Tramo 1 (2026-10-10)** · El núcleo: las unidades (`rateToPercent`, `durationIn`, `exactDecimals`),
`constraintsOf` que sigue los `ref` y una lista como destino de su error. Rotas a propósito: la tasa
multiplicando por 100 (cae con `0.07`), la duración que redondea (cae con `0.0001 s`).

**Tramo 2 (2026-10-10)** · Escenario 1: «Tienda Norte» con las tres versiones que rigen, cada valor en
su unidad y con su origen («Heredado de defaults-1», «Declarado por el merchant»), lo propio y el
historial. La plataforma se ve desde el menú.

**Tramo 3 (2026-10-10)** · Escenario 2: en «Tienda Sur», declarar el holdout en `7` publicó la
versión 1 y la vista dijo `7 %` «Declarado por el merchant». Escenario 3: con un experimento abierto
y activado por la API sobre «Tienda Sur» —el de la semilla lo habían cerrado las pruebas del
backend—, el `409` marcó la correctiva y pidió el motivo; con motivo, la versión 2 quedó correctiva
en el historial. «Declarar» se estiraba a todo el ancho del campo, y publicar preguntaba por cambios
sin guardar: los dos se arreglaron ahí.

**Tramo 4 (2026-10-10)** · Escenario 4: el menú tiene «Plataforma» y «Defaults de tratamiento». La
plataforma (`platform-160`, que dejaron las pruebas del backend en el almacén) se ve en su unidad, y
lo que no entra exacto en la suya, en la del contrato (`524907 ms`). La versión 160 se abre de sólo
lectura y se vuelve. Con un experimento activo sobre «Tienda Sur», 45 min de sesión volvió `409`;
la sección correctiva quedaba arriba, fuera de la vista —ahora el motivo se enfoca solo—; con
motivo se publicó la 161 y el aviso dijo «reinició la medición de exp_nliucusmyzzd». Los defaults
publicados sin tocar nada dijeron «No cambió nada · Sigue la versión 1»: el cuerpo, con la política
de decisión copiada, es el que rige. El experimento se cerró. Escenario 5: no se ve en el navegador
—la sesión falsa no manda credencial y la vista recibe `401`—; lo afirman la prueba de los niveles
globales (sin alcance total no hay «publicar», en los dos) y la de `capabilitiesOf`. La sesión falsa
tiene el papel `acotado` para cuando haya datos de mentira. La columna «Mediciones reiniciadas» queda
vacía contra el backend: el historial no las devuelve (spec, «Lo que queda abierto»).

**Tramo 5 (2026-10-10)** · `npm test`, `npm run revisar` y `npm run build` en verde.
