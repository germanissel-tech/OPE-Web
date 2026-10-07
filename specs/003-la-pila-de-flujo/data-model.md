# Modelo · La pila de flujo

**Carpeta**: `003-la-pila-de-flujo` · **Fecha**: 2026-08-23

Cinco cosas, y la mitad ya existe. Lo que se agrega es **el flujo**, **el paso** y **el escalón**;
lo que cambia es **la pantalla** y **la funcionalidad**.

---

## `Flow` · el recorrido declarado

Vive en la aplicación, en `src/app/flows/`, un archivo por flujo. **Nunca en una funcionalidad**:
un flujo que cruza dos carpetas no se podría escribir adentro de ninguna (`CU-15`), y tener flujos
internos allá y flujos que cruzan acá son las dos formas que `CU-44` acaba de dejar de permitir.

| campo | qué es |
|---|---|
| `id` | Con qué se lo nombra. Es lo que viaja en el estado de la entrada |
| `root` | Por dónde entra. **Si va al menú, es su entrada de menú** |
| `steps` | Los pasos, en cualquier orden: lo que los ordena es el recorrido, no la lista |
| `label?` | Lo que dice el menú. **Por omisión, el título de la raíz** |
| `section?` | Dónde agrupa en el menú. Se mudó de la pantalla: agrupa **flujos** |
| `inMenu?` | Si se ofrece. Un flujo al que sólo se llega desde otro no va al menú |

**No tiene lista de pantallas.** Un flujo no posee pantallas: es un camino, y **una pantalla puede
estar en varios flujos** — que es el objetivo, no un efecto. Qué pantallas toca se lee de sus pasos.

## `Step` · una arista con verbo

Tres verbos, y **cada uno es una función que devuelve un paso**, así que el destino queda como dato
y no adentro de un handler. Eso es lo que permite preguntarle al flujo a dónde lleva un desenlace
—que es de lo que depende el filtrado por capacidad de una grilla— y verificar los destinos al
arrancar.

| verbo | destino | está en la pila | no está |
|---|---|---|---|
| `opens` | una pantalla **o un flujo** | desenrolla hasta ella | **apila** · si es un flujo, **abandona** y empieza aquél |
| `finishes` | una pantalla, o nada | desenrolla hasta ella | **reemplaza** el escalón actual · sin destino, la raíz |
| `closes` | — | — | desapila uno |

**La celda que los diferencia es una sola**: cuando terminaste, el escalón donde estabas ya no
tiene sentido, así que se reemplaza en vez de apilarse.

Un paso lleva además **cómo se arman los parámetros del destino** a partir del dato del desenlace,
y eso lo tipa `CU-41`: un parámetro que la ruta no declara no compila.

## `StackEntry` · un escalón

```
{ screen: string, params: Record<string, string> }
```

**La identidad de un escalón es pantalla más parámetros**, y ahí sale la recursión sin caso
especial: `movimiento#7 → movimiento#9` apila porque es otro dato, y `movimiento#9 → movimiento#7`
desenrolla porque ya está.

Sólo primitivos, porque **el escalón se serializa y se restaura al recargar**. Es `CU-26`
—identificadores, no datos— convertido en necesidad: `CU-44` ya lo pedía para el dato de un
desenlace, y acá deja de ser prudencia.

## `FlowState` · lo que viaja en cada entrada del historial

```
{ flow: string, stack: StackEntry[] }
```

Va en el `state` del ruteador. **Es estado de la entrada, no de la aplicación** — de eso depende que
el botón «atrás» funcione sin código.

Cuando viene vacío —enlace pegado, pestaña nueva— el flujo es el que arranca en la raíz de la
funcionalidad de esa pantalla, y la pila queda vacía.

## `ScreenDefinition` · lo que pierde

| | |
|---|---|
| `inMenu` | **Se va.** Al menú entra un flujo; ser raíz de uno ofrecido es estar en el menú |
| `section` | **Se muda al flujo.** Agrupa navegación, y lo que se navega ahora son flujos |
| `title` | **Se queda.** Es el de la cabecera, y el menú lo usa por omisión |

## `Feature` · lo que gana

| | |
|---|---|
| `root` | **A dónde cae un cerrar sin pila** para sus pantallas, y de dónde sale el flujo del enlace pegado |

Es la regla que faltaba desde la deuda 2 —*una funcionalidad tiene una pantalla raíz*—, ahora
declarada en vez de acertada. Y no ata la pantalla a un flujo: la funcionalidad ya la posee de
verdad, por la carpeta donde vive, y eso lo verifica `CU-15`.

---

## Lo que se verifica al arrancar

Seis, y ninguna necesita que una pantalla pertenezca a un solo flujo:

1. Toda pantalla registrada es **alcanzable**: raíz de un flujo, o destino de algún paso.
2. Todo desenlace declarado por una funcionalidad **tiene un paso**.
3. Ningún paso apunta a un desenlace **que ya nadie declara** — el que se pudre en silencio.
4. Ningún paso nombra **un flujo que no existe**.
5. Toda funcionalidad con pantallas **declara su raíz**.
6. La raíz de una funcionalidad es la raíz de **exactamente un flujo**, que es lo que hace
   determinístico el caso del enlace pegado.
