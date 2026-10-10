# Plan de implementación · La configuración versionada

**Carpeta**: `008-la-configuracion-versionada` · **Rama**: `008-la-configuracion-versionada` · **Fecha**: 2026-10-09 ·
**Spec**: [`spec.md`](spec.md)

## Resumen

Llevar al panel los tres niveles de configuración que el backend publica por API desde su feature
036: **ver** con qué se sirve cada merchant y de dónde sale cada valor, **recorrer** el historial de
versiones de cada nivel, y **publicar** una versión nueva editando lo operativo, con lo complejo
copiado intacto de la versión que rige. La configuración del merchant entra en `features/merchants`,
alcanzada desde la ficha; plataforma y defaults son una funcionalidad nueva, `features/configuration`,
con su grupo de menú.

**Lo que la investigación cambió**, en cuatro puntos ([`research.md`](research.md)): los campos se
nombran **como el camino de su valor en el cuerpo**, y así el `422` cae en su campo sin tabla (§1); el
núcleo gana **tres piezas de forma** —una lista como destino de su error, las restricciones aplanadas
por `ref` y las conversiones de tasa y duración— (§2 a §5); una duración tiene **una unidad por
valor**, no la mayor exacta, y el escenario 16 de la spec se ajusta (§5); y el congelamiento es un
**modo de la pantalla**, no un diálogo (§10).

**Y lo que depende del backend**: nada para construir. Queda abierto pedirle un testigo de
concurrencia para la configuración (spec, «Lo que queda abierto»).

## Contexto técnico

| | | de dónde sale |
|---|---|---|
| **Lenguaje** | TypeScript `strict`, Node 24; prosa en castellano, código en inglés | constitución, `CU-15` |
| **Dónde** | `apps/console/src/features/merchants/` (vista y publicación del merchant); `apps/console/src/features/configuration/` NUEVA (plataforma y defaults); `apps/console/src/components/` (historial y sección correctiva, que usan las dos); `apps/console/src/api/ope/client.ts` (las once operaciones); `packages/core/src/` (tres piezas de forma) | principios III y V |
| **Interfaz** | `@granito/ui`: `Form`, `Section`, `Field`, `Value`, `FormattedValue`, `NumberInput` con `suffix`, `TextInput`, `Select`, `Checkbox`, `MarkGroup`, `Badge`, `Table`, `Button` | principio IV |
| **Datos** | `useQuery` para cada vista, una colección con cursor por historial, `useAction` para cada publicación con `onRejected` para el `409` | `CU-24`, `CU-25`, `OW-4` |
| **Contrato** | Las once operaciones de [`data-model.md`](data-model.md) §1; los esquemas de entrada y sus partes en `CONSTRAINTS`; `idempotent: true` en las tres publicaciones | `OW-5` |
| **Errores** | `409 configuration-frozen` → modo correctivo; `422 invalid-configuration-value`, `locale-incomplete`, `configuration-reason-required` en su campo; `duplicate-attribute-label` al pie; `403`, `404`, `503` con `requestId` | `OW-3`, `CU-49` |
| **Pruebas** | Vitest con Testing Library: pantallas montadas en la aplicación real contra un `OpeClient` de mentira, como la 006 y la 007; las piezas del núcleo con casos que rompen; `ope-check` entero | spec «Cómo se verifica» |
| **Alcance** | Seis pantallas (tres vistas, tres publicaciones), una de versión, dos historiales compartidos, tres acciones, una funcionalidad y un grupo de menú nuevos, tres piezas del núcleo | spec «Escenarios» |

Sin `NEEDS CLARIFICATION`: el alcance lo decidió el dueño el 2026-10-09 y la spec se acordó con
«sigue». El supuesto del alcance acotado quedó verificado en el backend (research §8).

## Control de constitución

Contra la constitución de OPE-Web, **versión 2.0.0** (enmendada 2026-10-08). Los seis principios,
también los que no cambian nada acá:

