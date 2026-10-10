# Lista de control de la especificación · La configuración versionada

**Propósito**: validar que la especificación está completa antes de planificar
**Fecha**: 2026-10-09
**Feature**: [spec.md](../spec.md)

## Contenido

- [x] Sin detalles de implementación — nombra operaciones, esquemas y pantallas porque son el objeto de la feature; no dice cómo se construyen
- [x] Centrada en el valor para quien la consume — ver con qué se sirve a un merchant y de dónde sale cada valor, y publicar sin romper lo que no se toca
- [x] Escrita para quien no programa — en la medida en que una feature de panel lo admite
- [x] Todas las secciones obligatorias completas

## Completitud

- [x] Sin `NEEDS CLARIFICATION` — el alcance (tres niveles, lo operativo editable, lo complejo intacto) lo decidió el dueño el 2026-10-09; el resto está en «Supuestos»
- [x] Escenarios con los cuatro estados donde hay datos, y el vacío del merchant sin versión propia con su texto
- [x] «Lo que puede salir mal» explícito, con la pérdida de lo no editado como la falla más cara y el identificador de pedido en todo aviso
- [x] «Cómo se verifica» con las cinco garantías y cada comprobación que se rompe a propósito
- [x] «Qué NO hace» dice qué es negocio (los tres niveles), qué es visual (granito) y qué es del backend (las invariantes cruzadas, qué experimento alcanza un cambio)
- [x] Decisiones citadas por identificador

## Preparación

- [x] Cada escenario tiene una comprobación que lo sostiene
- [x] Sin decisiones abiertas que bloqueen
- [x] Dependencias con el backend resueltas: las once operaciones están en el contrato sincronizado

## Notas

- La spec se acuerda con el dueño antes del plan (principio I). Los supuestos que más se pueden discutir son la vista como pantalla aparte de la ficha, las tasas como porcentaje y que plataforma y defaults se vean con alcance acotado.
- El testigo de concurrencia queda abierto como pedido al backend: sin él, publicar arrastra lo no editado de la versión que rigió al abrir.
