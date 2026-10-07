# Utilidades y dobles

Lo que hace falta para probar: constructores de datos, ayudas para montar una pantalla, y dobles de
lo que no se quiere ejercitar de verdad.

**Está vacía a propósito.** Se llena cuando la primera prueba la necesita.

## La sesión falsa no vive acá

Vive en **`@cuarzo/session/fake`**, y por dos razones:

- **Es el modo de desarrollo** (`CU-17`), no sólo una herramienta de pruebas: se ejerce todos los
  días en vez de pudrirse en una carpeta.
- **Es la segunda implementación de la puerta** (`CU-10`). Una interfaz no demuestra nada si nunca
  se ejerce contra otra cosa.

## Quién puede importar de acá

**Sólo archivos de prueba.** Que código de producción importe un doble es la clase de accidente que
termina en un artefacto con datos de mentira adentro, y **`cuarzo-check` lo agarra**.

## Cómo se prueba

| | con qué | dónde |
|---|---|---|
| Lógica y componentes de la aplicación | **Vitest** | **Al lado de lo que prueban**: `articles.ts` y `articles.test.ts` en la misma carpeta (`CU-15`) |
| Que un tipo **no compile** | Un `*.test-d.ts` con `@ts-expect-error` | Igual: al lado. Lo verifica `tsc`, sin corredor |
| Las reglas del repositorio | `cuarzo-check` | — |

**Al lado y no en una carpeta aparte** porque una funcionalidad tiene que poder borrarse entera, y
con las pruebas en otro lado se borra la mitad. Lo verifica `cuarzo-check`: un `X.test.ts` sin su
`X.ts` al lado falla.

> **Los paquetes hacen lo contrario**, en `packages/<x>/tests/`. No es incoherencia: lo que está en
> su `src/` **se publica**, y una prueba al lado viajaría adentro del paquete. La razón está en
> `CU-15`.

La segunda es la más fuerte de las tres: **falla si el error que espera deja de ocurrir**, así que
agarra tanto que se rompa el tipado como que alguien lo afloje.
