# Lista de control · La sesión

**Para qué**: validar que la especificación esté completa antes de planificar.
**Fecha**: 2026-08-20 · **Spec**: [`../spec.md`](../spec.md)

> **Esta lista reemplaza a la de Spec Kit**, que pide «sin detalles de implementación» y «escrita
> para interesados no técnicos». Acá no aplica: esta especificación la leen programadores y agentes
> que van a construir, y nombrar `openapi-fetch` o el `401` es precisión, no fuga. Ver Gobernanza en
> la constitución — manda el principio, se ajusta la plantilla.

## Las secciones obligatorias

- [x] **Qué resuelve** dice el problema, no la solución
- [x] **Quién la consume** dice a quién le llega y cómo
- [x] **Qué NO hace** deja dicho qué es de negocio y qué es visual
- [x] **De qué decisiones depende** cita con identificador, y declara si alguna está abierta
- [x] **Escenarios** — situación y qué pasa, sin prioridades inventadas
- [x] **Lo que puede salir mal** existe y no está vacío
- [x] **Cómo se verifica** nombra garantías concretas

## Lo que este repositorio exige

- [x] **Ninguna decisión de la que depende está abierta.** CU-18 lo estaba, y por eso CU-13 quedó
      explícitamente fuera de alcance en vez de arrastrarse
- [x] **No termina en «lo mira una persona» para todo.** Tres pruebas, un «no compila» y un «se
      hereda»; lo humano queda sólo para los textos
- [x] **La prueba de biblioteca o esqueleto está contestada**, y con su razón
- [x] **Lo que queda abierto figura como abierto**, no rellenado con lo que parezca razonable
- [x] **Toda cita a una decisión usa `CU-n`.** Lo verifica `npm test`, no la buena voluntad
- [x] **El camino de falla es explícito**, y tiene su propia prueba — es el que casi nunca se ejerce

## Lo que quedó anotado y hay que resolver antes de implementar

- [ ] **Confirmar el plazo del proveedor.** Los dos minutos tienen que quedar por debajo del que el
      realm le da a un ingreso en curso. Hoy es un supuesto
- [ ] **Confirmar que el proveedor funciona en una ventana emergente.** Está declarado como supuesto
      y le corresponde una prueba antes de construir encima
- [ ] **Cerrar qué expone el autorizador**, que depende de la forma final de la capa de CU-14

## Estado

**Las secciones obligatorias están completas y no quedan marcadores de ambigüedad.**

Los tres puntos sin marcar no bloquean `/speckit-clarify`: dos son supuestos declarados como tales
—que es lo correcto— y el tercero se cierra al planificar.
