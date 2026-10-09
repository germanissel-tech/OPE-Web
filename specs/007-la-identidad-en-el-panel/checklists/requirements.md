# Lista de control de la especificación · La identidad en el panel

**Propósito**: validar que la especificación está completa antes de planificar
**Fecha**: 2026-10-09
**Feature**: [spec.md](../spec.md)

## Contenido

- [x] Sin detalles de implementación — nombra operaciones, esquemas y pantallas porque son el objeto de la feature; no dice cómo se construyen
- [x] Centrada en el valor para quien la consume — reconocer merchants y operador; sacar código vencido
- [x] Escrita para quien no programa — en la medida en que una feature de panel lo admite
- [x] Todas las secciones obligatorias completas

## Completitud

- [x] Sin `NEEDS CLARIFICATION` — lo que había que decidir (sacar las muletas acá, edición como pantalla y reemplazo entero, contacto en campos planos) está en «Supuestos»
- [x] Escenarios con los cuatro estados donde hay datos (la ficha y la grilla heredan los de la 006)
- [x] «Lo que puede salir mal» explícito, con el identificador de pedido en todo aviso
- [x] «Cómo se verifica» con las cinco garantías y cada comprobación que se rompe a propósito
- [x] «Qué NO hace» dice qué es negocio (todo lo de merchants), qué es visual (granito) y qué es del backend (qué es un dato personal)
- [x] Decisiones citadas por identificador; `OW-5` y `OW-7` marcadas como enmienda

## Preparación

- [x] Cada escenario tiene una comprobación que lo sostiene
- [x] Sin decisiones abiertas que bloqueen
- [x] Dependencias con el backend resueltas (040 y 041 unidas en `main`)

## Notas

- La spec se acuerda con el dueño antes del plan (principio I); los dos supuestos que podrían discutirse son la edición como reemplazo entero y sacar las tres muletas en esta misma feature.
