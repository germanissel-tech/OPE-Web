# Contrato · Lo que `@cuarzo/core` publica para los flujos

**Carpeta**: `003-la-pila-de-flujo` · **Fecha**: 2026-08-23

La superficie que una aplicación escribe. **Los nombres van en inglés** y la prosa en castellano,
como pide la constitución.

---

## Declarar un flujo

```ts
export const catalogFlow = defineFlow({
  id: 'catalog',
  root: articlesScreen,
  section: catalogStrings.catalogSection,
  steps: [
    opens(catalog.outcomes.articleChosen, articleScreen, ({ id }) => ({ id })),
    closes(catalog.outcomes.articleClosed),
    finishes(catalog.outcomes.articleSaved),
  ],
})
```

**Lo que el compilador tiene que rechazar**, que es la mitad del valor:

```ts
opens(catalog.outcomes.articleChosen, articleScreen)              // falta armar { id }
opens(catalog.outcomes.articleChosen, articleScreen, () => ({ di: '1' }))  // ése no es su parámetro
opens(unOutcomeQueNadieDeclara, articleScreen, …)                 // no existe
finishes(catalog.outcomes.articleSaved, unaPantallaQueNoEsPantalla)
```

**Un paso puede llevar a otro flujo**, y entonces abandona el actual:

```ts
opens(statement.outcomes.accountRequested, accountFlow)
```

## Lo que una pantalla usa

```ts
const { close, canReach } = useFlow()
```

| | qué hace |
|---|---|
| `close()` | Desapila uno. Con la pila vacía, cae a la raíz de la funcionalidad |
| `canReach(outcome)` | **En este flujo**, ¿la sesión llega al destino de ese desenlace? |

`canReach` existe porque el destino se mudó al flujo: una grilla decide si dibuja el chevron
**mientras renderiza**, y la respuesta depende de en qué flujo está. Misma grilla, dos flujos, dos
destinos, dos capacidades (`CU-3`).

**Apilar y terminar no están acá**: los dispara un desenlace, no la pantalla. Si estuvieran, la
pantalla volvería a poder navegar por su cuenta — que es lo que `CU-44` acaba de prohibir.

## Trabajo sin guardar

```ts
useUnsavedWork(form.isDirty)
```

Un booleano, y nada más. **La pantalla no sabe qué es abandonar, ni quién pregunta, ni con qué
diálogo** — sólo si tiene algo escrito. Olvidarse es una línea que falta, no una lógica mal hecha.

Cubre los cuatro caminos: cerrar, los dos abandonos, y el botón «atrás». **No cubre** cerrar la
pestaña ni recargar: ahí el navegador pone su propio diálogo.

## Lo que declara una funcionalidad

```ts
export const catalog = defineFeature({
  root: articlesScreen,
  screens: [articlesScreen, articleScreen],
  outcomes: { … },
})
```

`root` es a dónde cae un cerrar sin pila para **sus** pantallas, y de dónde sale el flujo cuando se
llega por un enlace pegado.

## El manifiesto

```ts
defineApplication({
  …,
  flows,          // reemplaza a `routing`
})
```

---

## Lo que se saca

| | por qué |
|---|---|
| `goTo` de una pantalla | `CU-44` enmendada: una pantalla no nombra a otra |
| `routing` del manifiesto | Aristas sueltas sin flujo que las agrupe |
| `route(outcome, handler)` | Un handler es una caja negra: no se le puede preguntar a dónde lleva |
| `inMenu` de la pantalla | Al menú entra un flujo |

**`goTo` no desaparece del todo**: lo sigue usando el marco —el menú lateral, el de usuario—, que
legítimamente conoce el registro entero (`CU-23`) y está afuera de la regla por sus `href` de
verdad. Lo que desaparece es que una pantalla lo alcance.
