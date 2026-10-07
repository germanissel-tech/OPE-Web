# Tareas · El testigo y el conflicto

**Carpeta**: `004-el-testigo-y-el-conflicto` · **Entrada**: [`plan.md`](plan.md) · [`spec.md`](spec.md) ·
[`research.md`](research.md) · [`data-model.md`](data-model.md) · [`quickstart.md`](quickstart.md)

## Formato: `[ID] [P?] [Tramo] Descripción con su archivo`

- **`[P]`** — se puede hacer en paralelo: otro archivo, sin depender de nada incompleto
- **`[En]`** — a qué tramo del plan pertenece

Se organiza por **tramos** y no por historias independientes, por la misma razón que en `002` y
`003`: el tramo 3 no puede existir sin el 2. Lo que reemplaza a la independencia es más fuerte —
**cada tramo termina con algo que se puede correr**.

## Antes de empezar

**El tramo 1 toca `contracts/demo.yaml`**, y de ahí se generan los tipos con `npm run tipos`. Eso
regenera además `roles.ts` y `constraints.ts`, así que conviene que el árbol esté limpio antes de
empezar: un diff de tipos generados mezclado con uno escrito a mano es difícil de revisar.

**Y `npm run tipos` usa `npx -y openapi-typescript`**, que baja el paquete cada vez — está así porque
instalarlo como dependencia lo rompe con TypeScript 7 (`CU-38`). Si no hay red, este tramo no arranca.

---

## Fase 1 · Tramo 1 — El testigo llega

**Meta**: que el testigo viaje del servidor a la pantalla **sin que ninguna pantalla haga nada**. Es
el tramo que la investigación §1 achicó: el camino ya existe.

- [x] T001 [E1] Agregar el testigo al contrato del ejemplo en `contracts/demo.yaml`: el encabezado en la respuesta del `GET` individual, el parámetro en la escritura, y la respuesta de rechazo. Tomar la forma del contrato de `las-animas`, que ya lo tiene resuelto
- [x] T002 [E1] Regenerar los tipos con `npm run tipos`, y revisar que el diff sea sólo lo del testigo
- [x] T003 [P] [E1] Agregar `version` a `Meta` en `packages/core/src/data/envelope.ts`, **opcional**: una lista no lo trae, y que falte no es un error de transporte (modelo §1)
- [x] T004 [E1] Leerlo del encabezado en `unwrap`, **por el mismo camino que `requestId`** — la función que ya existe para eso es el precedente, no una casualidad
- [x] T005 [P] [E1] Emitirlo desde el simulado en `tests/mock.mjs`, que ya lee un encabezado de pedido y por eso esto es del mismo tamaño (investigación §4)
- [x] T006 [P] [E1] Probar en `packages/core/tests/envelope.test.ts` que el testigo llega a `meta`, y que **su ausencia no rompe nada**: una lista sigue funcionando

**Punto de control**: abrir un artículo y ver el testigo en `meta`. La aplicación arranca igual que antes; todavía nadie lo usa.

---

## Fase 2 · Tramo 2 — El testigo vuelve, y sin él no compila

**Meta**: que una escritura sobre un recurso versionado **no compile** sin el testigo. Es la promesa
más fuerte de la especificación, y la que impide que una pantalla nueva se olvide.

- [x] T007 [E2] Agregar `versioned` a lo que `operation` declara en `packages/core/src/data/action.ts`, al lado de `idempotent` (modelo §3)
- [x] T008 [E2] Hacer que el tipo **exija el testigo** cuando la operación lo declara, con la misma costura que `CU-41` usó para los parámetros de una ruta y `CU-37` para las operaciones de una acción
- [x] T009 [P] [E2] Escribir los `@ts-expect-error` en `packages/core/tests/types.test-d.ts`: escribir sin testigo, y declarar `versioned` sin recibirlo. **Fallan si el error que esperan no ocurre**
- [x] T010 [E2] Pasarlo por el canal que ya usa la clave de idempotencia —tercer parámetro de `run`, puesto por la puerta y no por quien llama— en `use-action.ts` (investigación §2)
- [x] T011 [P] [E2] Mandarlo en la escritura desde `src/api/demo/client.ts`
- [x] T012 [P] [E2] Hacer que el simulado **rechace de verdad** cuando el testigo no coincide, en `tests/mock.mjs`. Sin esto el tramo 3 no tiene contra qué probar

**Punto de control**: `npx tsc -b` falla si se escribe sin testigo, y el simulado rechaza un guardado sobre una versión vieja.

---

## Fase 3 · Tramo 3 — La comparación, y el caso que no molesta

**Meta**: que el rechazo se convierta en una decisión del operador — o en nada, que es el caso
frecuente y el que decide si esto es una protección o un estorbo.

