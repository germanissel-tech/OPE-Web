# Lo que esta aplicación declara

**Nueve archivos, y ninguno es cableado.** El arranque, la raíz de composición, el shell, la
configuración y las siete vistas de sesión los pone `@ope/core` y llegan por workspace
(`CU-42`).

| | qué decide | cuándo se toca |
|---|---|---|
| [`manifest.ts`](manifest.ts) | **Por dónde se empieza.** Junta las partes de abajo y no decide nada por su cuenta | casi nunca |
| [`features.ts`](features.ts) | Qué funcionalidades tiene, un renglón cada una | al agregar una |
| [`flows.ts`](flows.ts) | **Cómo se atraviesa, y qué ofrece el menú** (`CU-47`, `CU-48`) | al agregar un flujo, un paso o un grupo |
| [`identity.ts`](identity.ts) | Claims → capacidades, y el rótulo de la barra | al cambiar los roles o el proveedor |
| [`chrome.ts`](chrome.ts) | Las preferencias del operador, y los estados de sesión | casi nunca |
| [`config.ts`](config.ts) | Qué configuración lee al arrancar, y su esquema | al agregar un dato de despliegue |
| [`strings.ts`](strings.ts) | Los textos del marco que esta aplicación reemplaza | casi nunca |
| [`main.tsx`](main.tsx) | Qué usa, y **contra qué autentica** | casi nunca |
| [`dev-session.ts`](dev-session.ts) | La sesión de desarrollo, sus datos de mentira, con qué capacidades se entra, y la credencial que la vista de ingreso muestra con `?dev.bearer=1` | al probar un rol, al mirar la aplicación con menos permisos, o al entrar contra el backend real |

**Está partido porque cada parte cambia por su cuenta.** Las pantallas se agregan de a una durante
meses; la traducción de capacidades se toca cuando cambian los roles. Juntas, un archivo que se
edita todas las semanas esconde tres cosas que casi nunca deberían moverse.

> **Esta tabla vive acá y en ningún otro lado.** Estuvo también en `manifest.ts` y adentro de
> `CU-42`, y las tres divergieron: una listaba `routing.ts` meses después de que se borrara. Un
> inventario en una decisión envejece, porque la decisión no se toca cuando se agrega un archivo.

## El manifiesto

**Junta, y nada más.** Está tipado: lo que falta no compila.

```ts
export function createManifest(config: BaseConfig): ApplicationManifest {
  const { screens, featureRootOf, userMenuEntries, outcomes } = composeFeatures(features)

  return defineApplication({
    name: 'OPE-Console',                     // la marca de la barra
    screens,                                 // de lo que declara cada funcionalidad
    systems: Object.keys(config.systems),    // contra qué backends habla — CU-22
    ...identity(config),                     // claims → capacidades, y el rótulo — CU-10, CU-27
    outcomes, featureRootOf, flows, menu,           // cómo se atraviesa, y el menú — CU-47, CU-48
    userMenu: { entries: userMenuEntries, preferences },
  })
}
```

**Esto no crece con el sistema.** Una funcionalidad nueva es un renglón de `features.ts`, y sus
pantallas, rutas, menú y entradas propias salen de lo que ella declara (`CU-23`).

## Las funcionalidades

```ts
export const features: readonly Feature[] = [home, merchants]
```

**Escritas a mano y no descubiertas.** Un `import.meta.glob` ahorraría el renglón y a cambio nadie
podría leer qué entra en el artefacto: lo que no se nombra no se puede sacar, y una funcionalidad a
medio terminar se publicaría sola.

## El mapa de cómo se atraviesa

`flows.ts` es el único archivo que conoce dos pantallas a la vez, y por eso el único que puede
decidir qué sigue después de un desenlace. **Ninguna pantalla nombra a otra** (`CU-47`), y lo
verifica la comprobación de límites.

```ts
export const catalogFlow = defineFlow({
  id: 'catalog',
  root: articlesScreen,
  steps: [
    opens(catalog.outcomes.articleChosen, articleScreen, ({ id }) => ({ id })),
    closes(catalog.outcomes.articleClosed),
  ],
})
```

Y abajo, **qué ofrece el menú y en qué orden** (`CU-48`). Está en el menú el que está en la lista:

```ts
export const menu = [homeFlow, group(catalogStrings.catalogSection, [catalogFlow], TAG)]
```

