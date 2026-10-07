# Lista de control · El esqueleto

**Para qué**: validar que la especificación esté completa antes de planificar.
**Fecha**: 2026-08-21 · **Spec**: [`../spec.md`](../spec.md)

> **Reemplaza a la de Spec Kit**, que pide «sin detalles de implementación» y «para interesados no
> técnicos». Acá la leen programadores y agentes que van a construir. Ver Gobernanza en la
> constitución.

## Las secciones obligatorias

- [x] **Qué resuelve** dice el problema —que cuarzo no se puede levantar— y no la solución
- [x] **Quién la consume** nombra a los dos: quien clona, y el agente que construye después
- [x] **Qué NO hace** deja fuera el adaptador de OIDC, las pantallas de negocio y las skills, cada
      uno con su razón
- [x] **De qué decisiones depende** cita con identificador, y declara que ninguna abierta la bloquea
- [x] **Escenarios** — catorce, cada uno situación y qué pasa
- [x] **Lo que puede salir mal** existe y cubre el clon, que es lo que más se olvida
- [x] **Cómo se verifica** nombra garantías concretas

## Lo que este repositorio exige

- [x] **Ninguna decisión de la que depende está abierta.** Las cuatro que quedan esperan a otros y
      ninguna hace falta para levantar
- [x] **No termina en «lo mira una persona» para todo.** Tres «no compila», cuatro pruebas, un «se
      hereda»; lo humano queda para la composición visual y los textos
- [x] **La prueba de biblioteca o esqueleto está contestada**, y con su razón
- [x] **Lo que queda abierto figura como abierto** — tres, y ninguna bloquea
- [x] **Toda cita usa `CU-n`.** Lo verifica `npm test`
- [x] **Hay una prueba que verifica la promesa y no sólo las piezas**: que el clon arranque

## Lo que hay que resolver antes de implementar

- [x] **Elegir la pantalla de ejemplo.** Resuelto en clarify: **dos**, una grilla y un formulario, que
      viajan en el clon
- [ ] **Confirmar que granito alcanza** para el marco sin agregar componentes. Está declarado como
      supuesto; si falta algo es una propuesta a granito, no código de acá

## Estado

**Las secciones obligatorias están completas y no quedan marcadores de ambigüedad.**

Los dos sin marcar son de planificación, no ambigüedades de la especificación. **No bloquean
`/speckit-clarify`.**
