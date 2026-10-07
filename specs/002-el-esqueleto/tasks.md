# Tareas · El esqueleto

**Carpeta**: `002-el-esqueleto` · **Entrada**: [`plan.md`](plan.md) · [`spec.md`](spec.md) ·
[`research.md`](research.md) · [`data-model.md`](data-model.md) ·
[`contracts/nucleo.md`](contracts/nucleo.md) · [`quickstart.md`](quickstart.md)

## Formato: `[ID] [P?] [Tramo] Descripción con su archivo`

- **`[P]`** — se puede hacer en paralelo: otro archivo, sin depender de nada incompleto
- **`[En]`** — a qué tramo del plan pertenece

### Por qué tramos y no historias independientes

La plantilla de Spec Kit organiza por historias que **se implementan y se prueban por separado**, y
que varias personas pueden tomar en paralelo. **Acá no se cumple, y fingir que sí daría un grafo de
dependencias falso**: el esqueleto es una columna vertebral y el tramo 3 necesita el 2.

Lo que reemplaza a la independencia es más fuerte: **cada tramo termina con la aplicación
arrancando**. No hay una integración grande al final, y si algo no levanta se sabe en ese tramo.

**Las pruebas van incluidas** porque la spec las nombra como garantías, no como extra.

---

## Fase 1 · Tramo 1 — Andamio, configuración y raíz de composición

**Meta**: que arranque en blanco, y que **falle diciendo qué falta** si la configuración está mal.

**Bloquea todo lo demás.** Sin esto no hay dónde poner nada.

- [x] T001 Crear `package.json` en la raíz: espacios de trabajo `packages/*`, dependencias de la aplicación, y los scripts `dev`, `build`, `test` y `simulado`
- [x] T002 [P] Crear `tsconfig.json` con `strict` y `any` prohibido (`CU-15`)
- [x] T003 [P] Crear `biome.json` con las reglas de React y accesibilidad (`CU-16`)
- [x] T004 [P] Crear `index.html` y `vite.config.ts`
- [x] T005 [P] Agregar `@granito/ui` y `@granito/tokens` como dependencias, y su hoja de estilos en el punto de entrada
- [x] T006 Crear la estructura de `CU-15`: `src/app/`, `src/features/`, `src/components/`, `src/lib/`, `src/testing/` y `src/api/`
- [x] T007 Escribir `tests/boundaries.mjs`: zona por ruta, resolver importaciones relativas, y **fallar si la dirección va al revés** (`CU-15`, investigación §2)
- [x] T008 [P] Crear `config.json` de desarrollo y su tipo en `src/app/config.ts`
- [x] T009 Implementar la lectura y **validación** de configuración en `src/app/config.ts`: si falta un obligatorio, **no arranca y dice cuál** (`CU-17`)
- [x] T010 Escribir la raíz de composición en `src/app/composition.tsx`: lee configuración, construye las piezas, y ensambla (`CU-36`)
- [x] T011 [P] Agregar el script `simulado`: Prism sobre `contracts/demo.yaml` en `:4010` — el contrato propio del hola mundo, para que el clon arranque sin repositorios al lado (`CU-20`)
- [x] T012 [P] Escribir `tests/artifact.mjs`: falla si la marca de la falsa aparece en `dist/` (`CU-36`, investigación §3)
- [x] T013 Enganchar `limites.mjs` y `artefacto.mjs` a `npm test`, junto a `decisiones.mjs`

**Punto de control**: arranca en blanco · `npm test` corre tres comprobaciones · si falta un valor de configuración, **no arranca y lo nombra** (escenario 15).

---

## Fase 2 · Tramo 2 — La sesión y el marco

**Meta**: que muestre el marco con quién está.

**Alcance**: sólo la implementación falsa. **El adaptador de OIDC no entra acá** — es el segundo
tramo de `001`, contra el proveedor local de `TAN-2`.

