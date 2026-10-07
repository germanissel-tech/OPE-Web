# Plan de implementación · El testigo y el conflicto

**Carpeta**: `004-el-testigo-y-el-conflicto` · **Fecha**: 2026-08-29 · **Spec**: [`spec.md`](spec.md)

## Resumen

Construir `CU-29`, que está decidida y vacía: hacer que el testigo viaje en las dos direcciones, que
la puerta de acciones sepa qué hacer cuando el servidor rechaza, y darle al esqueleto una edición de
verdad para que eso tenga un consumidor.

**Este plan sale de afuera, como el de `003`.** Lo trajo la primera aplicación: el agente de
`las-animas/admin` leyó `CU-29`, no encontró cómo cumplirla, y estaba por construirla adentro de su
formulario de empresas — donde la habría reescrito en sucursales, bancos y el resto.

**La investigación achicó el trabajo a la mitad.** El camino de ida ya existe: `unwrap` es el único
lugar por donde pasa toda respuesta, ya recibe la respuesta cruda y ya transporta un dato sacado de
un encabezado. El testigo entra por ahí, y llega solo a toda pantalla que ya recibe `Page<T>`.

## Contexto técnico

| | | de dónde sale |
|---|---|---|
| **Lenguaje** | TypeScript en `strict`, sin `any` | `CU-15` |
| **El testigo, de ida** | Un campo en `Meta`, leído del encabezado en `unwrap` | **investigación §1** |
| **El testigo, de vuelta** | El canal que ya usa la clave de idempotencia: tercer parámetro de `run`, puesto por la puerta | **investigación §2** |
| **La obligación** | `versioned` declarado en `operation`, con el tipo exigiéndolo | **investigación §3** |
| **La comparación** | En la puerta (`CU-25`), campo a campo contra la versión cargada | `CU-29` |
| **Interfaz** | El `Dialog` de granito, compuesto con `FormattedValue`. **Nada propio** | **investigación §5** · principio IV |
| **El ejemplo** | `contracts/demo.yaml` gana el testigo, y el simulado lo hace cumplir | **investigación §4** · aclaración |
| **La edición** | Una región de la misma página, no un diálogo | `GR-42` · `granito#PED-8` · deuda 3 |
| **Pruebas** | Vitest, y `@ts-expect-error` para lo que no tiene que compilar | `CU-16` |

**Las cinco incógnitas se midieron antes de escribir esto**, en [`research.md`](research.md). Dos
cambiaron lo que iba a proponer: el camino de ida no había que construirlo, y **granito no tiene un
componente de comparación** — así que se compone con los suyos y se propone después, con evidencia.

## Control de constitución

| principio | cómo lo cumple |
|---|---|
| **I** · Proponer antes de escribir | La spec y este plan pasaron por el chat antes de una línea de código. La pregunta original del agente se corrigió ahí: pedía «los campos que difieren» y `CU-29` dice la intersección |
| **II** · Lo que no está decidido se pregunta | Dos aclaraciones, y **una no era pregunta**: el contrato de `las-animas` ya tenía el mecanismo y se leyó en vez de preguntarlo. La que queda abierta —campos atados— se deja abierta, no se rellena |
| **III** · Cuarzo no sabe de negocio | La comparación es campo a campo y no sabe qué significa ningún campo. Que dos estén atados **es de la aplicación**, y por eso queda afuera |
| **IV** · Lo visual es de granito | Se compone con `Dialog` y `FormattedValue`. Si no alcanza, es una propuesta a ellos y está anotado como tal |
| **V** · Biblioteca o esqueleto | La puerta, el transporte y el tipo se publican; la edición del catálogo se copia. Declarado en la spec |
| **VI** · Primero las decisiones | `CU-29` está tomada desde antes. Acá no se decide nada nuevo: se construye lo que dice |

### Qué garantía sostiene cada cosa

