# De dónde viene OPE-Web

OPE-Web nace de **la copia literal de cuarzo**, la aplicación base de frontend de Tandilia, en su
commit `9bd4009` (2026-08-31). Cuarzo y granito son del mismo dueño que OPE, así que lo que se
hereda no es de un tercero: es nuestro, hecho para otro sistema. La decisión de copiar en vez de
usarlo como biblioteca está en `OW-1`.

**Este documento dice qué se heredó tal cual, qué se enmendó y qué se retiró.** Un agente que lo lee
junto con `CLAUDE.md` y la constitución sabe qué hay acá sin abrir Tandilia — que además es sólo
lectura.

Las decisiones heredadas conservan su identificador (`CU-n`) y su documento; las enmendadas ganan un
párrafo fechado **«Enmienda OPE»** debajo de su título; las nuevas son `OW-n` en
[`ope.md`](ope.md).

## Lo que se hereda tal cual

| qué | dónde | por qué sirve igual |
|---|---|---|
| La máquina de estados de la sesión (siete estados, `ended` terminal, `unauthorized` sin salida) | `packages/session/src/state.ts`, `store.ts`; `CU-8`, `CU-9`, `CU-11`, `CU-12` | Es agnóstica del proveedor; OPE sólo le agregó una transición (`OW-2`) |
| La regla de que nada exportado entrega una credencial | `packages/session/tests/gate.mjs`; `CU-10` | Es la razón de ser de la puerta, y vale con un bearer igual que con OIDC |
| El registro de pantallas, la navegación tipada y los flujos | `packages/core/src/base/{registry,flow,go-to,…}`; `CU-23`, `CU-41`, `CU-44`, `CU-47`, `CU-48` | No saben de contrato ni de negocio |
| Las acciones y la puerta de acciones | `packages/core/src/data/{action,use-action}.ts`; `CU-25`, `CU-34`, `CU-37`, `CU-46` | Cambia qué viaja adentro (`OW-3`, `OW-5`), no la forma |
| Los cuatro estados y el formulario de tres capas | `packages/core/src/ui/{result,result-of,use-form}`; `CU-4`, `CU-5`, `CU-24`, `CU-38` | Igual; `resultOf` recibe filas aplanadas (`OW-4`). `CU-38` está enmendada: la capa 1 se emite del bundle (`contract:sync`, feature 006) en vez de escribirse a mano |
| El manifiesto, la raíz de composición y el arranque | `packages/core/src/{app,base/manifest}`; `CU-17`, `CU-36`, `CU-42` | Igual; `provide` recibe la sesión entera (`OW-2`) |
| El catálogo de textos, las preferencias, los contextos de trabajo, la telemetría | `CU-26`, `CU-27`, `CU-35`, `CU-43` | Igual |
| Las comprobaciones: decisiones, límites, calidad, rótulos, artefacto, empaquetado, errores | `packages/core/checks/`; `TAN-6` | Recorren cada aplicación declarada en `ope.apps` (`OW-1`); ganan `conformity` (`OW-5`) |
| Biome, TypeScript `strict`, Vitest con Testing Library, Vite | `CU-16`, `CU-15` | Igual |
| El hola mundo `home` (bienvenida y «acerca de»), los flujos, el menú | `apps/console/src/features/home` | Igual; enlaza a merchants en vez de al catálogo |
| La constitución, salvo los principios I, III y VI | `.specify/memory/constitution.md` | Ver abajo |

## Lo que se enmienda

