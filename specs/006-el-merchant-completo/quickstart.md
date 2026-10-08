# Cómo se comprueba · El merchant completo

**Carpeta**: `006-el-merchant-completo` · **Fecha**: 2026-10-08

Lo que una persona corre para ver que la feature hace lo que la spec dice. Las cifras de estado no
van acá: las informan `npm test` y `ope-check`.

## Lo que hace falta

- OPE-Backend al lado (`../backend`) con `npm run contract:check` corrido: deja `contracts/dist/`
  y `generated/` para `contract:sync`.
- El operador de desarrollo de `config/dev-operators.json` del backend y su token (el `README.md`
  del backend lo dice; nunca va en `config.json`).
- Granito en su carpeta hermana de Tandilia, sólo lectura.

```sh
# en ope/mvp/web
npm install
npm run contract:sync      # trae constraints.{js,d.ts} además de lo de siempre
npm test                   # ope-check (conformity con CONSTRAINTS), pruebas de core, session y console
```

## Contra el backend real

```sh
# terminal 1 — en ope/mvp/backend
npm run dev                # :3000, almacén durable: lo que se cree queda entre reinicios

# terminal 2 — en ope/mvp/web
npm run dev                # :5173, /api → :3000
```

Abrir `http://localhost:5173/?dev.bearer=1`, pegar el token del operador de desarrollo.

### Escenario 1 · El alta

1. Grilla → «Nuevo merchant» (en la barra; o en el vacío si no hay ninguno). Es una pantalla,
   `/merchants/new`, con el formulario de granito.
2. Un origen `tienda.example` sin esquema → al salir del campo, el renglón marca el error de forma;
   **no se envía**.
3. `https://tienda.example`, sin firma → «Crear». La misma pantalla pasa al paso de credenciales:
   **dos** valores (`ingest`, `platform`), cada uno con «copiar», y el aviso de que no vuelven.
4. «Copiar» dice «copiado». Pegar en cualquier lado: es el valor.
5. «Continuar» → la ficha del merchant nuevo. **Atrás del navegador** → la grilla, no el alta.
6. Repetir con `https://tienda.example` → `422 origin-already-registered`: hasta la 040, al pie del
   formulario con el `detail`; con la 040, en el renglón.
7. Alta con firma → tres valores.

### Escenario 2 · La rotación

1. Ficha → en la credencial `ingest`, «Rotar». Pantalla `/merchants/<id>/rotate/ingest` con el
   texto de qué deja de valer y el campo de gracia en `0`.
2. Gracia `700000` → «Rotar» → `422 rotation-grace-too-long` **en el campo** (el máximo de la
   plataforma es `604800000 ms`, siete días: `config/platform.json` del backend).
3. Gracia `3600` → el valor nuevo con «copiar», y «la anterior vale hasta» con el instante.
4. «Volver» → la ficha, con el `issuedAt` nuevo en esa credencial.
5. En un merchant creado **sin firma**, rotar `signing` → se crea el secreto; la ficha ahora lista
   tres credenciales.
6. `/merchants/<id>/rotate/banana` a mano → «no existe».

### Escenario 3 · El interruptor

1. Ficha → «Apagar OPE». Diálogo con la consecuencia; «Cancelar» no hace nada.
2. Confirmar → la pastilla dice «Apagado» en la ficha y en la grilla; el botón ahora es «Encender».
3. «Encender» → confirma igual → «Activo».

### Escenario 4 · Desactivar

1. Ficha → «Desactivar». Diálogo con la consecuencia en tono de peligro.
2. Confirmar → «Desactivado»; la ficha **no ofrece** rotar, apagar ni desactivar.

### Escenario 7 · Dos operadores

1. Dos pestañas con la ficha del mismo merchant activo.
2. En la pestaña A, desactivar. En la B (sin recargar), «Apagar OPE» → confirmar.
3. B muestra el aviso de rechazo con el `detail` del servidor (`409 merchant-deactivated`) y **la
   ficha se refresca sola**: «Desactivado», sin botones.

### Escenario 5 · El registro

1. Ficha → sección «Registro». Lo más nuevo primero: el `setKillSwitch` rechazado del escenario 7,
   el `deactivateMerchant`, las rotaciones, el `createMerchant`. Resultado como pastilla; el código
   del problema en los rechazados.
2. Con más de un tramo (hacer veinte apagar/encender): «Cargar más» acumula y la dirección gana
   `log.c=…`. Pegar esa dirección en otra pestaña reproduce ese tramo.
3. Un merchant recién creado por otro camino (importado): «Todavía nadie hizo nada».

### Escenario 6 · Sin una capacidad

Con la sesión falsa: `http://localhost:5173/?dev.papel=lectura` → ni «Nuevo merchant», ni «Rotar»,
ni «Apagar», ni «Desactivar»; el registro **sí** (`log:read` es de lectura). Con `?dev.papel=ninguno`
→ la grilla no está en el menú y la ruta responde «sin permisos».

## Sin backend

```sh
npm run dev                # la sesión falsa con todas las capacidades
```

Todo se dibuja; las acciones fallan con «no se pudo» y el identificador ausente, que es lo que la
spec dice de un backend que no está.

## Romperle algo a cada comprobación

| comprobación | cómo se rompe | qué tiene que decir |
|---|---|---|
| `conformity` | en `contracts/ope/constraints.js`, sacar `'signature'` de `required` de `MerchantCreate` | que `MerchantCreate.required` no coincide con el bundle |
| telemetría sin secretos | plantar `console.log(value)` o `telemetry.record({ … value })` en `SecretOnce` | la prueba de `new-merchant-screen.test.tsx` falla porque lo registrado contiene el valor |
| `verifyFlows` | quitar `finishes(merchants.outcomes.merchantCreated, …)` de `flows.ts` | el arranque falla nombrando el desenlace sin cablear |
| `decisions` | citar `OW-<inexistente>` en un comentario | la cita no resuelve |

Dejar todo como estaba después de cada una.

## Lo que la máquina no puede mirar

- Que `SecretOnce` componga: un valor largo y un botón, legibles en una columna.
- Que cada consecuencia diga lo que pasa y no lo que se aprieta.
- Que el registro se lea como registro: lo más nuevo arriba, la hora con su zona.

## El punto de control

La feature está construida cuando los siete escenarios de arriba pasan a mano contra el backend
real, `npm test` está en verde con las comprobaciones nuevas rotas una vez cada una, y `estado.md`
lista la tercera muleta con su fecha de vencimiento.
