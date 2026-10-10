# Tareas · La configuración versionada

**Carpeta**: `008-la-configuracion-versionada` · **Entrada**: [`plan.md`](plan.md) · [`spec.md`](spec.md) ·
[`research.md`](research.md) · [`data-model.md`](data-model.md) · [`quickstart.md`](quickstart.md)

## Formato: `[ID] [P?] [Tramo] Descripción con su archivo`

- **`[P]`** — se puede hacer en paralelo: otro archivo, sin depender de nada incompleto
- **`[En]`** — a qué tramo del plan pertenece

Se organiza por **tramos**, como la 006 y la 007: el 1 trae las piezas del núcleo y el contrato, el 2
muestra la configuración del merchant, el 3 la publica, el 4 hace lo mismo con los dos niveles
globales y el 5 verifica a mano y cierra. Cada tramo termina con algo que se puede correr, y es un
commit.

## Antes de empezar

- **Tandilia es sólo lectura.** Nada escribe en granito ni en cuarzo.
- **El backend al lado**, en `../backend`, en su `main`; `npm run dev` levantado para los pasos a
  mano. «Tienda de desarrollo» tiene un experimento activo en la semilla.
- **`npm test` en verde antes del primer commit**, sobre `main`.
- **Toda cita a una decisión resuelve.**

---

## Fase 1 · Tramo 1 — El núcleo y el contrato

**Meta**: las tres piezas de forma que todas las pantallas componen, y las once operaciones en el
cliente.

- [ ] T001 [P] [E1] `packages/core/src/ui/use-form.ts`: un error del servidor cuyo campo es **el nombre
      de una lista con renglones** (`x` cuando existe `x.0`) no es suelto; `errorOf('x')` lo devuelve
      (research §2). Prueba en `packages/core/tests/form.test.ts`, rota una vez a propósito
- [ ] T002 [P] [E1] `packages/core/src/data/constraints-of.ts` (NUEVO): `constraintsOf(all, root,
      prefix)` aplana `fields` y `required` siguiendo `ref`, con nombres de camino; un `ref` que no
      está en `all` es una falla con clase (research §3). Prueba en `constraints-of.test.ts` con un
      esquema de dos niveles y uno de tres
- [ ] T003 [P] [E1] `packages/core/src/base/units.ts` (NUEVO): `rateToPercent` y `percentToRate`
      corren la coma sobre el texto; `durationToUnit` y `unitToDuration` con una unidad de `ms`, `s`,
      `min`, `h`, `d`, y error cuando el resultado no es entero en la unidad del contrato; y
      `scaleConstraints` lleva `minimum` y `maximum` a la unidad que se muestra (research §3 a §5).
      Prueba en `units.test.ts` con `0.07`, `0.1`, `0.375`, `1`, `0`, `129600000` ms en horas,
      `1.5` h, `0.0001` s; rota una vez multiplicando por 100
- [ ] T004 [E1] Exportar las tres piezas desde `packages/core/src/index.ts`
- [ ] T005 [E1] `apps/console/src/api/ope/client.ts`: las once operaciones de data-model §1 y los
      tipos de los tres niveles; los dobles de prueba de las pantallas existentes ganan los stubs
- [ ] T006 [E1] `apps/console/src/features/configuration/` (NUEVA): `feature.ts` vacía, `strings.ts`,
      `data/units.ts` con la unidad de cada valor de data-model §2 tipada contra los caminos del
      contrato; `app/features.ts` la registra

**Punto de control**: `npm test`, `npm run revisar` y `npm run build` en verde. Commit:
`feat(008): el núcleo lee tasas, duraciones y restricciones anidadas, y el cliente los tres niveles`.

---

## Fase 2 · Tramo 2 — La configuración del merchant se ve

**Meta**: desde la ficha, ver con qué se sirve al merchant y de dónde sale cada valor, y su historial.

- [ ] T007 [E2] `apps/console/src/features/merchants/data/merchant-configuration.ts` (NUEVO):
      `useMerchantConfiguration`, `useConfigurationVersions` con cursor; `originOf(path, declared)`
      dice «declarado» o «heredado»
