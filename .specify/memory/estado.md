# Estado, y de dónde viene

Lo que una sesión nueva necesita saber y **no puede deducir del código**.

Esto cambia; la [constitución](constitution.md) no. Si algo de acá contradice al repositorio,
manda el repositorio.

*Última revisión: 2026-10-09.*

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

**La feature 006 —el merchant completo— está construida**: el alta como pantalla de dos pasos que
muestra las credenciales una sola vez (`OW-8`), la rotación de las tres llaves como pantalla, el
interruptor y la desactivación con confirmación, y el registro de administración del merchant en su
ficha. Trajo al núcleo `ConfirmDialog`, `SecretOnce`, `onRejected` en `useAction`, renglones en
`useForm` y `screenAt`; y pagó la deuda de `CU-38`: las restricciones se emiten del bundle. Los
cuatro tramos están en `specs/006-el-merchant-completo/tasks.md`, con sus notas fechadas.

**Los números no se escriben acá.** `npm test` informa cuántas decisiones hay, cuántas abiertas,
cuántas citas resuelven, y cuántas operaciones, capacidades y esquemas tiene el módulo del contrato.

## Lo que sigue

1. **La configuración versionada** (merchant, plataforma, defaults de tratamiento): la feature
   siguiente del panel, con el alcance que decida el dueño. Copia de `features/merchants` la forma de
   una pantalla de alta, una acción con confirmación y una grilla de registro. Después, experimentos
   y textos; y el registro de toda la plataforma (`listAdminLog`) con la pantalla que tenga a la
   plataforma por sujeto.
2. **El portal** (`apps/portal`), copiando `apps/console` según `docs/segunda-aplicacion.md`.
3. **Granito en npm**, que se prepara aparte y reemplaza el `file:`.

## Las muletas de la 040

Tres cosas viven acá con nombre y comentario **hasta que OPE-Backend publique su feature 040**, y se
sacan cuando llegue:

| muleta | dónde | se reemplaza por |
|---|---|---|
| `identify` sondea `listMerchants?limit=1` y la barra dice `operator` | `apps/console/src/api/ope/identity.ts` | `getOperator` → `{ operatorId, displayName?, scope }` |
| `contract-sync` emite `capabilities.*` e `identity.json` desde el bundle | `scripts/contract-sync.mjs` | copiar `generated/contract/` del backend |
| `contract-sync` emite `constraints.{js,d.ts}` desde `components.schemas` (`CU-38`, capa 1) | `scripts/contract-sync.mjs`, `emitConstraints` | copiar `constraints.*` de `generated/contract/` |

Lo que la 040 tiene que traer además, pedido en `specs/005-la-base-de-ope/plan.md` y
`specs/006-el-merchant-completo/plan.md`: `X-Request-Id` en toda respuesta y `requestId` en el
problema; `errors[]` con `pointer` bajo `/body` en los `422` de invariante
(`origin-already-registered`, `rotation-grace-too-long`: hoy llegan sin ellos y caen al pie del
formulario o al aviso); `displayName` opcional en los operadores con la constitución VII del backend
acotada; y el emisor de `generated/contract/` con la forma de
`specs/005-la-base-de-ope/contracts/contract-artifact.md` más
`specs/006-el-merchant-completo/contracts/constraints-artifact.md`.

## Lo que está roto o incómodo en el entorno

- **«Cargar más» sigue siendo texto compuesto sin la tarjeta de granito**: el `LoadMore` de granito
  exige un total y OPE no lo tiene (`OW-4`). Se ve correcto pero no se parece al paginador; se
  resuelve cuando granito acepte la propuesta.
- **La barra de la grilla de merchants queda con la fila de filtros vacía**: `listMerchants` no
  filtra, y granito reserva el renglón igual. Se llena cuando el contrato tenga filtro, o se pide a
  granito una barra sólo de acciones.
- **«Copiar» ocupa el ancho entero debajo del valor, y «copiado» corre el pie del formulario al
  aparecer**: `SecretOnce` compone `Value` y `Button` dentro de un `Field`, y granito no tiene una
  pieza para «un valor que se copia y se va» (`OW-8`, propuesta). Se ve correcto; no se parece a un
  control.
- **El `422` de la gracia de rotación va al aviso y no al campo**: el backend no manda `errors[]`
  (040). La prueba con `pointer /body/graceSeconds` ya está y pasa con el servicio de mentira.
- **El almacén de desarrollo de esta máquina tiene una versión de plataforma con
  `rotationGraceMaxMs: 1`** (`platform-85`, de pruebas del backend): toda gracia mayor que cero da
  `422`. Con `config/platform.json` limpio el máximo son siete días. No es de la consola.
