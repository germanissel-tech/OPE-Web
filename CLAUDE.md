# CLAUDE.md

Cómo se trabaja en este repositorio. **Leerlo entero antes de tocar nada.**

## Qué es OPE-Web

**El frontend de OPE**: la consola de operación (`apps/console`) y, después, el portal del merchant
(`apps/portal`), sobre un núcleo compartido (`packages/`) y el sistema de diseño de Tandilia
(granito).

```
granito          ← cómo se ve y cómo se opera.  NO sabe de OPE.      (Tandilia, sólo lectura)
   ↓
packages/        ← cómo se arma una aplicación.  NO sabe de negocio.  (@ope/core, @ope/session)
   ↓
apps/console · apps/portal   ← cada una su dominio, contra el contrato de OPE-Backend.
```

**Cada capa se define por lo que NO sabe**, que es lo que la mantiene reutilizable. Nace de una copia
de cuarzo, la aplicación base de Tandilia: qué se heredó, qué se enmendó y qué se retiró está en
[`docs/origen.md`](docs/origen.md).

## Dónde está cada cosa, y cuándo se lee

| | qué es | cuándo |
|---|---|---|
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Lo que no se negocia: seis principios y la jerarquía de garantías | **siempre** |
| [`.specify/memory/estado.md`](.specify/memory/estado.md) | Dónde está cada cosa, qué sigue, y las muletas que se sacan cuando llegue la 040 | al empezar una sesión |
| [`docs/decisiones.md`](docs/decisiones.md) | **El índice**: id, estado y dónde vive cada una. Se lee entero | antes de citar una decisión |
| [`docs/ope.md`](docs/ope.md) | **Las decisiones de OPE-Web** (`OW-n`), con su origen | antes de especificar o planificar |
| [`docs/arquitectura.md`](docs/arquitectura.md) · [`docs/seguridad.md`](docs/seguridad.md) | Las heredadas de cuarzo (`CU-n`), con las enmiendas fechadas | cuando una `OW-n` las cita |
| [`docs/origen.md`](docs/origen.md) | Heredado, enmendado, retirado, y el commit de cuarzo | al preguntarse «¿esto es nuestro?» |
| [`docs/segunda-aplicacion.md`](docs/segunda-aplicacion.md) | Cómo nace `apps/portal` copiando `apps/console` | al empezar el portal |
| [`docs/deuda.md`](docs/deuda.md) | Lo que funciona y restringe. **No es donde van los defectos** | antes de elegir qué arreglar |
| [`contracts/ope/README.md`](contracts/ope/README.md) | De qué commit del backend salió el contrato sincronizado | al tocar `api/ope/` |
| `specs/NNN-*/` | Una especificación por feature, con su plan y sus tareas | la que corresponda |
| `../backend` | **OPE-Backend**, la fuente del contrato. Su `CLAUDE.md` y sus ADR se leen; acá no se edita | al necesitar algo del contrato |

**Las citas**: `CU-n` es de cuarzo, `OW-n` de OPE-Web, `GR-n` de granito, `TAN-n` de la plataforma
de Tandilia, `ADR-nnn` del backend. **Nunca un número pelado.** `npm test` falla si una `CU` u `OW`
no resuelve; las `GR` y `TAN` se verifican cuando sus documentos están al lado.

## Tandilia es sólo lectura

Granito y cuarzo viven en `../../../../Bitbucket/Tandil Stone Pulse/tandilia/`. **Se leen y no se
tocan**: ni compilar, ni instalar, ni publicar, ni checkout, ni commitear ahí. `@granito/ui` y
`@granito/tokens` llegan por `file:` a esa carpeta hasta que granito esté en npm (`CU-7`
enmendada). Lo que haga falta cambiar de granito es **una propuesta**: la decisión que la motiva va
en `docs/ope.md` (`OW-4` fue la primera) y el pedido, con su evidencia y qué se borra de acá cuando
llegue, en [`docs/propuestas-a-granito.md`](docs/propuestas-a-granito.md). La lleva el dueño desde
granito.