| principio | cómo lo cumple |
|---|---|
| **I** · La spec y el plan se acuerdan; la feature se implementa con autonomía | La spec se acordó con «sigue». Este plan se presenta antes de las tareas; los tramos se implementan y commitean sin esperar OK por archivo |
| **II** · Lo que no está decidido se pregunta | El alcance se preguntó con herramienta antes de la spec. Lo que la spec dejó abierto y es composición —la unidad de cada duración— se decide acá y se dice que cambia el escenario 16. El testigo de concurrencia queda abierto como pedido, no se resuelve por cuenta propia |
| **III** · `packages/` no sabe de negocio | Al núcleo entran tres piezas de forma: una lista que recibe su error, restricciones aplanadas por `ref`, y tasa y duración como presentación. Ninguna nombra merchant, plataforma ni tratamiento. Qué unidad tiene cada valor es de la funcionalidad |
| **IV** · Lo visual es de granito | Todo compone granito sin `className` ni estilo. «Un valor con su origen» y «un campo que alterna entre heredado y declarado» se componen con `Field`, `Value` y `Button`; si no componen, van a `propuestas-a-granito.md` |
| **V** · Paquete o aplicación, y la prueba es una sola | ¿Si arreglo cómo se lee una tasa, tiene que llegarle al portal? Sí → núcleo. ¿Si arreglo el historial de versiones? Sólo a la consola, a sus dos funcionalidades → `apps/console/src/components`. ¿Si arreglo qué unidad tiene la frescura? Es de OPE → funcionalidad |
| **VI** · Se comparte la puerta, no el proveedor | El alcance `*` para publicar los globales se lee de los claims que la puerta ya entrega (`OW-7`); la puerta no se toca. Se declara para que conste que se miró |

### Qué garantía sostiene cada cosa

| | qué sostiene |
|---|---|
| **se genera** | Los tipos de los tres niveles, sus entradas, versiones y páginas; `OPERATIONS` de las once; `CONSTRAINTS` de todos los esquemas que los formularios aplanan |
| **no compila** | Un cuerpo que no es el esquema de entrada de su nivel; un campo de vista que lee lo que el efectivo no tiene; una unidad declarada para un campo que no existe en el contrato; un desenlace que el flujo no cablea (`verifyFlows`) |
| **se hereda** | La vista, el historial, la publicación y el modo correctivo son la forma de un recurso versionado: textos y experimentos la copian de `features/configuration` |
| **lo agarra una prueba** | Las de la spec, una por escenario, en cada tramo; las conversiones con `0.07`, `0.1`, `0.375`, `0.0001 s` y `129600000`; el cuerpo armado sin tocar nada igual a lo declarado; `ope-check` entero |
| **lo mira una persona** | Contra el backend real, con el `quickstart.md`: los tres niveles, publicar, heredar, el `409` con un experimento activo |

**Tres comprobaciones nuevas se rompen a propósito antes de creerles**: la de la tasa (multiplicando
en vez de correr la coma), la del cuerpo (perdiendo `anchors`) y la de la lista como destino
(volviendo a mandar su error al pie).

## Estructura

```
ope/mvp/web/
├── packages/core/
│   ├── src/ui/use-form.ts                 una lista con renglones es destino de su error (research §2)
│   ├── src/data/constraints-of.ts         NUEVO · constraintsOf(CONSTRAINTS, raíz, prefijo): aplana por ref (§3)
│   ├── src/base/units.ts                  NUEVO · tasa ↔ porcentaje sobre el texto; duración ↔ unidad, exacta o error (§4, §5)
│   └── tests/                             form.test.ts, constraints-of.test.ts, units.test.ts
├── apps/console/src/
│   ├── api/ope/client.ts                  las once operaciones; los tipos de los tres niveles
│   ├── app/flows.ts                       los pasos nuevos de merchants; el flujo y el grupo de configuración
│   ├── app/features.ts                    + configuration
│   ├── components/
│   │   ├── version-history.tsx            NUEVO · la tabla del historial con cursor, para los tres niveles
│   │   └── corrective-section.tsx         NUEVO · correctiva, motivo y qué implica
│   └── features/
│       ├── merchants/
│       │   ├── data/merchant-configuration.ts         NUEVO · la vista, el historial, la acción
│       │   ├── data/configuration-body.ts             NUEVO · valores ↔ cuerpo, con lo complejo copiado (§6, §7)
│       │   ├── data/configuration-body.test.ts        NUEVO · el cuerpo sin tocar nada es lo declarado
│       │   ├── screens/configuration-screen.tsx       NUEVO · /merchants/:merchantId/configuration
│       │   ├── screens/publish-configuration-screen.tsx   NUEVO · …/configuration/publish
│       │   ├── screens/*.test.tsx                     las dos, montadas
│       │   ├── screens/merchant-screen.tsx            «Configuración» al pie, con configuration:read
│       │   ├── feature.ts · strings.ts                pantallas, desenlaces, textos
│       └── configuration/                             NUEVA
│           ├── feature.ts · strings.ts
│           ├── data/units.ts                          la unidad de cada valor (data-model §2)
│           ├── data/levels.ts                         plataforma y defaults: vistas, historiales, acciones
│           ├── data/level-body.ts (+ test)            valores ↔ contenido, con lo complejo copiado
│           ├── screens/treatment-fields.tsx           los campos de tratamiento, que usan defaults y merchant
│           ├── screens/platform-screen.tsx · publish-platform-screen.tsx
│           ├── screens/defaults-screen.tsx · publish-defaults-screen.tsx
│           ├── screens/level-version-screen.tsx       una versión del historial
│           └── screens/*.test.tsx
└── docs/propuestas-a-granito.md          sólo si «valor con origen» o «heredado/declarado» no componen
```

