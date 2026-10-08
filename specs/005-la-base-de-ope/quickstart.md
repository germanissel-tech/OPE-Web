# Cómo se comprueba · La base de OPE

**Carpeta**: `005-la-base-de-ope` · **Fecha**: 2026-10-08

Lo que las pruebas agarran solas está en `npm test`. Acá va **cómo se levanta contra el backend
real** —que ninguna prueba hace— y lo que sólo se ve mirando.

## Lo que hace falta

- Node 24 y `C:\Users\…\tandilia\granito` al lado del backend (sólo lectura: `@granito/*` se
  instala por `file:`).
- OPE-Backend al lado, en `../backend`, en un commit con `contracts/dist/openapi.yaml` y
  `generated/api.d.ts` al día (`npm run contract:check` allá los deja así).

```bash
# en ope/mvp/web
npm install
npm run contract:sync        # trae contracts/ope/ desde ../backend (o desde OPE_BACKEND_DIR)
npm test                     # ope-check, gate, vitest
```

## Contra el backend real

```bash
# terminal 1 — en ope/mvp/backend
node scripts/mint-admin-token.mjs dev-operator       # imprime el token UNA vez; copiarlo
#   (config/dev-operators.json ya trae a dev-operator con alcance *; si el token no es el suyo,
#    pegar la entrada que el script imprime en ese archivo)
npm run dev                                           # escucha en :3000 sobre el almacén durable

# terminal 2 — en ope/mvp/web
npm run dev -w apps/console                           # Vite en :5173, con /api → :3000
```

En el navegador, `http://localhost:5173`:

1. **La pantalla de ingreso.** Pegar el token y entrar. La barra de usuario dice `dev-operator`
   (o `operator`, mientras `getOperator` de la 040 no exista) y el rótulo «Todos los merchants».
2. **Un token inventado** dice «rechazado» y se queda en el ingreso. **Con el backend apagado** dice
   «no se pudo llegar al servidor».
3. **Merchants**: con un backend recién levantado, el **vacío** («todavía no hay merchants», con el
   botón de alta). Crear uno con el diálogo: un origen válido y firma. La grilla lo muestra.
4. **Cargar más**: crear más de los que entran en un tramo (`limit` por omisión del contrato), o
   bajar el `limit` en `merchants.ts` para verlo con pocos. La dirección gana `merchants.c=…`;
   copiar ese enlace en otra pestaña **reproduce ese tramo**; el botón dice «no hay más» al final.
5. **Error**: apagar el backend y recargar la grilla. El estado de error dice «sin identificador»
   mientras la 040 no mande `X-Request-Id`, y el botón «reintentar» vuelve al principio.
6. **Alcance** (`?dev.papel=lectura` sólo con la falsa; contra el backend, acuñar un operador con
   alcance acotado: `node scripts/mint-admin-token.mjs lectora m1`): el botón de alta y el de
   desactivar **no se dibujan**.
7. **Rechazo de negocio**: desactivar un merchant dos veces. La segunda es `409
   merchant-deactivated`: aviso con tono de rechazo, el `detail` del servidor, sin identificador.
   Crear un merchant con un origen que otro ya tiene: `422 origin-already-registered` con el
   mensaje **en el campo** `origins`.
8. **Un `401` en vuelo**: borrar el operador de `config/dev-operators.json` y reiniciar el backend
   sin recargar la consola; la próxima operación termina la sesión diciendo «el backend dejó de
   reconocer el token», con el botón para volver al ingreso.
9. **Recargar**: vuelve al ingreso. Es el costo del token en memoria y no un defecto.

> **Corrido el 2026-10-08, tramo 4**, con el token de desarrollo del backend (`ope_dev_admin_token`,
> el de `config/dev-operators.json`; no hizo falta acuñar) y la consola con `?dev.bearer=1`, que en
> desarrollo elige el bearer en vez de la falsa. Por curl a través del reenvío de Vite:
> `/api/v1/admin/merchants?limit=1` responde `200` con el token, y `401 operator-unknown` con uno
> inventado o sin ninguno. En el navegador, pasos 1 y 2: entrar muestra la consola con `operator ·
> TODOS LOS MERCHANTS` en la barra; un token inventado deja el aviso «El sistema no reconoce esa
> credencial» y vacía el campo. **El paso 8 no se corrió en vivo** (exige editar el backend y
> reiniciarlo); lo cubre `packages/session/tests/bearer.test.ts`. Lo que difiere: la vista de
> ingreso se dibuja **sin el shell de granito** (tipografía por omisión), igual que las vistas de
> `anonymous` y `ended` que cuarzo ya tenía fuera de `active`; es cosmético y queda para el tramo 6.