- [ ] T008 [P] [E2] `apps/console/src/components/version-history.tsx` (NUEVO): la tabla del historial
      con cursor y «cargar más»: versión, instante con `When`, operador, correctiva con su motivo, y
      una columna opcional para lo que el nivel agregue (research §11). `When` pasa de merchants a
      `components/`
- [ ] T009 [E2] `apps/console/src/features/configuration/screens/treatment-values.tsx` (NUEVO): los
      valores de tratamiento de sólo lectura, en sus grupos y su unidad, con el origen al lado cuando
      se lo pasan; lo complejo resumido (data-model §3)
- [ ] T010 [E2] `apps/console/src/features/merchants/screens/configuration-screen.tsx` (NUEVO):
      `/merchants/:merchantId/configuration`, `configuration:read`; las tres versiones, los valores,
      el historial; «sin versión propia» cuando no hay; al pie «volver» y «publicar una versión»
- [ ] T011 [E2] Ficha: «Configuración» al pie con `configuration:read`; `feature.ts` con la pantalla y
      los desenlaces `configurationRequested`/`configurationClosed`; `app/flows.ts`; los arneses de las
      pruebas de pantalla ganan los pasos
- [ ] T012 [E2] `configuration-screen.test.tsx`: el origen de cada valor; «sin versión propia»; el
      holdout en `%`; la frescura en su unidad; sin `configuration:read` no hay entrada en la ficha
- [ ] T013 [E2] Contra el backend real (quickstart, escenario 1). Anotar lo visto

**Punto de control**: escenario 1 a mano; `npm test`. Commit:
`feat(008): la configuración del merchant se ve, con el origen de cada valor y su historial`.

---

## Fase 3 · Tramo 3 — La configuración del merchant se publica

**Meta**: publicar una versión editando lo operativo, heredando o declarando, sin perder lo complejo.

- [ ] T014 [E3] `apps/console/src/features/merchants/data/configuration-body.ts` (NUEVO):
      `valuesOf(declared)` → valores del formulario en la unidad que se muestra; `bodyOf(values,
      declaredInForce, corrective, reason)` → `MerchantConfigurationInput` con lo complejo copiado
      (research §6, §7); `constraintsFor(values)` con la versión comercial obligatoria si la política
      viaja y el motivo obligatorio si es correctiva
- [ ] T015 [E3] `configuration-body.test.ts`: sin tocar nada, el cuerpo es lo declarado; `anchors`,
      `attributeLabels`, `decisionPolicy` y `returnRisk` idénticos; heredar saca el valor; la política
      comercial con sólo `returnRisk` viaja con su versión; rota una vez perdiendo `anchors`
- [ ] T016 [E3] `apps/console/src/features/merchants/data/merchant-configuration.ts`: la acción
      `configuration.publishMerchant`; invalida vista e historial; anuncia la versión o «no cambió
      nada» comparando números (research §9)
- [ ] T017 [P] [E3] `apps/console/src/components/corrective-section.tsx` (NUEVO): «correctiva», el
      motivo y qué implica; se muestra sola cuando la pantalla está en modo correctivo
- [ ] T018 [E3] `apps/console/src/features/configuration/screens/treatment-fields.tsx` (NUEVO): los
      campos de tratamiento editables; con `inherit` cada uno alterna entre heredado (valor efectivo
      de sólo lectura y «declarar») y declarado (control y «heredar»); renglones para idiomas,
      atributos y escalera; marcas para superficies, barreras y evidencia; el error de la escalera en
      su sección
- [ ] T019 [E3] `apps/console/src/features/merchants/screens/publish-configuration-screen.tsx` (NUEVO):
      `/merchants/:merchantId/configuration/publish`, `configuration:write`; precarga; lo complejo
      resumido y dicho «viaja como está»; `useUnsavedWork`; el `409` pasa a modo correctivo por
      `onRejected` (research §10); termina en la vista
- [ ] T020 [E3] Flujo y desenlaces `configurationPublishRequested`/`configurationPublished`; los
      arneses
