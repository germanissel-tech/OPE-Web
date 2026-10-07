# Especificación · [NOMBRE]

**Carpeta**: `[###-nombre-corto]` · **Estado**: borrador · **Fecha**: [FECHA]

**Pedido**: "$ARGUMENTS"

<!--
  ────────────────────────────────────────────────────────────────────────────
  PLANTILLA PROPIA DE CUARZO. Reemplaza a la de Spec Kit a propósito.

  La original está armada sobre historias de usuario con prioridades P1/P2/P3,
  MVP y Given/When/Then. Cuarzo no tiene usuarios finales ni MVP: lo que produce
  lo consumen aplicaciones y programadores. Escribir «como usuario quiero…»
  sobre «cómo se piden los datos» da ceremonia, no claridad.

  Donde una skill de Spec Kit pida «User Scenarios & Testing», corresponde
  «Escenarios». Donde pida «Assumptions», corresponde «Supuestos». Manda esta
  plantilla: ver Gobernanza en .specify/memory/constitution.md.

  La prosa va en castellano. Los nombres de código, en inglés.
  Toda sección marcada (obligatoria) se completa; las demás, si aplican, y si
  no aplican SE BORRAN — no se dejan en «N/A».
  ────────────────────────────────────────────────────────────────────────────
-->

## Qué resuelve *(obligatoria)*

<!-- Una o dos frases. EL PROBLEMA, no la solución. Si no se puede decir el
     problema sin nombrar la solución, todavía no está entendido. -->

## Quién la consume *(obligatoria)*

<!-- ¿Una aplicación? ¿El esqueleto, al clonarse? ¿Un programador que lee?
     Cuarzo no tiene usuarios finales: decir a quién le llega esto y cómo se
     entera de que existe. -->

## Qué NO hace *(obligatoria)*

<!-- Va TERCERO y no al final, a propósito: cada capa de este proyecto se define
     por lo que NO sabe, y eso es lo que la mantiene reutilizable.

     Como mínimo, dejar dicho qué de esto es del negocio de una aplicación y no
     de acá, y qué es visual y por lo tanto de granito. -->

## De qué decisiones depende *(obligatoria)*

<!-- Cada una con su número y qué aporta. Las decisiones viven en docs/arquitectura.md y en
     docs/seguridad.md, con numeración corrida entre los dos. -->

| decisión | qué aporta |
|---|---|
| | |

**Abiertas que la bloquean**: <!-- Si hay alguna, ACÁ SE FRENA. No se planifica
sobre una decisión abierta y no se rellena por cuenta propia: se pregunta.
Ver principio II. -->

## Escenarios *(obligatoria)*

<!-- Reemplaza a «User Scenarios & Testing». Cada escenario es: la situación, y
     qué tiene que pasar. Sin Given/When/Then y sin prioridades inventadas.

     Si esto trae datos a una pantalla, los cuatro estados no son opcionales:
     cargando · con datos · vacío · error. Y el vacío se parte en dos cuando
     corresponde — «no hay nada todavía» no es «los filtros no dan resultados»,
     porque la salida de uno es crear y la del otro limpiar los filtros. -->

1. **[situación]** → [qué pasa]

## Lo que puede salir mal *(obligatoria)*

<!-- El camino de falla, explícito. Es la sección que más se saltea y la que más
     cuesta agregar después: cuando el error llega tarde, la forma de la pantalla
     ya está hecha para el caso feliz.

     Todo error que se le muestre a alguien lleva el identificador del pedido: es
     lo único que convierte «no anda» en algo diagnosticable. -->

## Cómo se verifica *(obligatoria)*

<!-- Cuál de las cinco garantías la sostiene, y cuál es la comprobación concreta.

     | se genera | no compila | se hereda | lo agarra una prueba | lo mira una persona |

     UNA ESPECIFICACIÓN QUE TERMINA EN «lo mira una persona» PARA TODO ESTÁ
     INCOMPLETA. Es la más débil de las cinco y existe para lo que ninguna
     máquina ve: que una pantalla componga bien, que el texto diga lo que tiene
     que decir, que un nombre sea el correcto.

     Ver «Cómo se hace cumplir» en la constitución. -->

## Biblioteca o esqueleto

<!-- La prueba es una sola: si arreglo esto, ¿tiene que llegarles a TODAS las
     aplicaciones? Sí → biblioteca. No → esqueleto, que se copia y diverge.
     Borrar esta sección si lo que se especifica no es ni una cosa ni la otra. -->

## Supuestos

<!-- Reemplaza a «Assumptions». Lo que se dio por sentado para poder escribir
     esto. Cada supuesto es una pregunta que no se hizo: si alguno es grande,
     mejor preguntarlo que suponerlo. -->

## Lo que queda abierto

<!-- Marcado como abierto, NO rellenado. Es la mitad del valor de este documento:
     lo que está abierto figura como abierto. -->