**La aplicación no arranca** si una pantalla no está en ningún flujo, si un desenlace quedó sin
paso, si un paso apunta a uno que ya nadie declara, o si un flujo está dos veces en el menú.

### Cuándo partirlo en una carpeta

**Cuando pase de unas 150 líneas —dos pantallas de editor— o cuando dos personas lo toquen a la vez.**
Lo que llegue primero.

```
src/app/
├── flows.ts          ← la lista y el menú
└── flows/
    ├── catalog.ts
    └── reception.ts
```

**Sin `index.ts`**: `CU-15` prohíbe el barril, así que `flows.ts` importa de la carpeta y arma las
dos listas.

**Es el único archivo de esta carpeta que crece con el sistema** — los otros ocho tienen tamaño
fijo—, y por eso el umbral está escrito. Sin número, «cuando duela» es «nunca» o «ya mismo» según el
día.

## Si esta aplicación necesita más configuración

El esquema es el piso, y se extiende. **El tipo sale de ahí**, así que no se puede declarar un dato
obligatorio y olvidarse de validarlo:

```ts
const schema = { ...baseSchema, notificationsUrl: url }
type Config = ValueOf<typeof schema>

await bootstrapApplication<Config>({ readConfig: () => readConfigWith(schema), … })
```

Y la aplicación **no arranca si falta**, diciendo cuáles faltan todos de una vez (`CU-17`).

## Lo que el marco le dice al operador

Los textos de las piezas que publica cuarzo —los siete estados de sesión, el arranque, la barra de
usuario— salen de un catálogo tipado, y esta aplicación reemplaza los que quiera desde el
manifiesto:

```ts
strings: { reenterTitle: 'La sesión venció' }
```

**Los de las pantallas no van ahí**: una pantalla escribe los suyos, donde ya declara su título y su
ruta. Por qué un catálogo y no `i18n` está en `CU-43`.

## Las preferencias del operador

Van en [`chrome.ts`](chrome.ts), declaradas. **El marco no conoce ninguna**: trae el tema y los
globos de ayuda armados, y una preferencia propia —densidad, idioma— es un archivo más. Qué
significa estar o no estar en esa lista está en `CU-27`.

## El punto de entrada

Sólo dice qué usa. Lo único con lógica es **elegir el proveedor de sesión**, y eso sí es de la
aplicación: es donde decide contra qué autentica.

**La sesión de desarrollo se carga de forma diferida**, y por eso vive en su propio archivo: así no
entra en el artefacto de producción (`CU-36`), y lo verifica `ope-check` sobre la compilación.

## Por qué `dev-session.ts` está aparte

Porque **no es configuración de la aplicación** aunque se le parezca. `Ana Operadora` y sus roles
son una fixture, y leerlos en el arranque los hace pasar por otra cosa.

## Cómo mirar la aplicación con menos permisos

```
?dev.papel=lectura     lo que hay sin merchants:write
?dev.papel=ninguno     lo que ve una sesión válida que no habilita nada
?dev.papel=todo        vuelve a lo de siempre
```

**Se elige una vez y se recuerda**, así que se sigue navegando sin arrastrar el parámetro. Cuál está
puesto lo dice la consola al arrancar.

Existe porque `CU-3` —*«lo que un permiso no habilita, no se muestra»*— se rompe sin que nadie lo
note, y la decisión lo dice de sí misma: **el defecto no se ve con permisos completos, que es como se
mira una pantalla mientras se la escribe.** Con una sesión falsa que concede todo, había que editar
un archivo para ver el otro caso — así que no lo veía nadie.

**Volver a entrar no es una limitación, es lo fiel.** Las capacidades llegan en el token, así que
conceder o revocar una tiene efecto con la sesión siguiente (`TAN-7`). Un cambiador que las alterara
en vivo mostraría algo que en producción no puede pasar.

## Si no estás seguro de dónde va algo

**¿Va a ser igual en las dos aplicaciones de OPE-Web?**

- **Sí** → no va acá, va a `@ope/core`. Ésa es la prueba de `CU-40`.
- **No** → si es una pantalla, va a [`../features/`](../features/README.md). Si es cableado que sólo
  esta aplicación necesita, va acá — y conviene preguntarse por qué sólo ésta lo necesita.

**Lo que no puede pasar acá**: un `if` de negocio. Esto compone, no implementa (`CU-36`).
