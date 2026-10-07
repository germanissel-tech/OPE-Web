# Plan de implementación · El esqueleto

**Carpeta**: `002-el-esqueleto` · **Fecha**: 2026-08-21 · **Spec**: [`spec.md`](spec.md)

## Resumen

Armar **la aplicación base que corre**: la forma que se copia y los dos paquetes que se publican
(`CU-40`). Cuando termine, cuarzo cumple su propio criterio —**que se pueda levantar** (`CU-20`)— y
empezar una aplicación de Tandilia es clonar.

**Este plan es el momento en que el principio VI se da vuelta.** Cuarenta y una decisiones primero,
y recién ahora la primera aplicación. No queda ninguna abierta que haga falta para levantar.

## Contexto técnico

| | | de dónde sale |
|---|---|---|
| **Lenguaje** | TypeScript en `strict`, sin `any` | `CU-15` |
| **Interfaz** | React, y los componentes de granito | `CU-7` · principio IV |
| **Ruteo** | React Router, con los tipos derivados del registro | **`CU-41`** |
| **Datos** | `openapi-fetch` sobre el contrato, con TanStack Query | `CU-14` |
| **Herramientas** | Vite, Biome, Vitest | `CU-16` |
| **Sesión** | `@cuarzo/session` con la implementación falsa | `001` · `CU-17` |
| **Backend** | El simulado de Prism, contra el contrato de verdad | `CU-36` |
| **Empaquetado** | Espacios de trabajo de npm, dos paquetes publicados | `CU-40` |

**Sin red interna, sin VPN y sin credenciales.** Es requisito, no comodidad: es lo que permite
construir todo esto hoy.

Las cinco incógnitas que quedaban se resuelven en [`research.md`](research.md).

## Control de constitución

| principio | cómo lo cumple |
|---|---|
| **I** · Proponer antes de escribir | El ciclo entero pasó por el chat, y `CU-41` salió de una pregunta y no de un supuesto |
| **II** · Lo que no está decidido se pregunta | El ruteador no estaba decidido. **Se preguntó**, y salió `CU-41` |
| **III** · Cuarzo no sabe de negocio | Las dos pantallas de ejemplo van contra un catálogo del simulado. Ningún término del glosario entra acá |
| **IV** · Lo visual es de granito | Nada se redibuja. Si falta un componente, es una propuesta a granito |
| **V** · Biblioteca o esqueleto | Contestada en la spec y precisada por `CU-40`: la conducta se publica, la forma se copia |
| **VI** · Primero las decisiones | **Se cumplió y se agota acá.** Después de esto, cuarzo tiene código |

### Qué garantía sostiene cada cosa

| garantía | qué sostiene |
|---|---|
| **No compila** | La navegación con el parámetro equivocado (`CU-41`) · que una pantalla no obtenga un token (`CU-10`) · `strict` sin `any` (`CU-15`) |
| **Se genera** | El menú y las rutas, del registro (`CU-23`) · los tipos del contrato, de OpenAPI (`CU-14`) · la capacidad de una acción, del contrato (`CU-37`) |
| **Lo agarra una prueba** | La dirección de las importaciones (`CU-15`) · que la falsa no esté en el artefacto (`CU-36`) · **que el clon arranque** |
| **Se hereda** | `CLAUDE.md`, `.specify/` y la comprobación viajan con el clon (`CU-20`) |
| **Lo mira una persona** | La composición del marco y los textos |

**Ninguna violación que justificar.** La única tensión declarada es la de `CU-41`, y está anotada
abajo con su costo.

## Estructura

### De esta especificación

```
specs/002-el-esqueleto/
├── spec.md          17 escenarios, 3 aclaraciones
├── plan.md          este archivo
├── research.md      las cinco incógnitas
├── data-model.md    lo que el esqueleto modela
├── contracts/
│   └── nucleo.md    lo que expone @cuarzo/core
├── quickstart.md    cómo se levanta, y el ritual de clonar
└── checklists/
```

### En el repositorio

```
cuarzo/
├── package.json          espacios de trabajo + la aplicación
├── index.html
├── vite.config.ts        se copia
├── biome.json            se copia
├── tsconfig.json         se copia
├── config.json           por entorno, sin caché (CU-17)
├── src/
│   ├── app/              la raíz de composición (CU-36).  se copia
│   ├── features/         una carpeta por funcionalidad.   la aplicación agrega
│   ├── components/       lo compartido de esta aplicación
│   ├── lib/              la sesión, el formateo, lo transversal
│   ├── testing/          utilidades y dobles
│   └── api/              una carpeta por sistema
├── packages/
│   ├── nucleo/           @cuarzo/core · base, datos, interfaz (CU-40)
│   └── sesion/           @cuarzo/session · la especificación 001
└── tests/
    ├── decisiones.mjs    ya existe
    ├── limites.mjs       la dirección de las importaciones
    ├── artefacto.mjs     que la falsa no esté en dist/
    └── clon.mjs          la que verifica la promesa
```

**El clon borra `packages/` y `specs/`**, y las dos pantallas de ejemplo **se quedan**.

## El orden

Una **columna vertebral que arranca en cada paso**. No hay una integración grande al final: si un
tramo no levanta, se sabe en ese tramo.

| | tramo | cuando termina, la aplicación… |
|---|---|---|
| 1 | Andamio, configuración, raíz de composición | …arranca en blanco, y **falla diciendo qué falta** si la configuración está mal |
| 2 | Sesión falsa + marco de granito + barra de usuario | …muestra el marco con quién está |
| 3 | Registro de pantallas, rutas y menú | …navega, con el menú saliendo del registro |
| 4 | Los cuatro estados + la grilla contra el simulado | …trae datos, y muestra sus cuatro estados |
| 5 | Puerta de acciones + el formulario | …escribe, valida, e invalida la grilla |
| 6 | Error de pantalla, contextos, registro | …sobrevive a una pantalla que revienta |
| 7 | Los dos paquetes, y la prueba del clon | …**se clona y arranca** |

**El tramo 7 no es empaquetar al final**: los límites entre `nucleo` y la aplicación se respetan
desde el tramo 1, verificados por `limites.mjs`. Lo que hace el 7 es **mudar** lo que ya está
separado. Es la asimetría de `CU-40`: partir después es barato si los límites ya están puestos.

## Complejidad y riesgos aceptados

**Las cuarenta líneas de inferencia de tipos de `CU-41`.** Código propio que hay que entender cuando
falle. Se aceptó a cambio de que el registro siga siendo la única fuente, y la salida está escrita en
la decisión.

**Dos paquetes antes de que exista un segundo consumidor.** Podría parecer prematuro. `CU-40` lo
justifica por la asimetría —juntar después rompe a todos— y lo acota con un criterio explícito de
cuándo una categoría se gana el suyo.

**Las pantallas de ejemplo viajan en el clon.** Es código que la aplicación no pidió. A cambio, la
prueba que verifica la promesa **verifica una aplicación y no una cáscara**, y quien clona tiene de
dónde copiar. Sacarlas es un paso posterior y documentado.

**Prism no es el backend.** Responde del contrato, así que da forma pero no reglas. Lo que dependa de
una regla de negocio del servidor **no se prueba acá**, y no se finge que sí.