- [x] T014 [P] [E2] Crear `packages/session/` con la superficie de [`../001-la-sesion/contracts/puerta.md`](../001-la-sesion/contracts/puerta.md): `configureSession`, `authorize`, `useSession`, `useCapabilities`, `signOut`, `createFakeSession`
- [x] T015 [E2] Implementar `createFakeSession` en `packages/session/src/falsa.ts`, con la marca constante que busca `artefacto.mjs`
- [x] T016 [E2] Implementar la máquina de estados de [`../001-la-sesion/data-model.md`](../001-la-sesion/data-model.md) en `packages/session/src/estado.ts`, ejercitada por la falsa
- [x] T017 [E2] Armar el marco en `src/app/frame.tsx` con `AppShell` de granito —`brand`, `nav`, `center`, `globalActions`— más `NotificationHost`
- [x] T018 [E2] Implementar la barra de usuario en `src/app/user-bar.tsx` (`CU-27`): nombre e iniciales de claims estándar, y **cerrar sesión obligatorio y último**
- [x] T019 [E2] Resolver la sesión **antes de dibujar** en `src/app/composition.tsx` (`CU-36`, `CU-9`)
- [x] T020 [P] [E2] Escribir la prueba en `packages/session/tests/gate.test.ts`: que **no exista** ninguna forma de obtener el token (`CU-10`)

**Punto de control**: se ve el marco con el nombre del usuario, y cerrar sesión funciona (escenario 1).

---

## Fase 3 · Tramo 3 — El registro, las rutas y el menú

**Meta**: que navegue, con el menú saliendo del registro y nadie escribiendo una ruta a mano.

- [x] T021 [E3] Implementar `defineScreen` en `packages/core/src/base/registry.ts` con los campos de [`data-model.md`](data-model.md) §1
- [x] T022 [E3] Derivar el menú del registro en `packages/core/src/ui/menu.tsx`, agrupado por sección
- [x] T023 [E3] Derivar las rutas de React Router **del registro**, en `packages/core/src/base/routes.ts` (`CU-41`)
- [x] T024 [E3] Implementar `goTo()` en `packages/core/src/base/go-to.ts`, con los tipos derivados de las rutas declaradas (`CU-41`)
- [x] T025 [E3] Filtrar por capacidad **de los dos lados** en `menu.tsx` y `rutas.ts`: no aparece, **y no deja entrar por URL** (`CU-23`, `CU-3`)
- [x] T026 [E3] Hacer que una sección sin ninguna pantalla visible desaparezca del menú, en `menu.tsx`
- [x] T027 [P] [E3] Escribir la prueba en `packages/core/tests/registry.test.ts`: dos pantallas con la misma ruta **fallan al construir**
- [x] T028 [P] [E3] Escribir la prueba de tipos en `packages/core/tests/types.test-d.ts`: `goTo` con el parámetro equivocado **no compila**

### Lo que devolvió la revisión (`TAN-6`)

**El tramo no cierra hasta que estas pasen.** Las de arriba se hicieron; éstas salieron de revisar
lo que quedó, y las tres las marca `tests/quality.mjs`.

- [x] T055 [E3] Crear el ruteador **una sola vez** en `src/app/composition.tsx`: hoy `createBrowserRouter` corre en el cuerpo de un componente, y con él se recrea el historial y se remonta el árbol
- [x] T056 [E3] Reemplazar el estado mutable de módulo de `packages/core/src/base/go-to.ts` por dependencia recibida — es la **D** de `TAN-6` y **incumple `CU-36`**
- [x] T057 [E3] Lo mismo en `packages/session/src/gate.tsx`, con `let provider`
- [x] T058 [E3] Escribir la comprobación que **`CU-36` dice tener** y no tiene: que sólo la raíz de composición conozca implementaciones concretas

**Punto de control**: escenarios 2, 3 y 4 · la navegación tipada del 9 · **y `npm test` en verde, incluida `quality.mjs`**.

---

## Fase 4 · Tramo 4 — Los cuatro estados y la grilla