| | qué sostiene |
|---|---|
| **no compila** | Una escritura sobre una operación que declara testigo, **sin el testigo**. Es la promesa más fuerte de la spec y la que impide que una pantalla nueva se olvide |
| **lo agarra una prueba** | Los cinco escenarios. Sobre todo el 3 —**sin cruce no molesta**—, que lo tecleado sobreviva, y que el segundo rechazo no reintente solo |
| **se hereda** | La puerta viaja en `@cuarzo/core`. Una aplicación la recibe sin copiar nada, y la edición del catálogo le llega como ejemplo |
| **se genera** | Los tipos del contrato, de donde sale que un recurso lleva testigo |
| **lo mira una persona** | Dos cosas: que el texto no prometa quién escribió, y que la comparación se entienda de un vistazo. Que la lista sea corta es la señal de que lo demás está mecanizado |

Y **una comprobación nueva**: que la puerta trate el rechazo por conflicto. Es la garantía que faltaba
—la que dejó a `CU-29` declarada y vacía— y sin ella esto se pudre igual que la primera vez.

## Estructura

```
packages/core/src/data/
├── envelope.ts        `Meta` gana el testigo; `unwrap` lo lee del encabezado
├── action.ts          `operation` declara `versioned`, y el tipo lo exige
├── conflict.ts        NUEVO · la comparación: intersección de lo cambiado
└── use-action.ts      la puerta: reconoce el rechazo, relee, compara, decide

packages/core/src/ui/
└── conflict-dialog.tsx  NUEVO · compone Dialog + FormattedValue. Sin nada propio

packages/core/checks/
└── quality.mjs        la comprobación nueva: la puerta trata el conflicto

src/                   el esqueleto, que es lo que se copia
├── api/demo/client.ts   manda el testigo al escribir
└── features/catalog/screens/
    └── edit-article.tsx  NUEVO · la edición como región, no como diálogo

contracts/demo.yaml    gana el testigo
tests/mock.mjs         lo emite y lo hace cumplir de verdad
```

## El orden

**Cuatro tramos, y cada uno termina en algo que se puede correr.** El punto de control de cada uno
está dicho: sin eso son casillas.

| | qué | punto de control |
|---|---|---|
| **1** | El testigo de ida: `Meta`, `unwrap`, el contrato del ejemplo y el simulado emitiéndolo | Abrir un artículo y **ver el testigo en `meta`**. Una prueba que falla si el encabezado no llega |
| **2** | El testigo de vuelta: `operation` con `versioned`, el canal, y **el tipo que lo exige** | Un `@ts-expect-error` que falla si escribir sin testigo compila. Y el simulado rechazando de verdad |
| **3** | La comparación y la puerta: `conflict.ts`, el rechazo reconocido, el diálogo compuesto | Los cinco escenarios en prueba. **El 3 primero**: sin cruce, no molesta |
| **4** | La edición del catálogo como región, y la comprobación nueva | La aplicación arrancando: editar un artículo, provocar el choque, y ver la comparación |

**El 1 y el 2 no sirven sueltos, pero se separan igual**: el 1 se puede verificar solo —el testigo
llega— y el 2 necesita que el 1 exista. Meterlos juntos haría un tramo que sólo se puede probar al
final, que es lo que este repositorio evita.

**El 4 arrastra la deuda 3** y la paga: la edición no puede ser un diálogo, así que el esqueleto gana
el contenedor que `granito#PED-8` ya eligió — una región de la misma página, con la grilla a la vista.

## Complejidad y riesgos aceptados

**El escenario 6 queda afuera**, y con condición escrita: la comparación tiene que poder recibir
después la declaración de campos atados **sin cambiar de forma**. Si al construir el tramo 3 esa
condición no se puede sostener, el tramo no cierra — es la diferencia entre dejar una puerta y dejar
un agujero.

**La comparación es por igualdad de valores.** Alcanza para catálogos, que es lo que hay. Un recurso
con estructuras anidadas va a necesitar más, y **todavía no existe ninguno**: construirlo ahora sería
adivinar la forma con el primer consumidor.

**El diálogo compuesto puede no alcanzar.** Es el riesgo que la investigación §5 dejó anotado: se
compone con lo de granito, se mira, y si no se entiende **es una propuesta a ellos**. Lo que no se
hace es dibujar un componente propio para tapar eso, que es lo que el principio IV prohíbe.

**El tramo 4 toca `src/`**, que es el molde de cuatro aplicaciones. Un contenedor mal elegido ahí se
copia cuatro veces — por eso la forma no se elige acá: ya la eligió `granito#PED-8`.
