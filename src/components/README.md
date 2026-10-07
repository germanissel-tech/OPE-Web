# Lo compartido de esta aplicación

Lo que usan **varias funcionalidades de esta aplicación** y no encaja en ninguna.

**Está vacía a propósito.** Un componente compartido antes de tener dos consumidores es una
abstracción adivinada: nace con la forma del primero que la usó. Se sube acá cuando la segunda
funcionalidad lo necesita, no antes.

## Qué NO va acá

**Nada visual nuevo.** Lo que se ve es de granito (principio IV): acá va **composición** de sus
componentes, no dibujo. Si falta algo, **es una propuesta a granito** — y el pedido lo registra
Tandilia en `pedidos/granito/`, no se escribe adentro del repositorio de ellos (`TAN-5`).

**Nada que sea igual en las cuatro aplicaciones.** Eso va a `@cuarzo/core`, y ésa es la prueba de
`CU-40`. El shell, la barra de usuario y las vistas de sesión están allá por esa razón.

**Ningún término de negocio en el nombre.** Un componente que se llama `SaldoDeCuenta` no es
compartido: es de una funcionalidad.

## Qué puede importar

```
lib · components  →  features  →  app
```

Un componente de acá puede usar `lib/` y otros de acá. **No puede importar de `features/` ni de
`app/`**, y lo verifica `cuarzo-check`.

## Los nombres

Sin sufijo, salvo que el tipo tenga un papel en la arquitectura —`…Provider`, `…Dialog`—. El archivo
dice lo que exporta: `importe-editable.tsx` para `ImporteEditable`.

**Nada de archivos barril**, que rompen el sacudido de árbol (`CU-15`).
