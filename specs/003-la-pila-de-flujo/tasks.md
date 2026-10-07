# Tareas · La pila de flujo

**Carpeta**: `003-la-pila-de-flujo` · **Entrada**: [`plan.md`](plan.md) · [`spec.md`](spec.md) ·
[`research.md`](research.md) · [`data-model.md`](data-model.md) ·
[`contracts/flujo.md`](contracts/flujo.md) · [`quickstart.md`](quickstart.md)

## Formato: `[ID] [P?] [Tramo] Descripción con su archivo`

- **`[P]`** — se puede hacer en paralelo: otro archivo, sin depender de nada incompleto
- **`[En]`** — a qué tramo del plan pertenece

Se organiza por **tramos** y no por historias independientes, por la misma razón que en `002`: esto
es una columna vertebral y el tramo 3 necesita el 2. Lo que reemplaza a la independencia es más
fuerte — **cada tramo termina con la aplicación arrancando**.

## Antes de empezar

**`002` tiene siete tareas abiertas** —tres del tramo 7, que es la prueba del clon, y su cierre—, y
**conviene cerrar al menos las tres primero**. Esta especificación toca `articles-screen.tsx` y
`useTableQuery`, que son justo lo que la prueba del clon ejercita: hacerla después significa escribirla contra un catálogo que está por
cambiar, y depurar dos cosas a la vez.

No es un bloqueo técnico. Es que el orden barato es ése.

---

## Fase 1 · Tramo 1 — La decisión, y las transiciones sin React

**Meta**: que la aritmética de la pila esté escrita y probada exhaustivamente, **antes de que algo la
use**. Si está mal, todo lo que venga después miente.

- [x] T001 [E1] Escribir **la decisión de los flujos** en `docs/arquitectura.md`, con el siguiente identificador libre: los tres verbos, la regla de desenrollado, dónde vive la pila, y el flujo de sistema. Agregar su fila en `docs/decisiones.md` (principio VI)
- [x] T002 [P] [E1] Declarar `StackEntry` y `FlowState` en `packages/core/src/base/flow-state.ts`, con sólo primitivos: el escalón **se serializa y se restaura** (`CU-26`)
- [x] T003 [E1] Implementar las tres transiciones en el mismo archivo —apilar, reemplazar, desenrollar— con la regla **«si está en la pila, desenrollá»** compartida por abrir y terminar
- [x] T004 [P] [E1] Escribir `packages/core/tests/flow-state.test.ts`: apilar, reemplazar, desenrollar, y **la identidad pantalla + parámetros** con el caso de recursión de la spec (escenario 3)
- [x] T005 [P] [E1] Implementar y probar la regla del estado vacío: sin flujo, el de la raíz de la funcionalidad de esa pantalla, con la pila vacía (escenario 8)

**Punto de control**: la aplicación arranca **igual que antes** —nada usa esto todavía— y las transiciones están cubiertas, incluidos los ciclos.

---

## Fase 2 · Tramo 2 — La forma declarada, y las seis comprobaciones

**Meta**: que un flujo se pueda escribir y que **el compilador y el arranque lo revisen**, antes de
que haya código que dependa de él.

- [x] T006 [E2] Escribir `defineFlow` y los tipos de `Flow` y `Step` en `packages/core/src/base/flow.ts` (contrato §1)
- [x] T007 [E2] Implementar `opens`, `closes` y `finishes`, con el destino y sus parámetros tipados desde la ruta (`CU-41`)
- [x] T008 [P] [E2] Probar **lo que no tiene que compilar**: parámetro que la ruta no declara, desenlace inventado, destino que no es pantalla ni flujo
- [x] T009 [P] [E2] Agregar `root` a `Feature` en `packages/core/src/base/feature.ts` — la regla que faltaba desde la deuda 2
- [x] T010 [E2] Implementar **las seis comprobaciones de arranque** en `packages/core/src/app/create-application.tsx` (modelo §«Lo que se verifica al arrancar»)
- [x] T011 [P] [E2] Probar **cada una de las seis con su caso roto**, y que el mensaje nombre qué falta y dónde
- [x] T012 [E2] Agregar `flows` al manifiesto en `packages/core/src/base/manifest.ts`, **conviviendo con `routing`**: se saca en el tramo 3

**Punto de control**: arranca con el flujo del catálogo declarado y el `routing` viejo todavía en uso · las seis comprobaciones corren y fallan bien.

> La convivencia de un tramo es el precio de que cada tramo arranque. Se paga a propósito.

---

## Fase 3 · Tramo 3 — El primer flujo real

**Meta**: que el catálogo navegue por flujos, y que **`goTo` desaparezca de las pantallas**.

