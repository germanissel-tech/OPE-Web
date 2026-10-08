# Estado, y de dónde viene

Lo que una sesión nueva necesita saber y **no puede deducir del código**.

Esto cambia; la [constitución](constitution.md) no. Si algo de acá contradice al repositorio,
manda el repositorio.

*Última revisión: 2026-10-08.*

## Dónde está cada cosa

| ruta | qué es | se puede tocar |
|---|---|---|
| `../backend` | **OPE-Backend**: el contrato (`contracts/openapi.yaml`), los ADR, `npm run dev` con operadores de desarrollo | sí, es nuestro — pero cada cambio es una feature suya |
| `../../../../Bitbucket/Tandil Stone Pulse/tandilia/granito` | El sistema de diseño. `@granito/ui` y `@granito/tokens` llegan por `file:` | **no** — sólo lectura |
| `../../../../Bitbucket/Tandil Stone Pulse/tandilia/cuarzo` | La aplicación base de la que nace la copia (`9bd4009`) | **no** — sólo lectura |
| `contracts/ope/` | El contrato sincronizado; su `README.md` dice de qué commit del backend salió | con `npm run contract:sync`, nunca a mano |

## Qué hay hoy

**La feature 005 —la base— está construida**: el monorepo, el contrato como artefacto, Problem
Details y el cursor en el núcleo, la puerta agnóstica con el bearer, y el hola mundo `merchants`
verificado contra el backend real. Los seis tramos están en `specs/005-la-base-de-ope/tasks.md`,
cada uno con su nota fechada de lo que se desvió.

**Los números no se escriben acá.** `npm test` informa cuántas decisiones hay, cuántas abiertas,
cuántas citas resuelven, y cuántas operaciones y capacidades tiene el módulo del contrato.

## Lo que sigue

1. **Las pantallas del panel de la consola**: la feature siguiente, con el alcance que decida el
   dueño. Se copian de `features/merchants`.
2. **El portal** (`apps/portal`), copiando `apps/console` según `docs/segunda-aplicacion.md`.
3. **Granito en npm**, que se prepara aparte y reemplaza el `file:`.

## Las muletas de la 040

Dos cosas viven acá con nombre y comentario **hasta que OPE-Backend publique su feature 040**, y se
sacan cuando llegue:

| muleta | dónde | se reemplaza por |
|---|---|---|
| `identify` sondea `listMerchants?limit=1` y la barra dice `operator` | `apps/console/src/api/ope/identity.ts` | `getOperator` → `{ operatorId, displayName?, scope }` |
| `contract-sync` emite `capabilities.*` e `identity.json` desde el bundle | `scripts/contract-sync.mjs` | copiar `generated/contract/` del backend |

Lo que la 040 tiene que traer además, pedido en `specs/005-la-base-de-ope/plan.md`: `X-Request-Id`
en toda respuesta y `requestId` en el problema; `errors[]` con `pointer` en el
`422 origin-already-registered` (hoy llega sin ellos); `displayName` opcional en los operadores con
la constitución VII del backend acotada; y el emisor de `generated/contract/` con la forma de
`specs/005-la-base-de-ope/contracts/contract-artifact.md`.

## Lo que está roto o incómodo en el entorno

- **La vista de ingreso y las vistas de `anonymous` y `ended` se dibujan sin el shell de granito**
  (tipografía por omisión). Es herencia de cuarzo, cosmético, y queda para cuando se escriban las
  vistas propias de la consola.
- **La columna «Alta» muestra el instante ISO entero** aunque pide `format: 'date'`: granito espera
  una fecha sin hora. Se resuelve con el formato de instante cuando granito lo tenga, o
  formateando en `data/`.
- **El `409 merchant-deactivated` no se puede ver desde el hola mundo**: desactivar dos veces es
  `200` por contrato; el `409` lo dan operaciones del panel (`setKillSwitch`).
