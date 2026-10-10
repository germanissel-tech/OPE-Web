# Tareas · El testigo en la consola

**Carpeta**: `009-el-testigo-en-la-consola` · **Entrada**: [`plan.md`](plan.md) · [`spec.md`](spec.md) ·
[`research.md`](research.md) · [`data-model.md`](data-model.md) · [`quickstart.md`](quickstart.md)

## Formato: `[ID] [P?] [Tramo] Descripción con su archivo`

- **`[P]`** — se puede hacer en paralelo: otro archivo, sin depender de nada incompleto
- **`[En]`** — a qué tramo del plan pertenece

Se organiza por **tramos**, como la 008: el 1 trae el contrato, el núcleo y el cliente; el 2 lleva la 042 a las
pantallas; el 3 despierta la recuperación en las cuatro escrituras; el 4 verifica a mano y cierra. Cada tramo
termina con algo que se puede correr, y es un commit.

## Antes de empezar

- **Tandilia es sólo lectura.** Nada escribe en granito ni en cuarzo.
- **OPE-Backend con la 043 en `main`** (PR #52): sin ella no hay contrato `1.15.0` que sincronizar. `npm run dev`
  levantado para los pasos a mano.
- **`npm test` en verde antes del primer commit**, sobre `main`.
- **Toda cita a una decisión resuelve.**

---

## Fase 1 · Tramo 1 — El contrato, el núcleo y el cliente

**Meta**: el testigo sale de las lecturas y entra en las escrituras; la versión del merchant se pide por número.

- [x] T001 [E1] `npm run contract:sync` desde el `main` del backend: `contracts/ope/` con `1.15.0`, `versioned`
      en `OPERATIONS`, `If-Match` en los tipos; la comprobación de conformidad sin cambios
- [x] T002 [P] [E1] `packages/core/src/data/envelope.ts`: `unwrapWitnessed(result)` devuelve el cuerpo con el
      `ETag` de la respuesta; sin `ETag`, falla con clase (la operación no lo entrega y el cliente pidió que
      sí). Prueba en `packages/core/tests/` con una respuesta con y sin el encabezado
- [x] T003 [P] [E1] `packages/core/src/data/contract.ts`: `versioned?: boolean` en `OperationRequirement`, para
      que `operation()` lo reciba de `OPERATIONS[id]` sin conversión
- [x] T004 [P] [E1] `packages/core/src/data/use-action.ts`: `witness-required` entre los tipos propios (`OURS`),
      con su prueba: un `428` deja rastro como el `403 capability-missing` (research §7)
- [x] T005 [E1] `apps/console/src/api/ope/client.ts`: `Witnessed<T>`; `getMerchantConfiguration`,
      `getPlatformConfiguration`, `getTreatmentDefaults` y `getMerchant` devuelven el dato con `witness`;
      las cuatro escrituras reciben `witness` y lo mandan en `If-Match`;
      `getMerchantConfigurationVersion(merchantId, version)`. Los dobles de todas las pruebas de pantalla
      ganan `witness` y la operación nueva
- [x] T006 [E1] `npm test`, `npm run revisar`, `npm run build`. Commit:
      `feat(009): el contrato 1.15.0, y el testigo en el núcleo y en el cliente`

**Punto de control**: compila con el testigo obligatorio en los tipos; las pantallas todavía no lo usan para
recuperarse, pero lo mandan.

---

## Fase 2 · Tramo 2 — La 042 en las pantallas

**Meta**: las mediciones reiniciadas en todo historial; la versión del merchant de una sola petición.

- [x] T007 [P] [E2] `features/configuration/data/merchant-configuration.ts`: `useMerchantVersion` pide
      `getMerchantConfigurationVersion`; un `404` es «esa versión no existe» (research §6)
- [x] T008 [P] [E2] `features/configuration/screens/`: el historial del merchant gana «Mediciones reiniciadas»
      (la columna de `level-history-columns.tsx` se comparte), y la versión del merchant la muestra en
      `VersionFacts`
- [x] T009 [E2] Pruebas: el historial del merchant con un experimento en la columna; la versión por número sin
      recorrer páginas (el doble cuenta las llamadas a `listConfigurationVersions`: ninguna)
- [x] T010 [E2] Commit: `feat(009): el historial dice qué mediciones reinició cada versión`

---

## Fase 3 · Tramo 3 — La recuperación en las cuatro escrituras

**Meta**: escenarios 2 a 7 de la spec, en las cuatro pantallas.

- [x] T011 [E3] `features/configuration/data/comparable.ts` (NUEVO) con su prueba: `comparableOf(values, shown,
      leaves)` → una clave por hoja, el valor del contrato en `JSON` o `undefined` si se hereda; y la vuelta a un
      contenido por `setAt`. La prueba: un valor declarado después de abrir es una diferencia; agregar un
      renglón es una diferencia; `36` horas y `129600000` ms son la misma hoja (research §3)
- [ ] T012 [E3] La publicación del merchant: la `concurrency` de `useAction` —lo cargado, lo que hay, la
      relectura que recuerda lo que rige y el pedido armado con lo no editado de la relectura y la correctiva de
      la pantalla— y el `ConflictDialog` (research §4)
- [ ] T013 [E3] Las publicaciones de plataforma y de defaults, en `publish-level-form.tsx`: lo mismo, con lo no
      editado de los defaults tomado de la relectura
- [ ] T014 [E3] La edición de la identidad (`features/merchants`): sus siete hojas, la relectura del merchant, el
      `ConflictDialog` (research §5)
- [ ] T015 [E3] Pruebas, una pantalla por vez, con un doble que responde `412` la primera vez:
  - sin cruce, guarda sola en el segundo intento con el testigo nuevo, y el pedido lleva los cambios de los
    dos;
  - con cruce, se ve el choque y lo tecleado sigue;
  - en el merchant, el reintento lleva el anclaje de la versión nueva;
  - en la identidad, un cambio del interruptor en el medio no es choque.
- [ ] T016 [E3] Romper a propósito, una vez cada una: comparar textos en vez de hojas, lo no editado de la
      versión de al abrir, el testigo olvidado. Commit:
      `feat(009): las cuatro escrituras mandan su testigo y se recuperan cuando otro escribió en el medio`

---

## Fase 4 · Tramo 4 — El cierre

- [ ] T017 [E4] Contra el backend real, el `quickstart.md` con dos pestañas; «Lo corrido» fechado
- [ ] T018 [P] [E4] `spec.md`: **Estado**: construida; `.specify/memory/estado.md`: la 009, y la 004 de origen ya
      despierta
- [ ] T019 [E4] `npm test`, `npm run revisar`, `npm run build`. Commit: `docs(009): cierre — estado y quickstart`.
      Push y PR

---

## Dependencias

```text
(backend #52 en main) ──► Tramo 1 ──► Tramo 2 ──► Tramo 4
                                  └──► Tramo 3 ──┘
```

- T001 antes que todo lo que compila contra el contrato; T005 antes de los tramos 2 y 3.
- T011 antes de T012 a T014; T015 después de cada pantalla.