**Meta**: que traiga datos del simulado y muestre sus cuatro estados.

- [x] T029 [P] [E4] Generar los tipos del contrato con `openapi-typescript` en `src/api/demo/types.ts` (una carpeta por sistema — `CU-22`)
- [x] T030 [E4] Armar el cliente en `src/api/demo/client.ts` con `openapi-fetch` y TanStack Query, pasando por `authorize` (`CU-14`)
- [x] T031 [E4] Desenvolver el sobre `{ data, meta }` **en un solo lugar** en `packages/core/src/data/envelope.ts` — es idéntico en las cuatro (`CU-40`)—, guardando `meta.requestId` para los errores
- [x] T032 [E4] Implementar `<Result>` en `packages/core/src/ui/result.tsx`: cargando, datos, **los dos vacíos** y error, envolviendo **la región y no la pantalla** (`CU-24`)
- [x] T033 [E4] Escribir la pantalla de grilla en `src/features/catalog/screens/articles-screen.tsx`, contra un catálogo del simulado, con filtro y paginado del servidor
- [x] T034 [E4] Mostrar el error **con el identificador del pedido** en `packages/core/src/ui/result.tsx`, dejando el filtro y las acciones usables (`CU-25`)

**Punto de control**: escenarios 5, 6, 7 y 8. **Los dos vacíos dicen cosas distintas.**

---

## Fase 5 · Tramo 5 — Las acciones y el formulario

**Meta**: que escriba, valide, e invalide la grilla sola.

- [x] T035 [E5] Implementar `defineAction` en `packages/core/src/data/action.ts`: operaciones, qué invalida, idempotencia (`CU-25`, `CU-34`, `CU-37`)
- [x] T036 [E5] Derivar la capacidad de `x-required-roles` de las operaciones declaradas, en `packages/core/src/data/action.ts` (`CU-37`)
- [x] T037 [E5] Implementar `useAction` en `packages/core/src/data/use-action.ts`: éxito → aviso e invalidar · `error.fields` → **a los campos** · otro error → aviso con identificador · **nunca reintenta** (`CU-25`)
- [x] T038 [E5] Hacer que el botón se derive de la acción en `packages/core/src/ui/action-button.tsx`: **si no está habilitada, no se dibuja** (`CU-37`, `CU-3`)
- [x] T039 [E5] Agregar la clave de idempotencia para las operaciones que la piden, en `packages/core/src/data/action.ts` (`CU-34`)
- [x] T040 [E5] Escribir el alta en `src/features/catalog/screens/new-article-dialog.tsx`, abierta desde la grilla — se adelantó para validar `defineAction` contra un caso real antes de construirle encima
- [x] T041 [E5] Implementar las tres capas de validación de `CU-38` en `formulario.tsx`, marcando **al salir del campo o al intentar guardar** y nunca mientras se escribe por primera vez

**Punto de control**: escenarios 9, 10, 11 y 12.

---

## Fase 6 · Tramo 6 — Lo que sostiene al resto

**Meta**: que el marco sobreviva a una pantalla que revienta, y que el contexto aguante una recarga.

- [x] T042 [P] [E6] Implementar el error de pantalla en `packages/core/src/ui/screen-error.tsx` (`CU-30`): se reemplaza sola, **el marco sobrevive**, con identificador y salida
- [x] T043 [P] [E6] Implementar los contextos de `CU-26` en `packages/core/src/base/context.ts`, con sus cuatro vidas y las dos reglas: **estampado con el sujeto**, y **sólo identificadores**
- [x] T044 [P] [E6] Implementar el puerto de registro en `packages/core/src/base/telemetry.ts` (`CU-35`), con la implementación de desarrollo y **lo que nunca sale**
- [x] T045 [E6] Hacer que recargar parado en una pantalla vuelva a esa pantalla y no a la de inicio, en `packages/core/src/base/routes.ts`

**Punto de control**: escenarios 13 y 14.

---

## Fase 7 · Tramo 7 — Los dos paquetes y la prueba del clon