- [x] T013 [E3] Escribir el cálculo del choque en `packages/core/src/data/conflict.ts`, sin React: la intersección entre **lo que el operador cambió** y **lo que cambió en el servidor**, contra la versión cargada (modelo §4)
- [x] T014 [P] [E3] Probarlo exhaustivamente en `packages/core/tests/conflict.test.ts`, **empezando por el caso vacío**: campos distintos no producen choque. Es el escenario 3 y el que más importa
- [x] T015 [E3] Dejar la forma preparada para los campos atados **sin construirlos**: la lista de campos que entran se amplía, no se recalcula de otra manera. Si esa condición no se puede sostener, el tramo no cierra (plan §complejidad)
- [x] T016 [E3] Reconocer el rechazo en la puerta, **por su código y nunca por su mensaje** (`CU-14`), y que **no caiga en el camino de los errores de campo** (`CU-38`)
- [x] T017 [E3] Releer y decidir, en `use-action.ts`: sin cruce, guardar con el testigo nuevo **sin avisar nada**; con cruce, mostrar
- [x] T018 [P] [E3] Componer el diálogo en `packages/core/src/ui/conflict-dialog.tsx` con el `Dialog` y `FormattedValue` de granito. **Nada propio** (principio IV, investigación §5)
- [x] T019 [P] [E3] Probar que **lo tecleado sobrevive entero** al choque, y que un segundo rechazo seguido no reintenta solo (escenarios 4 y 5)
- [x] T020 [P] [E3] Probar que la relectura fallida informa el conflicto **con el identificador del pedido** y no guarda (`CU-4`)

**Punto de control**: los cinco escenarios en prueba, y el 3 —sin cruce, no molesta— pasando primero.

---

## Fase 4 · Tramo 4 — La edición de verdad, y la garantía que faltaba

**Meta**: que todo lo anterior tenga un consumidor real, y que esto no pueda volver a quedar
declarado y vacío.

- [x] T021 [E4] Escribir la edición del artículo en `src/features/catalog/screens/edit-article.tsx` **como una región de la misma página**, no como un diálogo: `GR-42` fija que un diálogo no espera un dato del servidor, y la forma ya la eligió `granito#PED-8`
- [x] T022 [E4] Declararla en el flujo del catálogo y en el registro, con sus cuatro estados: cargando, el registro, no existe, y error (`CU-24`)
- [x] T023 [E4] Pagar la entrada 3 de `docs/deuda.md`: **el alta y la edición comparten maqueta**, o quedan dos que se desincronizan en la primera corrección
- [x] T024 [P] [E4] **La comprobación nueva**: que la puerta trate el rechazo por conflicto, en `packages/core/checks/quality.mjs`. Es la garantía que faltaba y que dejó a `CU-29` vacía — sin ella esto se pudre igual que la primera vez
- [x] T025 [P] [E4] Mutarla: si la puerta deja de tratar el rechazo, **tiene que fallar**. Sin la mutación no está verificada
- [x] T026 [E4] Correr el `quickstart.md` entero a mano, en un navegador de verdad

**Punto de control**: editar un artículo, provocar el choque con dos pestañas, y que el operador pueda decidir sin haber perdido nada.

---

## Fase 5 · Cierre

- [x] T027 Actualizar `docs/decisiones.md` y `.specify/memory/estado.md`: `CU-29` deja de estar declarada y vacía
- [x] T028 Sacar la entrada 3 de `docs/deuda.md`, que este tramo pagó
- [x] T029 Regenerar `catalogo.json`, que gana esta especificación y pierde una deuda
- [x] T030 **Revisar contra `TAN-6`, en contexto limpio y no por quien escribió.** El sexto paso del ciclo no es opcional y no lo hace el mismo agente
- [x] T031 **Arreglar los 15 hallazgos de la revisión**, cada uno con la garantía que le faltaba

**Punto de control**: `npm test` entero, incluido el ritual de clonar, y la revisión de `TAN-6` cerrada.

---

## Dependencias

**1 → 2 → 3 → 4**, y no es negociable: sin testigo no hay rechazo, sin rechazo no hay qué comparar, y
sin edición la comparación es código que nunca corre.

**Dentro de cada tramo**, lo marcado `[P]` va en paralelo. El grueso de lo secuencial está en el 3,
donde el cálculo (T013) tiene que existir antes de que la puerta lo use (T017).

**La única tarea que puede adelantarse** es T024, la comprobación: se puede escribir en rojo desde el
principio, y de hecho conviene — así el tramo 4 la pone en verde en vez de agregarla al final.

## Lo que no está acá

**Los campos atados** (escenario 6). Está en «Lo que queda abierto» de la spec, y T015 es lo único
que le corresponde a esta vuelta: dejar la forma preparada, no construirla.

**Pedirle un componente de comparación a granito.** Primero se compone con lo suyo, se mira en T026,
y **recién ahí se propone con evidencia**. Al revés es la trampa que `CU-21` nombra.