## El ciclo de trabajo

Spec Kit, entero, **con autonomía por feature** (constitución I):

| | | |
|---|---|---|
| 1 | `/speckit-specify` | qué resuelve, qué **no** hace, y de qué decisiones depende |
| 2 | `/speckit-clarify` | lo que la spec no alcanza a decir, preguntado con herramienta |
| 3 | `/speckit-plan` | cómo, y cuál de las cinco garantías lo sostiene; el Constitution Check cita la versión |
| 4 | `/speckit-tasks` | las tareas, en tramos que terminan en algo que se puede correr |
| 5 | `/speckit-implement` | se implementa tramo por tramo, sin esperar el OK por archivo; cada tramo cierra con su punto de control y un commit |

**La spec y el plan se acuerdan con el dueño; la implementación no se consulta archivo por archivo.**
Lo que aparece en el medio y la spec no cubre, se pregunta en el momento. Un tramo deja en `tasks.md`
una nota fechada con lo que se desvió del plan y por qué.

**Una especificación que no termina en algo que se genere, que no compile, que se herede al copiar
o que agarre una prueba, está incompleta.** Un documento no asegura nada por sí solo.

## Cómo se corren las cosas

```bash
npm test                  # construye los paquetes, ope-check (8 comprobaciones), la puerta y Vitest
npm run revisar           # Biome
npm run build             # los paquetes, tsc sobre todo, y el artefacto de cada aplicación
npm run dev               # la consola en :5173, con /api reenviado a OPE-Backend en :3000
npm run contract:sync     # copia generated/contract/ del backend (../backend, OPE_BACKEND_DIR o --from); no emite nada
npx ope-check conformity  # el módulo de capacidades es el del contrato sincronizado
```

**Contra el backend real**: en `../backend`, `npm run dev`; acá, `npm run dev` y
`http://localhost:5173/?dev.bearer=1` con el token de `config/dev-operators.json` del backend. Sin
`?dev.bearer=1`, la sesión falsa entra sola; `?dev.papel=lectura` muestra lo que hay sin
`merchants:write`, y `?dev.entrada=1` arranca en la vista de ingreso.

**El lazo de una historia**: `npm test`, `npm run revisar`, `npm run build`. Antes de cerrar una
feature, además, la tabla de «romperle algo a cada comprobación» de su quickstart.

**Commits**: convencionales, en castellano, un tramo por commit, con `Co-Authored-By` del agente. No
se commitea con las pruebas en rojo. Se publica cuando el dueño lo pidió.

## Cuando algo del código está mal, primero se tría

| | qué es | qué se hace |
|---|---|---|
| **Un defecto** | La aplicación se comporta mal | **Tarea del tramo en curso**, con la comprobación que lo habría agarrado |
| **Un incumplimiento** | El código contradice una decisión ya tomada | **Se resuelve, no se agenda.** O se arregla el código o se enmienda la decisión — y enmendar no lo decide un agente |
| **Una garantía declarada que no existe** | Una decisión dice «lo verifica X» y X no lo verifica | **Lo más urgente.** La decisión miente |
| **Deuda** | Funciona, y restringe lo que viene | [`docs/deuda.md`](docs/deuda.md) |

**La deuda que el próximo tramo va a pisar se paga antes del tramo**, agregando la garantía que
faltaba.

## Qué NO va en este archivo

- **Decisiones** → `docs/ope.md` (nuevas), `docs/arquitectura.md` y `docs/seguridad.md` (heredadas)
- **Estado, historia y traspaso** → `.specify/memory/estado.md`
- **Principios y convenciones** → `.specify/memory/constitution.md`

Acá va **sólo cómo trabajar**. Si algo que se agrega no cambia lo que un agente hace a
continuación, va en otro lado.