- [x] T013 [E3] Escribir `useFlow` en `packages/core/src/data/use-flow.ts`: lee `location.state` y envuelve `navigate`. **No guarda nada** — investigación §3
- [x] T014 [E3] Despachar los desenlaces contra el flujo activo, en la raíz de composición
- [x] T015 [E3] Escribir `src/app/flows/catalog.ts` con los tres pasos del catálogo, y **borrar `src/app/routing.ts`**
- [x] T016 [E3] Sacar `goTo` de `articles-screen.tsx` y de `row-actions.tsx`: emiten desenlaces (`CU-44` enmendada)
- [x] T017 [E3] Implementar `canReach` y derivar del flujo el filtrado por capacidad de la grilla (`CU-3`, escenario 11)
- [x] T018 [E3] Sacar `inMenu` y `section` de `ScreenDefinition`, y armar el menú desde los flujos, con el rótulo derivado de la raíz
- [x] T019 [P] [E3] Escribir `packages/core/tests/flow-history.test.tsx`: **los siete casos del botón «atrás»**, incluidas las dos arrugas — la entrada «adelante» que queda viva, y el «atrás» que no se ve después de terminar
- [x] T020 [E3] Sacar `routing` del manifiesto y borrar `route()`

**Punto de control**: el catálogo navega por flujos · «atrás» es cerrar · **ninguna pantalla importa a otra** (todavía sin comprobación que lo impida).

---

## Fase 4 · Tramo 4 — El lugar en la URL

**Meta**: que cerrar devuelva a la página cuatro **con el filtro puesto**, que es el problema que
originó todo esto.

- [x] T021 [E4] Mudar `useTableQuery` de `useState` a parámetros de consulta, en `packages/core/src/ui/use-table-query.ts` (`CU-14`)
- [x] T022 [P] [E4] Probar que el filtro y la página **sobreviven a cerrar** (escenario 1)
- [x] T023 [P] [E4] Probar que cambiar el filtro sigue volviendo a la primera página, que es la sutileza que `useTableQuery` ya se llevaba adentro

**Punto de control**: filtrar, ir a la página cuatro, abrir un artículo, cerrar, y **estar donde estabas**.

---

## Fase 5 · Tramo 5 — El aviso, y la comprobación que lo sostiene todo

**Meta**: que abandonar trabajo sin guardar avise, y que **una pantalla no pueda volver a nombrar a
otra**.

- [x] T024 [E5] Escribir `useUnsavedWork` en `packages/core/src/ui/unsaved-work.tsx`, sobre `useBlocker` y con el diálogo de granito (investigación §4)
- [x] T025 [E5] Conectarlo a **los cuatro caminos**: cerrar, el menú lateral, un paso que lleva a otro flujo, y el botón «atrás»
- [x] T026 [P] [E5] Probar los cuatro caminos, **que no aparezca al terminar**, y que cancelar deje la pila y el flujo como estaban
- [x] T027 [E5] Agregar a `packages/core/checks/boundaries.mjs` la regla **una pantalla no importa a otra pantalla**, y probarla rompiéndola
- [x] T028 [P] [E5] Verificar que el menú de usuario **apila y no abandona**, y que cerrar `about` vuelve a donde estaba (escenario 10)

**Punto de control**: [`quickstart.md`](quickstart.md) entero, a mano, en un navegador de verdad.

> **La comprobación va última a propósito.** Puesta antes del tramo 3 rompe el repositorio y hay que
> apagarla, que es exactamente cómo una comprobación se vuelve opcional.

---

## Fase 6 · Cierre

- [x] T029 [P] Actualizar `docs/deuda.md`: **la entrada 2 se paga**, con la comprobación que la sostiene
- [x] T030 [P] Actualizar `.specify/memory/estado.md` con lo que quedó construido
- [x] T031 Revisar en `docs/arquitectura.md` si algo de lo construido dejó desactualizada otra decisión, y corregirla
- [x] T032 Contestar `granito#PED-11` en su `PEDIDOS.md`: qué se construyó, y **qué encontró el primer flujo real** — que es lo que ellos pidieron, porque `GR-73` se trazó en papel
- [x] T033 Abrir un pedido a granito: `GR-73` exige avisar antes de descartar y **no dice que el botón «atrás» sólo se puede rebotar, ni que cerrar la pestaña no se cubre**

---

## Dependencias

```
T001 ─┬─ tramo 1 ── tramo 2 ── tramo 3 ─┬─ tramo 4 ─┐
      │                                 │           ├─ cierre
      └─ (la decisión, antes que todo)  └───────────┴─ tramo 5
```

**El tramo 4 y el 5 son independientes entre sí**: uno muda el filtro a la URL y el otro agrega el
aviso. Los dos necesitan el 3.

### Adentro de cada tramo

| tramo | en paralelo |
|---|---|
| **1** | T002, T004 y T005 |
| **2** | T008, T009 y T011 |
| **3** | T019, mientras se arma el resto |
| **4** | T022 y T023 |
| **5** | T026 y T028 |
| **6** | T029, T030 y T032 |

## Cómo se entrega

**El tramo 4 es la primera entrega que un operador nota**: hasta ahí todo es forma. Y el tramo 3 es
el que no se puede dejar a medias — con `routing` borrado y los flujos incompletos, la aplicación no
navega.

**Se commitea por tarea, o por grupo que deje algo andando.**

## Cuentas

| | |
|---|---|
| tareas | 33 |
| tramos | 5, más el cierre |
| en paralelo | 15 |
| pruebas nuevas | 8 archivos, 6 de ellos de conducta |
| decisiones nuevas | 1 · enmiendas: `CU-44`, ya escrita |
| pedidos a granito | 2 · uno de vuelta, uno nuevo |
