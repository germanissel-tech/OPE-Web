# Plan de implementación · La pila de flujo

**Carpeta**: `003-la-pila-de-flujo` · **Fecha**: 2026-08-23 · **Spec**: [`spec.md`](spec.md)

## Resumen

Reemplazar las aristas sueltas de `app/routing.ts` por **flujos declarados**, y darle a la
aplicación una pila que preserve dónde estaba el operador. Cuando termine, **una pantalla no nombra
a otra** —que es `CU-44` enmendada— y volver de un detalle deja al operador donde estaba.

**Este plan sale de afuera.** `granito#PED-11` trajo `GR-73`, y con él un argumento que desde acá no
se veía: una pantalla que nombra su destino sirve en un solo recorrido. La deuda 2 llevaba abierta
desde que se escribió el catálogo, esperando exactamente eso.

## Contexto técnico

| | | de dónde sale |
|---|---|---|
| **Lenguaje** | TypeScript en `strict`, sin `any` | `CU-15` |
| **Ruteo e historial** | React Router 7, y **su `state`**, no la History API | **investigación §1** |
| **Desenrollado** | `navigate(-n)`, en un solo salto | **investigación §2** |
| **El aviso** | `useBlocker` del ruteador, que **sí agarra el «atrás»** | **investigación §4** |
| **El lugar** | Parámetros de consulta, mudando `useTableQuery` | `CU-14` |
| **Interfaz** | El diálogo de granito para el aviso. Nada propio | principio IV |
| **Pruebas** | Vitest con `createMemoryRouter` | `CU-16` |

**Las cuatro incógnitas se midieron antes de escribir esto**, en
[`research.md`](research.md). Una corrigió la especificación: el botón «atrás» **sí** se puede
interceptar, y lo que estaba declarado como límite duro no lo era.

## Control de constitución

| principio | cómo lo cumple |
|---|---|
| **I** · Proponer antes de escribir | El modelo se revisó entero en el chat, y cambió tres veces: la pantalla dejó de pertenecer a un flujo, el flujo pasó al contexto, y el menú de usuario dejó de abandonar |
| **II** · Lo que no está decidido se pregunta | Seis preguntas en `/speckit-clarify`. La de mayor impacto **no estaba anotada como abierta**, y sin ella el aviso no tenía de dónde colgar |
| **III** · Cuarzo no sabe de negocio | El flujo del catálogo es el hola mundo. Ningún término del glosario entra acá |
| **IV** · Lo visual es de granito | El diálogo del aviso es de ellos. Si falta algo, es un pedido |
| **V** · Biblioteca o esqueleto | Los verbos, la pila y las comprobaciones se publican; `app/flows/` se copia |
| **VI** · Primero las decisiones | `CU-44` se enmendó **antes** de planificar, no después de implementar |

### Qué garantía sostiene cada cosa

| | qué sostiene |
|---|---|
| **no compila** | El destino de un paso, con **sus** parámetros. Un desenlace inventado, un parámetro que la ruta no declara, una pantalla que no existe |
| **no arranca** | Las seis comprobaciones de arranque. Un escalón menos que compilar, heredado de `CU-44` con su razón |
| **lo agarra una prueba** | Los tres verbos, los siete casos del «atrás» con sus dos arrugas, el aviso en cuatro caminos y su ausencia al terminar, y **que una pantalla no importe a otra** |
| **se hereda** | `app/flows/catalog.ts` viaja en el esqueleto: quien clona tiene el ejemplo, no la página en blanco |
| **lo mira una persona** | Cinco cosas, todas en [`quickstart.md`](quickstart.md). Que la lista sea corta es la señal de que lo demás está mecanizado |

## Estructura

### De esta especificación

```text
specs/003-la-pila-de-flujo/
├── spec.md             qué resuelve, 14 escenarios, y las seis aclaraciones
├── research.md         las cuatro incógnitas, medidas
├── data-model.md       las cinco cosas, y las seis comprobaciones
├── contracts/flujo.md  la superficie que una aplicación escribe
├── quickstart.md       lo que sólo se ve en un navegador
└── plan.md             éste
```

### En el repositorio

```text
packages/core/src/
├── base/
│   ├── flow.ts            defineFlow, opens, closes, finishes · los tipos
│   ├── flow-state.ts      el escalón, la pila, y las tres transiciones (sin React)
│   └── registry.ts        pierde inMenu y section
├── data/
│   └── use-flow.ts        useFlow: lee location.state y envuelve navigate
├── ui/
│   ├── unsaved-work.tsx   useUnsavedWork y el diálogo, sobre useBlocker
│   └── use-table-query.ts pasa de useState a parámetros de consulta
├── app/
│   └── create-application.tsx  compone, y corre las seis comprobaciones
└── checks/boundaries.mjs  una pantalla no importa a otra pantalla

src/app/flows/catalog.ts   el flujo del catálogo · se copia y diverge
```

**Las tres transiciones van en `base` y sin React** —apilar, reemplazar, desenrollar— porque son
aritmética sobre una lista. Probarlas no necesita dibujar nada, y ahí es donde están los casos
raros.

## El orden

Cinco tramos, y **cada uno termina con la aplicación arrancando**.

| | qué | por qué va acá |
|---|---|---|
| **1** | Las tres transiciones en `base`, con sus pruebas. Sin React, sin ruteador | Es el corazón, y es lo único que se puede probar exhaustivamente. Si la aritmética está mal, todo lo demás miente |
| **2** | `defineFlow`, los tres verbos, y las seis comprobaciones de arranque | La forma declarada, con el compilador y el arranque puestos antes de que haya código que los necesite |
| **3** | `useFlow` sobre el ruteador, y el catálogo migrado a flujos | El primer flujo real. Acá se cae `goTo` de las pantallas |
| **4** | `useTableQuery` a parámetros de consulta | **Después** del 3: sin pila, mudar el filtro a la URL no se puede verificar de punta a punta |
| **5** | El aviso de trabajo sin guardar, y la comprobación de límites | La comprobación va **última**: puesta antes rompe el repositorio y hay que apagarla, que es cómo una comprobación se vuelve opcional |

**El punto de control de los cinco es el mismo**: el catálogo entero, a mano, sin volver a filtrar
nunca.

## Complejidad y riesgos aceptados

**`GR-73` se trazó en papel**, y granito lo dijo. El catálogo es el primer flujo real; lo que
aparezca es un pedido de vuelta para ellos y no un parche de este lado.

**Dos arrugas del navegador se aceptan con prueba** —la entrada «adelante» que queda viva, y el
«atrás» que no se ve después de terminar—. Están decididas en las aclaraciones, con su alternativa
escrita por si un día molestan.

**El rebote del «atrás» se ve o no se ve, y eso no lo sabe una prueba.** Está en `quickstart.md`
como paso a mano, y es de las pocas cosas que sólo puede mirar una persona.

**El código va a estar en incumplimiento hasta el tramo 3.** `CU-44` ya dice lo que va a valer, y la
propia decisión avisa que el código todavía no la cumple. Es deliberado: enmendar primero fue lo que
permitió planificar contra algo firme, y no al revés.