**Meta**: **que se clone y arranque.** Es lo único que prueba la promesa de `CU-20`.

**No es empaquetar al final**: los límites se respetan desde el tramo 1 y los verifica
`limites.mjs`. Acá se **muda** lo que ya está separado.

- [x] T046 [E7] Ordenar `packages/core/src/` en sus tres categorías —`base`, `data`, `ui`— con los límites verificados por `limites.mjs` (`CU-40`)
- [x] T047 [P] [E7] Escribir `packages/core/package.json` y `packages/session/package.json` con `files`, `exports` y `publishConfig`
- [x] T048 [E7] Hacer que la aplicación consuma los dos paquetes **por su nombre** y no por ruta relativa, en `src/`
- [x] T049 [E7] Escribir `tests/clone.mjs`: los cinco pasos de [`quickstart.md`](quickstart.md), con `npm pack` en lugar del registro (investigación §4)
- [x] T050 [E7] Verificar en `tests/clone.mjs` que `CLAUDE.md`, `.specify/` y `tests/decisions.mjs` viajen en el clon (`CU-20`)

**Punto de control**: escenarios 16 y 17. **El clon arranca y las dos pantallas de ejemplo andan.**

---

## Fase 8 · Cierre

- [x] T051 [P] Correr [`quickstart.md`](quickstart.md) entero a mano, incluido el ritual de clonar
- [x] T052 [P] Actualizar `.specify/memory/estado.md` con lo que quedó construido y lo que sigue
- [x] T053 Revisar en `docs/arquitectura.md` si algo de lo construido dejó desactualizada alguna decisión, y corregirla
- [x] T054 [P] Escribir `README.md` con las tres capas y qué no va acá

---

## Dependencias

### Entre tramos

**En cadena, y es a propósito.** Cada uno necesita al anterior:

```
Tramo 1  →  2  →  3  →  4  →  5  →  6  →  7
```

| tramo | por qué necesita al anterior |
|---|---|
| **2** | El marco se monta en la raíz de composición del 1 |
| **3** | El menú vive en el `AppShell` del 2, y filtra por las capacidades de la sesión |
| **4** | La grilla es una pantalla declarada en el 3 |
| **5** | El formulario se alcanza con el `goTo()` del 3 e invalida la consulta del 4 |
| **6** | Envuelve lo que ya existe |
| **7** | Muda lo que los seis dejaron separado |

**El corte real es otro**: la aplicación arranca al final de cada tramo, así que **nunca hay más de
un tramo de trabajo sin verificar**.

### Adentro de cada tramo

Lo marcado con `[P]` toca otro archivo y no depende de nada incompleto.

| tramo | en paralelo |
|---|---|
| **1** | T002, T003, T004 y T005 · después T008, T011 y T012 |
| **2** | T014 y T020 |
| **3** | T027 y T028 |
| **4** | T029, mientras se arma el resto |
| **6** | T042, T043 y T044 — los tres son independientes |
| **7** | T047 |
| **8** | T051, T052 y T054 |

## Cómo se entrega

**No hay entrega mínima anterior al tramo 7**, y conviene decirlo porque es una diferencia con la
plantilla: acá el producto es **que el clon arranque**, así que un esqueleto impecable en el tramo 6
todavía no sirve para lo único que cuarzo existe para hacer.

Lo que sí hay es **verificación continua**: al final de cada tramo la aplicación levanta y se puede
mirar. Eso es lo que evita descubrir en el tramo 7 que algo del 2 estaba mal.

**Se commitea por tarea, o por grupo que deje algo andando.**

## Cuentas

| | |
|---|---|
| **Tareas** | 54 |
| **Tramos** | 7, más el cierre |
| **Con `[P]`** | 19 |
| **Escenarios cubiertos** | los 17 |
| **Decisiones abiertas que bloquean** | **ninguna** — `CU-18`, `CU-19`, `CU-21` y `CU-28` esperan a otros |
