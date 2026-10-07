# Lista de calidad · El testigo y el conflicto

**Para qué**: verificar que la especificación esté completa antes de planificar
**Fecha**: 2026-08-29 · **Especificación**: [spec.md](../spec.md)

> La plantilla de cuarzo reemplaza a la de Spec Kit, así que esta lista se adapta:
> donde la original pide «User Scenarios» corresponde «Escenarios», y donde pide
> «Assumptions», «Supuestos». Se agregan los ítems que la constitución exige y
> que la lista original no tiene.

## Contenido

- [x] Dice el problema sin nombrar la solución
- [x] Está escrita para quien la consume, no para quien la implementa
- [x] Todas las secciones obligatorias completas
- [x] Las que no aplican se borraron, no quedaron en «N/A»
- [x] La prosa en castellano, los nombres de código en inglés

## Completitud

- [x] Sin marcas de aclaración pendiente adentro del texto
- [x] Cada requisito es verificable
- [x] «Qué NO hace» dice qué es del negocio y qué es de granito
- [x] Las decisiones de las que depende están citadas por identificador
- [x] **Ninguna decisión abierta la bloquea** — si la hubiera, acá se frena (principio II)
- [x] Los escenarios cubren el camino feliz y el que importa (sin cruce, y con cruce)
- [x] «Lo que puede salir mal» existe y es específica
- [x] Todo error mostrado lleva el identificador del pedido (`CU-4`)
- [x] Lo que queda abierto figura como abierto, no rellenado

## Que termine en algo

- [x] **No se apoya sólo en «lo mira una persona»** — hay «no compila» y «lo agarra una prueba»
- [x] Dice cuál de las cinco garantías sostiene cada cosa
- [x] Declara si es biblioteca o esqueleto, con la prueba de `CU-40` aplicada
- [x] Termina en algo que se genere, que no compile, que se herede o que agarre una prueba

## Notas

**Los cuatro estados**: la pantalla de edición los declara en el escenario 1. El vacío **no se parte
en dos** acá y está bien: un `GET` individual no tiene «los filtros no dan resultados», tiene «no
existe». La regla del vacío partido es de las grillas.

**Lo abierto no bloquea, y ya son menos**. De los tres puntos originales quedan uno:

- El testigo en el contrato de `las-animas` → **resuelto sin preguntar**: está en su contrato,
  completo. Se leyó en vez de preguntarlo.
- El testigo en el contrato del ejemplo → **resuelto: sí lo gana.**
- Cómo se declara que dos campos están atados → **sigue abierto a propósito.** No hay un caso real, y
  la forma se fijaría con el primero que la use. El escenario 6 queda fuera de esta vuelta, con la
  condición de que la comparación pueda recibirlo después sin cambiar de forma.

**Aclaraciones registradas** en la sección que le toca, con la respuesta aplicada abajo — no sólo
anotada arriba.
