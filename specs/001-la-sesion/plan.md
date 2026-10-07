# Plan de implementación · La sesión

**Carpeta**: `001-la-sesion` · **Fecha**: 2026-08-20 · **Spec**: [`spec.md`](spec.md)

> Plantilla de Spec Kit, adaptada. Las secciones están en castellano y el «Constitution Check» se
> evalúa contra `.specify/memory/constitution.md`, no contra las de ejemplo. Ver Gobernanza.

## Resumen

El módulo de sesión de cuarzo: **entra, se mantiene adentro, y sale**, sin que ninguna pantalla sepa
que existe.

El enfoque técnico en una línea: **`oidc-client-ts` adentro, y una puerta propia afuera**. La
biblioteca resuelve el protocolo —PKCE, renovación silenciosa, ventana emergente— y nuestra puerta
expone únicamente *autorizar un pedido*, nunca un token.

## Contexto técnico

| | |
|---|---|
| **Lenguaje** | TypeScript 5.6 · React 19, heredados de granito (CU-15) |
| **Dependencia principal** | `oidc-client-ts` |
| **Almacenamiento** | Memoria por omisión; `sessionStorage` como única alternativa configurable |
| **Pruebas** | Vitest con Testing Library (CU-15) |
| **Plataforma** | Navegador, sólo desktop |
| **Tipo** | Biblioteca publicada desde cuarzo (CU-20, CU-22) |
| **Escala** | Cuatro aplicaciones, un realm compartido |

### Por qué `oidc-client-ts` y no otra cosa

**`keycloak-js` queda descartado por CU-10.** Es del proveedor, y la decisión dice que el proveedor
se puede cambiar. Usar su cliente ataría el módulo a Keycloak justo en el lugar que existe para no
estarlo — aunque quedara adentro del módulo.

**Escribirlo a mano queda descartado por riesgo.** El flujo de código con PKCE tiene demasiadas
piezas que hay que acertar —`state`, `nonce`, el verificador, la validación del token— y
equivocarse en cualquiera es un agujero de seguridad silencioso.

**`oidc-client-ts` cubre lo decidido punto por punto**: PKCE de fábrica, `automaticSilentRenew` que
renueva un minuto antes de vencer a partir del evento `accessTokenExpiring` (CU-8), `signinPopup`
para el reingreso sin descargar la página (CU-9), y `signinSilent` para la comprobación.

**No se usa `react-oidc-context`**, el envoltorio de React de los mismos autores: nuestra puerta ya
es la superficie de React, y envolver un envoltorio agrega una capa que después hay que explicar.

## Control de constitución

*Compuerta: se evalúa antes de la fase 0 y otra vez después del diseño.*

| principio | estado | por qué |
|---|---|---|
| **I · Proponer antes de escribir** | ✅ | La especificación, sus aclaraciones y este plan pasaron por el chat |
| **II · Lo que no está decidido se pregunta** | ✅ | Ninguna decisión de la que depende está abierta. CU-13 quedó fuera de alcance por depender de CU-18 |
| **III · Cuarzo no sabe de negocio** | ✅ | El módulo no conoce ninguna capacidad. Lo verifica una prueba, no la buena voluntad |
| **IV · Lo visual es de granito** | ✅ | El aviso y el bloqueo son `Dialog` y `Spinner`. Acá se decide **cuándo**, no cómo se ve |
| **V · Biblioteca o esqueleto** | ✅ | Biblioteca, y publicada desde cuarzo (CU-20) |
| **VI · Primero las decisiones** | ⚠️ | Se construye sin ninguna aplicación. **Es la excepción declarada** en el propio principio, con su evidencia: el mismo proveedor para todas |
| **Jerarquía de garantías** | ✅ | Tres pruebas, un «no compila» y un «se hereda». Lo humano queda sólo para los textos |

**Ninguna violación sin justificar.** La única marca es la excepción que la constitución declara.

## Estructura

### De esta especificación

```text
specs/001-la-sesion/
├── spec.md            qué tiene que hacer
├── plan.md            este archivo
├── research.md        fase 0
├── data-model.md      fase 1 · los estados y sus datos
├── contracts/         fase 1 · la superficie pública del módulo
├── quickstart.md      fase 1 · cómo se levanta y cómo se comprueba
├── checklists/
└── tasks.md           lo genera /speckit-tasks
```

### En el repositorio

```text
cuarzo/
├── src/                   ← LA APLICACIÓN BASE, lo que se clona (CU-15)
│   ├── app/ features/ components/ lib/ api/ testing/
├── packages/
│   └── sesion/            ← LO QUE SE PUBLICA
│       ├── src/
│       │   ├── puerta.ts       autoriza un pedido; no entrega tokens
│       │   ├── proveedor/      lo único que nombra OIDC
│       │   ├── falsa/          la segunda implementación
│       │   └── react/          el contexto y los ganchos
│       └── tests/
└── tests/decisions.mjs
```

**Decisión de estructura**: la raíz **es** la aplicación base, y la biblioteca vive en un workspace
bajo `packages/`.

El ritual de clonar **borra `packages/` y `specs/`**. No rompe nada: la aplicación ya declara
`@cuarzo/session` por versión, así que al desaparecer el workspace se resuelve desde el registro en
vez de la carpeta de al lado. Es el mismo modelo que granito ya usa, y evita que cada aplicación
arrastre el código fuente de una biblioteca que sólo consume.

## Complejidad y riesgos aceptados

| | por qué se acepta | qué lo vuelve tolerable |
|---|---|---|
| **Se construye sin consumidores** | Es la excepción declarada del principio VI, y hay evidencia: el mismo proveedor para todas | La implementación falsa es el segundo consumidor **desde el primer día**, y por CU-17 es además el modo de desarrollo |
| **CU-22 se apoya en algo sin verificar** | Que el proveedor emita un token por sistema desde la misma sesión | Esta especificación está acotada a **un sistema**, así que si CU-22 se cae, no hay que rehacer nada de acá |
| **Una dependencia externa en el corazón de la seguridad** | Escribirlo a mano es peor | La puerta la envuelve entera: cambiarla toca `proveedor/` y nada más. Lo verifica la prueba de que nada afuera la nombra |