| decisión | fecha | qué cambió | motivo |
|---|---|---|---|
| `CU-7` · De dónde sale granito | 2026-10-08 | granito llega por `file:` a la carpeta hermana de Tandilia; después, desde npm | Tandilia es sólo lectura y granito todavía no está publicado |
| `CU-10` · La autenticación entra por una puerta | 2026-10-08 | Sin `issuer` ni `clientId` en la configuración; `signIn` y `observe` en el puerto; el adaptador es el bearer | `OW-2` |
| `CU-14` · Cómo se piden los datos | 2026-10-08 | Problem Details y cuerpos pelados; cursor sin total ni tamaño de página | `OW-3`, `OW-4` |
| `CU-20` · Cuarzo es la aplicación base, y se clona | 2026-10-08 | La segunda aplicación copia `apps/console` dentro del monorepo | `OW-1` |
| `CU-37` · Una acción declara sus operaciones | 2026-10-08 | `capabilities` del módulo del contrato en vez de `roles` generados por expresión regular | `OW-5` |
| `CU-40` · Qué publica cuarzo | 2026-10-08 | Los paquetes son workspaces privados; no se publican | `OW-1` |
| `CU-41` · El ruteador, y de dónde salen los tipos | 2026-10-08 | Sin cambio de fondo; se cita por el cursor en la URL (`<grilla>.c` en vez de `.p`) | `OW-4` |
| Constitución, principio I | 2026-10-08 | La spec y el plan se acuerdan; la feature se implementa con autonomía; lo que falta se pregunta con `clarify` | El ciclo de OPE es Spec Kit entero |
| Constitución, principio III | 2026-10-08 | «Cuarzo no sabe de negocio» pasa a «`packages/` no sabe de negocio» | El monorepo |
| Constitución, principio VI | 2026-10-08 | Se comparte la puerta, no el proveedor; el adaptador lo elige cada aplicación | `OW-2` |

Las enmiendas de cuarzo anteriores a la copia (2026-08-21 a 2026-08-24) vienen adentro, en
`decisiones.md`.

## Lo que se retira

| se retira | por qué | qué lo reemplaza |
|---|---|---|
| El protocolo de pedidos entre repositorios (`PEDIDOS.md`, `checks/requests.mjs`, `../pedidos/`) | Es de Tandilia (`TAN-5`) | Las propuestas a granito se anotan en `ope.md` y las lleva el dueño |
| El emisor de catálogo (`tests/catalogo.mjs`, `catalogo.json`) | Emitía lo que Tandilia consume (`TAN-8`) | Nada: OPE no tiene quién lo lea |
| El ritual de clonar entre repositorios (`tests/clone.mjs`, `npm run clon`) | La segunda aplicación copia `apps/console` adentro del mismo repositorio | [`segunda-aplicacion.md`](segunda-aplicacion.md) |
| El generador de roles por expresión regular (`tests/roles.mjs`, `emit.mjs`, `api/demo/roles.ts`) | Leía `demo.yaml`; el módulo del contrato lo reemplaza | `contracts/ope/capabilities.*` (`OW-5`) |
| El generador de restricciones (`tests/constraints.mjs`, `api/demo/constraints.ts`) | Leía `demo.yaml` por líneas; el bundle de OPE no tiene esa forma | **Deuda declarada** en `deuda.md`: se reescribe sobre el bundle antes del primer formulario del panel. `FieldConstraints` y `useForm` se conservan |
| El simulado (`tests/mock.mjs`, Prism, `contracts/demo.yaml`, `api/demo/`, `features/catalog/`) | El hola mundo contra un simulado de las-animas | `features/merchants` contra el backend real, y la sesión falsa para el marco |
| `tests/progress.mjs` (`avance`) | Herramienta del ciclo de cuarzo, atada a su `tasks.md` | Las casillas de `specs/*/tasks.md`, que ya dicen lo mismo |
| La regla 12 de `quality.mjs` (la palabra «cliente») | Convención de cuenta corriente de Tandilia | Se quita; en OPE «cliente» no está ocupada, y «conector» o «servicio» siguen siendo la forma preferida |
| `TablePagination`, `isPaged`, `Page`, `Meta`, `PagedMeta` | Paginación por número | `LoadMoreCursor`, `Collection<T>`, `useCollection` (`OW-4`) |
| La entrada `@ope/session/keycloak` | Forma de un proveedor que OPE no usa | El archivo se conserva **sin exportar** hasta que haya adaptador OIDC |
| `CLAUDE.md`, `README.md`, `estado.md` de cuarzo | Hablan de Tandilia | Reescritos para OPE-Web |

**Lo que se conserva sin ejercerse**: la ruta del testigo de concurrencia (`CU-29`: `conflict.ts`,
`ConflictDialog`, `versioned`, `retryWith`, `STALE`). OPE no tiene `If-Match` ni un tipo de
problema para eso; el testigo se evaluará como feature posterior del backend (`TAN-10` como
referencia), y entonces `STALE` cambia de valor y nada más. Lo vigila `quality.mjs`.
