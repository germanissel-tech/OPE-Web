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

**La feature 007 —la identidad en el panel— está construida**: sacó las muletas de la 040 (`OW-5` y
`OW-7`, enmendadas), lista y encabeza al merchant por su nombre, pide el nombre en el alta y edita
la identidad entera desde la ficha con `updateMerchantProfile`. Trajo al núcleo las restricciones
como función de los valores y la forma `email` en `useForm`. Los cuatro tramos están en
`specs/007-la-identidad-en-el-panel/tasks.md`, con sus notas fechadas.

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

## Lo que la 040 y la 041 trajeron

OPE-Backend publicó la 040 (`ADR-044`) y la 041 (`ADR-045`), y **las tres muletas se sacaron en la
007**: `identify` es `getOperator` y la barra dice el nombre del operador (`OW-7`, enmendada);
`contract-sync` copia `generated/contract/` entera y falla si no está (`OW-5`, enmendada). Lo que la
040 trajo además ya se ve solo: `requestId` en todo aviso de error, y `errors[]` con `pointer` bajo
`/body` en los `422` de invariante, que caen en su campo. La 041 trae la identidad del merchant
—`displayName`, `storeUrl`, `contact`, `notes`— y `updateMerchantProfile`, que es lo que la 007
muestra y edita.

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
- **Un almacén de desarrollo puede traer una versión de plataforma de pruebas** (pasó el
  2026-10-09: `platform-85` con `rotationGraceMaxMs: 1`, y toda gracia mayor que cero daba `422`).
  Se limpió borrando `data/ope.db*` con el backend parado; con `config/platform.json` el máximo
  vuelve a siete días. No es de la consola; si vuelve a pasar, `GET /v1/admin/platform-configuration`
  lo dice.
