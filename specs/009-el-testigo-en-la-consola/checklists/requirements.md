# Lista de control de la especificación · El testigo en la consola

**Propósito**: validar que la especificación está completa antes de planificar
**Fecha**: 2026-10-10
**Feature**: [spec.md](../spec.md)

## Contenido

- [x] Sin detalles de implementación — nombra el testigo, las pantallas y los estados del backend porque son el objeto de la feature; no dice cómo se construyen
- [x] Centrada en el valor para quien la consume — volver a publicar y editar, sin pisar a nadie y sin molestar cuando no hay choque
- [x] Escrita para quien no programa — en la medida en que una feature de panel lo admite
- [x] Todas las secciones obligatorias completas

## Completitud

- [x] Sin `NEEDS CLARIFICATION` — qué protege el testigo y que sea obligatorio lo decidió el dueño el 2026-10-10 (backend 043); la recuperación es `CU-29`, decidida
- [x] Escenarios con el caso sin choque, con choque, lo no editado, el reintento repetido, el historial, la versión por número y la sólo lectura
- [x] «Lo que puede salir mal» explícito: la relectura que falla, el choque que se repite, el `428` como defecto propio, el `409` junto al choque
- [x] «Cómo se verifica» con las pantallas contra un doble, el testigo en el cliente, la sincronización y el backend real
- [x] «Qué NO hace» dice qué es negocio (resolver el choque), qué es visual (el diálogo) y qué no se protege
- [x] Decisiones citadas por identificador

## Preparación

- [x] Cada escenario tiene una comprobación que lo sostiene
- [x] Sin decisiones abiertas que bloqueen
- [x] La dependencia con el backend está dicha: la implementación espera el contrato `1.15.0` en `main` (PR #52)

## Notas

- La spec y el plan no necesitan la 043 mergeada; `contract:sync` sí.
