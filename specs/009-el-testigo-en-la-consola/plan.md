# Plan de implementación · El testigo en la consola

**Carpeta**: `009-el-testigo-en-la-consola` · **Rama**: `009-el-testigo-en-la-consola` · **Fecha**: 2026-10-10 ·
**Spec**: [`spec.md`](spec.md)

## Resumen

Las cuatro pantallas que reemplazan lo que leyeron —publicar la configuración de un merchant, de la plataforma y
de los defaults, y editar la identidad— vuelven a guardar: mandan el testigo de lo que leyeron, y cuando alguien
escribió en el medio la recuperación `CU-29` del núcleo relee, compara y guarda sola o muestra el choque. El
historial muestra las mediciones reiniciadas, y la versión del merchant se pide por número.

**Lo que la investigación cambió** ([`research.md`](research.md)): la recuperación ya está entera en el núcleo, y
lo que falta es que el testigo salga de las lecturas y entre en las escrituras (§1, §2). La comparación de la
puerta recorre claves, y los formularios de la 008 heredan por ausencia, parten las listas en renglones y
escriben números en unidades: cada pantalla le da a la puerta **una clave por hoja, en unidades del contrato**
(§3). Lo que no se edita sale de la versión que rige al reintentar (§4).

**Lo que depende del backend**: el contrato `1.15.0` en `main` (OPE-Backend #52). Sin él no hay tipos para
`If-Match` y `contract:sync` no tiene qué copiar. La spec, el plan y las tareas no lo necesitan.

## Contexto técnico

| | | de dónde sale |
|---|---|---|
| **Lenguaje** | TypeScript `strict`, Node 24; prosa en castellano, código en inglés | constitución, `CU-15` |
| **Dónde** | `packages/core/src/data/` (`unwrapWitnessed`, `versioned` en el requisito, `witness-required` como propio); `apps/console/src/api/ope/client.ts` (cuatro lecturas con testigo, cuatro escrituras que lo mandan, la versión del merchant por número); `apps/console/src/features/configuration/` (tres publicaciones, historial del merchant, versión del merchant); `apps/console/src/features/merchants/` (la identidad) | principios III y V |
| **Interfaz** | `ConflictDialog` del núcleo, que compone granito; nada nuevo de granito | principio IV |
| **Datos** | `useAction` con `concurrency` en las cuatro publicaciones; `useQuery` igual que hoy, ahora con el testigo en el dato | `CU-25`, `CU-29` |
| **Contrato** | `1.15.0`: `If-Match` en las cuatro escrituras, `ETag` en sus lecturas, `412 stale-version`, `428 witness-required`, `versioned: true` en `OPERATIONS`; `getMerchantConfigurationVersion` y `windowsRestarted` de la 042 | `OW-5`, ADR-046 del backend |
| **Errores** | `412` → `CU-29`; `428` → defecto propio con rastro; el `409` y los `422` de la 008 como estaban | `CU-14`, `CU-25` |
| **Pruebas** | Vitest con Testing Library, las pantallas montadas en la aplicación real contra un `OpeClient` de mentira que responde `412` la primera vez; el núcleo con su caso; `ope-check` entero | spec «Cómo se verifica» |
| **Alcance** | Tres piezas chicas del núcleo, el cliente, cuatro pantallas con su `concurrency`, dos lecturas de la 042 | spec «Escenarios» |

Sin `NEEDS CLARIFICATION`: lo que el testigo protege y que sea obligatorio lo decidió el dueño el 2026-10-10
(backend 043); la recuperación es `CU-29`, decidida.

## Control de constitución

Contra la constitución de OPE-Web, **versión 2.0.0** (enmendada 2026-10-08). Los seis principios, también los que
no cambian nada acá:

| principio | cómo lo cumple |
|---|---|
| **I** · La spec y el plan se acuerdan; la feature se implementa con autonomía | La spec se acordó con «sí». Este plan se presenta antes de las tareas; los tramos se implementan y commitean sin esperar OK por archivo |
| **II** · Lo que no está decidido se pregunta | Nada abierto: el testigo y su obligatoriedad están decididos en el backend, y la recuperación es `CU-29`. Lo que es composición —cómo se arman las claves de la comparación— se decide acá y se dice por qué |
| **III** · `packages/` no sabe de negocio | Al núcleo entran tres piezas: leer el `ETag` de una respuesta, declarar `versioned` en el requisito, y un tipo más entre los que dejan rastro. Ninguna nombra merchant ni configuración. Qué es una hoja y cómo se hereda queda en la funcionalidad |
| **IV** · Lo visual es de granito | El choque lo muestra `ConflictDialog`, que compone granito. Ningún estilo nuevo |
| **V** · Paquete o aplicación, y la prueba es una sola | ¿Si arreglo cómo se lee el testigo de una respuesta, tiene que llegarle al portal? Sí → núcleo. ¿Si arreglo cómo se comparan dos versiones de la configuración? Sólo a la consola → funcionalidad |
| **VI** · Se comparte la puerta, no el proveedor | La puerta de acciones no cambia de forma: la pantalla le da lo que `CU-29` ya pide. Se declara para que conste que se miró |

### Qué garantía sostiene cada cosa

| | qué sostiene |
|---|---|
| **se genera** | `If-Match` en los tipos de las cuatro escrituras (sin él, el cliente no compila); `versioned` en `OPERATIONS`; `windowsRestarted` y la operación nueva de la 042 |
| **no compila** | Una escritura protegida sin testigo; una lectura que no lo devuelve donde la pantalla lo necesita |
| **se hereda** | La forma de la `concurrency` de una publicación versionada: textos y experimentos la copian de la configuración |
| **lo agarra una prueba** | Por pantalla: el `412` sin cruce guarda solo con el testigo nuevo; con cruce se ve el choque y lo tecleado sigue; en el merchant, el reintento lleva lo no editado de la versión nueva; un valor declarado después de abrir sobrevive la fusión |
| **lo mira una persona** | Contra el backend real, dos pestañas sobre el mismo recurso (`quickstart.md`) |

**Tres comprobaciones nuevas se rompen a propósito antes de creerles**: la comparación por texto en vez de por
hoja (un choque falso por unidad), lo no editado tomado de la versión de al abrir, y el testigo olvidado en una
escritura.

## Estructura

```text
specs/009-el-testigo-en-la-consola/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
└── tasks.md                                   (/speckit-tasks)

packages/core/src/data/
├── envelope.ts                                unwrapWitnessed
├── contract.ts                                versioned en OperationRequirement
└── use-action.ts                              witness-required entre los propios
apps/console/src/api/ope/client.ts             Witnessed<T>; cuatro lecturas y cuatro escrituras; la versión del merchant
apps/console/src/features/configuration/
├── data/comparable.ts                         NUEVO · hojas comparables, ida y vuelta
├── data/{merchant-configuration,levels}.ts    el testigo en los datos y en las acciones; la versión por número
└── screens/                                   las tres publicaciones con su concurrency y su ConflictDialog;
                                               historial y versión del merchant con las mediciones reiniciadas
apps/console/src/features/merchants/
├── data/{merchants,update-merchant-profile}.ts
└── screens/edit-identity-screen.tsx           su concurrency y su ConflictDialog
```

## El orden

1. **El contrato y el núcleo**: `contract:sync` a `1.15.0` (cuando la #52 esté en `main`), las tres piezas del
   núcleo con sus pruebas. El cliente: lecturas con testigo, escrituras que lo mandan, la versión del merchant.
2. **La 042 en las pantallas**: las mediciones reiniciadas en el historial y en la versión del merchant; la
   versión por número.
3. **La recuperación en las cuatro pantallas**: las hojas comparables, la `concurrency` de cada una, el
   `ConflictDialog`, las pruebas de los escenarios 2 a 7.
4. **El cierre**: contra el backend real, el estado y el quickstart.

## Complejidad y riesgos aceptados

- **El despliegue en memoria del backend no serializa** (ADR-046): una prueba a mano con dos pestañas va contra
  `npm run dev`, que es el durable.
- **Una sola relectura** (`CU-29`): si alguien escribe otra vez mientras la puerta reintenta, el operador ve el
  aviso y vuelve a guardar. Es lo decidido, no un hueco.
