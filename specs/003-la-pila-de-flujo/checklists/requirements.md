# Control de calidad de la especificación · La pila de flujo

**Para qué**: verificar que la especificación esté completa antes de planificar
**Fecha**: 2026-08-23 · **Especificación**: [`spec.md`](../spec.md)

## Contenido

- [x] Sin detalle de implementación que no haga falta para entender el problema
- [x] Centrada en el problema y en quién lo sufre
- [x] Legible por alguien que no escribió el código
- [x] Todas las secciones obligatorias completas

## Requisitos

- [x] No quedan marcas de «hace falta aclarar»
- [x] Los requisitos son verificables y no ambiguos
- [x] Cómo se verifica está dicho, y **no todo cae en «lo mira una persona»**
- [x] Los escenarios están definidos
- [x] Lo que puede salir mal está identificado, incluidos los caminos de falla
- [x] El alcance está acotado: hay una sección de qué NO hace
- [x] Las dependencias y los supuestos están anotados

## Listo para planificar

- [x] Cada requisito tiene con qué comprobarse
- [x] Los escenarios cubren los caminos principales
- [x] **Ninguna decisión abierta la bloquea** (principio II)
- [x] Lo que queda abierto **figura como abierto**, no rellenado

## Notas

**La enmienda de `CU-44` está escrita** en `docs/arquitectura.md` y anotada en el índice —se hizo el
2026-08-23, antes de aclarar—, así que ya no frena la planificación. La decisión avisa además que el
código todavía no la cumple, y que lo resuelve esta especificación.

**Seis preguntas respondidas** en la sesión de aclaración del 2026-08-23, todas aplicadas al texto.
Una no estaba en «Lo que queda abierto» y era la de mayor impacto: **si el destino de un paso puede
ser otro flujo**. Sin eso, abandonar un flujo no era computable y el aviso que `GR-73` exige no
tenía de dónde colgar.

**No queda ninguna abierta.** La última —si `about` iba en un diálogo— resultó estar mal planteada:
la pregunta real era si **el menú de usuario abandona el flujo**, que alcanza a las cuatro
aplicaciones y no al hola mundo. No abandona: apila sobre el activo, y cerrar vuelve.
