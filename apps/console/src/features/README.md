# Una carpeta por funcionalidad

> **`home/` y `merchants/` son el hola mundo de OPE-Console.** Existen para que la base arranque
> mostrando algo que anda, y para que la primera pantalla propia se copie de un ejemplo en vez de
> escribirse de cero.
>
> **Se borran las dos** cuando la aplicación tiene pantallas propias. Es el paso 6 del ritual de
> clonar, no un olvido.

**Por lo que hace la aplicación, no por tipo de archivo** (`CU-15`). Con veinte pantallas —las que
ya tiene especificado el panel de `las-animas`— agrupar por tipo deja cada funcionalidad
desparramada en cuatro carpetas de veinte archivos.

## La forma

```
<funcionalidad>/
├── feature.ts              todo lo que aporta: pantallas y menú de usuario
├── screens/
│   └── <algo>-screen.tsx   una pantalla, con su declaración
├── components/             lo visual que comparten sus pantallas
└── data/                   ← lo ÚNICO que puede importar de api/
```

`components/` y `data/` se crean **cuando hacen falta**, no de entrada.

## Cómo se agrega una pantalla

**Un solo lugar.** De la declaración salen el menú, la ruta y el filtrado por capacidad de los dos
lados (`CU-23`), así que no hay nada más que tocar.

```tsx
// screens/article-screen.tsx
import { defineScreen, useScreenParams } from '@cuarzo/core'
import { Block, Page, Region } from '@granito/ui'

function ArticleScreen() {
  const { id } = useScreenParams(articleScreen)   // tipado: sale de la ruta
  return (
    <Page title="Ficha del artículo" context={id}>
      <Region><Block>…</Block></Region>
    </Page>
  )
}

export const articleScreen = defineScreen({
  id: 'catalogArticle',
  title: 'Ficha del artículo',
  path: '/catalog/:id',            // tiene que empezar con barra, y el tipo lo exige
  capability: 'catalog:read',      // sin ella no aparece en el menú NI deja entrar por URL
  component: ArticleScreen,
})
```

Y se suma al `feature.ts` de su funcionalidad, que es lo que la raíz junta:

```ts
export const catalog = defineFeature({
  screens: [articlesScreen, articleScreen],
})
```

**La raíz crece una línea por funcionalidad, no una por pantalla** — y `src/app/features.ts` es el
único archivo que se toca al agregar una.

## Cómo se llega a otra pantalla

**No se la nombra**, ni de otra funcionalidad ni de la propia. Se informa qué pasó, y a dónde lleva
lo dice el paso del flujo activo, en `app/flows.ts` (`CU-44` enmendada, `CU-47`):

```ts
// feature.ts — qué le puede pasar
outcomes: { catalogRequested: outcome<{ from: string }>('home.catalogRequested') }

// la pantalla — informa, y no sabe a dónde va
<Button onClick={() => emit(home.outcomes.catalogRequested({ from: 'home' }))}>Ir al catálogo</Button>
```

**El nombre dice qué pasó, no a dónde ir.** `issued`, no `goToInvoice`: si se nombra por el destino,
esto es `goTo` con una escala y la funcionalidad volvió a conocer a la que sigue.

La regla completa: **toda navegación entre pantallas es un desenlace**, sin excepciones. Y no hay
forma de escribir la otra: la comprobación de límites rechaza que una pantalla importe a otra —sólo
pueden nombrarlas `feature.ts` y `app/flows.ts`—.

**Una pantalla que nombra su destino sirve en un solo recorrido**, y eso no se nota hasta que hace
falta el segundo. Por eso la regla vieja —«moverte adentro es `goTo`»— se enmendó.

Lo que un desenlace puede llevar es **plano y de primitivos**. Por qué, en `CU-44`.

## Lo que una funcionalidad aporta además de pantallas

Una entrada del menú de usuario **vive con la pantalla que abre**, no en el manifiesto:

```ts
export const home = defineFeature({
  screens: [welcomeScreen, aboutScreen],
  userMenuEntries: [{ id: 'about', label: aboutScreen.title, screen: aboutScreen }],
})
```

Separarlas es cómo una queda sin la otra: la pantalla existe y nadie llega, o la entrada apunta a
una ruta que se borró. Con `screen` lo segundo **no compila** (`CU-41`).

**Dos entradas con el mismo `id` fallan al construir**, por la misma razón que dos pantallas con la
misma ruta: el ganador dependería del orden en que se juntaron las funcionalidades.

## Los nombres

| | |
|---|---|
| El componente | **`…Screen`** — `ArticleScreen`. Lo verifica `cuarzo-check` |
| La declaración | El mismo nombre, otra caja: `articleScreen` |
| El archivo | Lo que exporta: `article-screen.tsx` |
| La carpeta y el `id` | **Los de la aplicación, no los del contrato.** Una funcionalidad puede componer dos sistemas |

## Qué puede importar

```
lib · components  →  features  →  app
```

Y dos reglas más, las dos verificadas por `cuarzo-check`:

- **Sólo `<funcionalidad>/data/` importa de `api/`.** Una pantalla nunca ve un tipo generado ni sabe
  de qué sistema vino el dato.
- **Nada de importar entre funcionalidades.** Se componen en `app/`.

**Cómo se declara un enlace de una funcionalidad a otra todavía no está decidido.** Mientras tanto
se llega por el menú. Si aparece un caso que lo necesite de verdad, es una decisión — no se
resuelve importando.

## Si no estás seguro

**¿Esto va a ser igual en las cuatro aplicaciones de Tandilia?** Si sí, no va acá: va a
`@cuarzo/core`. Ésa es la prueba de `CU-40`, y es la misma que decidió que el shell, las vistas de
sesión y las comprobaciones se publiquen.