> **Corrido el 2026-10-08, tramo 5**, en el navegador con `?dev.bearer=1` y el token de desarrollo.
> Paso 3: la grilla trae los merchants del backend (dos desactivados de pruebas anteriores) con «2
> cargados · No hay más»; el alta de `https://hola-mundo.example` responde `201`, cierra el diálogo,
> refresca la grilla y avisa con el identificador y sin credenciales. Paso 7: un origen que ya es de
> otro merchant responde `422 origin-already-registered` **sin `errors[]`** —el contrato lo
> ejemplifica con `pointer: /origins/0`, y el backend hoy no lo manda—, así que llega como rechazo de
> negocio (aviso con el `detail`) y no al campo; queda pedido a la 040 junto con el prefijo `/body`.
> Desactivar responde `200`, la fila pasa a «Desactivado», el botón desaparece y `merchants.row`
> queda en la dirección; la ficha muestra estado, orígenes, alta y las tres credenciales por clase e
> instante. **Lo que no se corrió**: paso 4 (hacen falta más merchants que el tramo por omisión; lo
> cubre `merchants-screen.test.tsx` con cursor), paso 5 (lo cubre la prueba del `400` con
> «reintentar»), paso 6 (acuñar un operador exige tocar `config/dev-operators.json` del backend), y
> el `409 merchant-deactivated` del paso 7: desactivar dos veces es `200` por contrato, el `409` lo
> dan operaciones que el hola mundo no tiene (`setKillSwitch`). Lo que difiere: la columna «Alta»
> con `format: 'date'` muestra el instante ISO entero; granito espera una fecha sin hora.

## Sin backend

```bash
npm run dev -w apps/console
```

La sesión falsa entra sola con el papel `todo`; `?dev.papel=lectura` o `?dev.papel=ninguno` se
eligen una vez y se recuerdan. El marco se dibuja entero; la grilla queda en **error** porque no hay
quién responda —y ésa es la demostración de que la falsa autoriza y no inventa datos—.

```bash
npm run build -w apps/console && npx ope-check artifact
```

Lo compilado no lleva la marca de la falsa.

## Romperle algo a cada comprobación

Antes de creerle a una comprobación nueva o enmendada, se la hace fallar. Cada una debe decir **qué**
y **dónde**:

| comprobación | cómo romperla | qué tiene que decir |
|---|---|---|
| `conformity` | cambiar un carácter de `contracts/ope/identity.json` | «el contrato y el módulo se despegaron: corré `npm run contract:sync`» |
| `conformity` | borrar una operación de `capabilities.js` | la operación de `admin` que falta, por nombre |
| `decisions` | citar `OW-99` en un comentario de `packages/core/src` | «cita que no resuelve», con el archivo |
| `boundaries` | un `className` en `apps/console/src/features/merchants/` | el archivo y la regla de estilos propios |
| `artifact` | importar `@ope/session/fake` desde `main.tsx` sin el `import()` diferido, y compilar | «la implementación falsa está en el artefacto» |
| `packaging` | apuntar un `exports` de `@ope/core` a un archivo que no existe | el paquete y la ruta |
| `quality` | un comentario que narra un cambio («antes esto era…») | la regla y la línea |
| `tsc` | `opeOperation('listMerchants', …)` con `capabilities: ['merchants:reed']` en el módulo | no compila |
| `tests/gate.mjs` | exportar `getToken` desde `bearer.ts` | «la puerta dejó de ser puerta» |

## Lo que la máquina no puede mirar

**1 · Que la pantalla de ingreso diga lo que tiene que decir.** Qué pegar, de dónde sale, y que
pegar mal no es culpa de quien pega. Es la primera pantalla que ve un operador, y no hay red para
el texto.

**2 · Que «cargar más» se entienda sin total.** Compuesto con un `Button` y un texto; si no se
entiende cuánto hay y cuándo se acabó, es una propuesta a granito (`OW-4`), no un parche acá.

**3 · Que la prosa heredada no describa las-animas donde cambió.** `docs/origen.md` lista qué se
enmendó; leer cada `CU-n` enmendada y su «Enmienda OPE» una vez, de corrido.

## El punto de control

**Entrar con un token acuñado por el backend, ver los merchants con cursor en los cuatro estados, y
que un operador con menos alcance vea menos — sin que ninguna pantalla haya decidido nada de eso.**