- [ ] T021 [E3] `publish-configuration-screen.test.tsx`: precarga; declarar y heredar; el cuerpo
      enviado; «no cambió nada»; `409` conserva lo cargado y pide motivo; correctiva sin motivo no
      viaja; `422` en la escalera cae en ella; `duplicate-attribute-label` al pie; sin
      `configuration:write` no hay «publicar»
- [ ] T022 [E3] Contra el backend real (quickstart, escenarios 2 y 3). Anotar lo visto

**Punto de control**: escenarios 2 y 3 a mano; `npm test`. Commit:
`feat(008): la configuración del merchant se publica, heredando o declarando cada valor`.

---

## Fase 4 · Tramo 4 — Plataforma y defaults

**Meta**: los dos niveles globales, vistos, recorridos y publicados.

- [ ] T023 [E4] `apps/console/src/features/configuration/data/levels.ts` (NUEVO): vistas, historiales,
      versión por número y las dos acciones; las acciones invalidan además toda configuración de
      merchant y anuncian las mediciones reiniciadas
- [ ] T024 [E4] `data/level-body.ts` (+ prueba): valores ↔ contenido de plataforma y de defaults, con
      `decisionPolicy` y `returnRisk` copiados en los defaults
- [ ] T025 [E4] `screens/platform-screen.tsx`, `screens/defaults-screen.tsx`: la versión que rige por
      su nombre, los valores, el historial con nombre y mediciones reiniciadas
- [ ] T026 [E4] `screens/publish-platform-screen.tsx`, `screens/publish-defaults-screen.tsx`: todo
      precargado, modo correctivo, `useUnsavedWork`; «publicar» exige `configuration:write` y alcance
      `*`
- [ ] T027 [E4] `screens/level-version-screen.tsx`: una versión por número, de sólo lectura
- [ ] T028 [E4] `feature.ts`, el flujo y el grupo «Configuración» del menú en `app/flows.ts`
- [ ] T029 [E4] Pruebas de las cinco pantallas: valores en su unidad; con alcance acotado no hay
      «publicar»; el aviso nombra las mediciones reiniciadas; `409` y correctiva
- [ ] T030 [E4] Contra el backend real (quickstart, escenarios 4 y 5). Anotar lo visto

**Punto de control**: escenarios 4 y 5 a mano; `npm test`. Commit:
`feat(008): plataforma y defaults de tratamiento, vistos y publicados desde el menú`.

---

## Fase 5 · Tramo 5 — El cierre

- [ ] T031 [E5] `quickstart.md` con «Lo corrido» fechado, tramo por tramo; `spec.md`: **Estado**:
      construida
- [ ] T032 [P] [E5] `.specify/memory/estado.md`: la 008 construida; «Lo que sigue»;
      `docs/propuestas-a-granito.md` sólo si «valor con origen» o «heredado/declarado» no compusieron
- [ ] T033 [E5] `npm test` entero, `npm run revisar`, `npm run build`

**Punto de control**: todo en verde. Commit: `docs(008): cierre — estado y quickstart`.

---

## Dependencias

```
Tramo 1 ──► Tramo 2 ──► Tramo 3 ──► Tramo 4 ──► Tramo 5
```

- T001–T004 antes de todo lo que compone formularios; T005 antes de cualquier `data/`.
- T009 antes de T010 y de T025; T018 antes de T019 y de T026; T017 antes de T019.
- T014 antes de T016 y T019; T023 antes de T025–T027.

**En paralelo dentro de un tramo**: T001, T002 y T003; T008 con T007; T017 con T014–T016.

## Lo que no se hace, y conviene recordarlo al implementar

- **No se editan** la política de decisión, `returnRisk`, el mapa de anclajes ni las etiquetas.
- **No se multiplica una tasa**: se corre la coma sobre el texto.
- **No se redondea una duración**: si no es exacta, es error en el campo.
- **No se reintenta una publicación sola.**
- **No se anuncia ningún valor** en avisos ni telemetría.
- **No se toca granito ni el backend.**