**Decisión de estructura.** Los campos de tratamiento y la tabla de unidades los usan los defaults y el
merchant. Viven en `features/configuration` y `features/merchants` los importa: `boundaries` deja que
una funcionalidad importe de otra, y la dirección es la del dominio —el merchant declara **sobre** el
tratamiento—. El historial y la sección correctiva son visuales y los usan las dos: van a
`components/`.

## El orden

**Cinco tramos, y cada uno termina en algo que se puede correr.**

| | qué | punto de control |
|---|---|---|
| **1** | **El núcleo y el contrato**: la lista como destino de su error, `constraintsOf`, tasa y duración; las once operaciones en `client.ts`; `features/configuration` vacía con su tabla de unidades | Las pruebas del núcleo en verde, cada una rota a propósito una vez; `npm test` y `npm run build` |
| **2** | **El merchant se ve**: la vista con las tres versiones y el origen de cada valor, lo complejo resumido, el historial, «Configuración» en la ficha | Contra el backend: la configuración de «Tienda de desarrollo», todo heredado y «sin versión propia»; sin `configuration:read` no hay entrada |
| **3** | **El merchant se publica**: `configuration-body` con su prueba, los campos de tratamiento, heredar y declarar, la publicación, el modo correctivo, los `422` | Contra el backend: declarar el holdout, publicar, ver «declarado» y la versión 1 en el historial; volver a heredarlo; el cuerpo igual avisa «no cambió»; con un experimento activo, el `409` y la correctiva |
| **4** | **Plataforma y defaults**: el grupo de menú, las dos vistas, sus historiales, la versión por número, las dos publicaciones | Contra el backend: publicar una plataforma y unos defaults; con alcance acotado no hay «publicar»; las mediciones reiniciadas en el aviso |
| **5** | **El cierre**: `quickstart.md` con lo corrido, `estado.md`, `npm test`, `npm run revisar`, `npm run build` | Los escenarios a mano; todo en verde |

**El 1 va primero** porque todo lo demás compone sus piezas. **El 2 antes que el 3**: la publicación
precarga lo que la vista muestra. **El 3 antes que el 4**: los campos de tratamiento nacen con el
merchant, que es el caso difícil —heredar o declarar—, y los defaults los usan sin esa alternancia.
**El 5 va último.**

**Cada tramo es un commit** (o pocos), en castellano y convencional, y **ninguno se commitea con
`npm test` en rojo**.

## Complejidad y riesgos aceptados

**Es la feature más grande del panel hasta hoy.** Seis pantallas y tres piezas del núcleo. Si un tramo
crece más de lo previsto, se parte en dos commits; no se recorta alcance sin preguntar.

**Heredar o declarar no tiene pieza en granito.** Se compone con `Field`, `Value` y un botón compacto.
Si al mirarlo no se lee, es una propuesta con el caso.

**La publicación arrastra lo complejo de la versión que rigió al abrir.** Sin testigo en el contrato
no hay cómo saber si cambió debajo. La pantalla lo dice en su sección; el pedido al backend queda
abierto.

**La unidad de cada duración es una elección.** Está en un solo lugar (`data/units.ts`); si al usarla
alguna se lee mal, se cambia una línea y cambian la vista, la edición y el historial juntas.
