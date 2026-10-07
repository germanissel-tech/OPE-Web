# CLAUDE.md

Cómo se trabaja en este repositorio. **Leerlo entero antes de tocar nada.**

## Lo primero, porque es lo que no se deshace

**Antes de crear o modificar cualquier archivo, describir en el chat qué se va a escribir y esperar
el OK.**

No es una formalidad: en un repo hermano hubo que borrar tres veces trabajo completo por producirlo
antes de tiempo. Ante la duda, escuchar y preguntar. Alcanza también a las especificaciones — una
`spec.md` escrita entera sin pasar por el chat es el mismo error con más páginas.

## Qué es cuarzo

**Cómo se arma una aplicación de frontend de Tandilia**: las decisiones de arquitectura con su
razón, el esqueleto del que se clona, y el código que queda sincronizado entre todas.

```
granito   ← cómo se ve y cómo se opera.  NO sabe de Tandilia.
   ↓
cuarzo    ← cómo se arma una aplicación.  NO sabe de negocio.
   ↓
las-animas/admin · centinela · tigre   ← cada una su dominio y su backend.
```

**Cada capa se define por lo que NO sabe**, que es lo que la mantiene reutilizable.

## Dónde está cada cosa, y cuándo se lee

| | qué es | cuándo |
|---|---|---|
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Lo que no se negocia: seis principios y la jerarquía de garantías | **siempre** |
| [`.specify/memory/estado.md`](.specify/memory/estado.md) | Dónde está cada cosa, qué sigue, y qué está roto en el entorno | al empezar una sesión |
| [`docs/decisiones.md`](docs/decisiones.md) | **El índice**: id, estado y dónde vive cada una. Se lee entero | antes de citar una decisión |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Las decisiones con su razón, y las abiertas | antes de especificar o planificar |
| [`docs/seguridad.md`](docs/seguridad.md) | La continuación: sesión, autenticación y permisos. **Numeración corrida** con el anterior | si la pieza toca la sesión |
| [`docs/deuda.md`](docs/deuda.md) | Lo que funciona y restringe, en orden. **No es donde van los defectos** | antes de elegir qué arreglar |
| `../pedidos/cuarzo/` | **Los pedidos que cuarzo recibe**, un sobre por pedido. La fuente vive en Tandilia (`TAN-5`) | antes de tomar trabajo de otro repositorio |
| [`PEDIDOS.md`](PEDIDOS.md) | **Historial legado.** Los 14 pedidos anteriores al protocolo central. No recibe pedidos ni respuestas nuevas | para leer qué se pidió antes |
| [`README.md`](README.md) | Las tres capas y qué no va acá | para mirar el repo desde afuera |
| `specs/NNN-*/` | Una especificación por pieza, con su plan y sus tareas | la que corresponda |
| `.specify/templates/` | Las plantillas. La de `spec` es propia y reemplaza a la de Spec Kit | al escribir una |

**El repo hermano se lee, no se adivina**: `../granito/CLAUDE.md` dice qué componentes existen, y
`../granito/docs/identidad-visual.md` tiene 51 decisiones visuales que **no se re-deciden**.

## El ciclo de trabajo

Cuarzo se construye con **SDD**: la especificación es la fuente, no el código.

| | | |
|---|---|---|
| 1 | `/speckit-specify` | qué resuelve, qué **no** hace, y de qué decisiones depende |
| 2 | `/speckit-clarify` | **no es opcional acá.** Es preguntar lo ambiguo, con herramienta |
| 3 | `/speckit-plan` | cómo, y cuál de las cinco garantías lo sostiene |
| 4 | `/speckit-tasks` | las tareas, en orden |
| 5 | `/speckit-implement` | recién acá se escribe código |
| 6 | **revisar** | **contexto limpio**, contra `TAN-6`. Un tramo no cierra sin esto |

**El sexto no es opcional, y no lo hace quien escribió.** El que implementó tiene adentro la
narrativa de por qué cada elección pareció razonable — y en cuarzo eso dejó pasar un Service Locator
y un ruteador que se recrea en cada render, **con los puntos de control en verde**. El estándar y la
forma de la revisión están en `TAN-6`.

Y tres reglas que cruzan todo el ciclo:

**Una decisión se cita por su identificador**, nunca por un número pelado: `CU-11` es de cuarzo,
`GR-31` es de granito. Un número solo es ambiguo, y de ahí salen las citas inventadas. `npm test`
falla si alguna no resuelve.

**Una especificación que depende de una decisión abierta no se planifica.** Se pregunta. Las
entradas abiertas de los documentos de decisiones están abiertas a propósito, y rellenarlas con lo
que parece razonable es elegir por el usuario.

**Una especificación que no termina en algo que se genere, que no compile, que se herede al clonar
o que agarre una prueba, está incompleta.** Un documento no asegura nada por sí solo.

## Cómo se pide y se contesta trabajo

**La fuente de un pedido vive en Tandilia**, un sobre por pedido:

```
tandilia/pedidos/<receptor>/PED-n.json
```

Los que cuarzo recibe están en `../pedidos/cuarzo/`.

**Por qué allá y no acá.** `TAN-5` se enmendó: escribir el pedido en el repositorio que lo recibe
obliga a quien pide a **entrar a un repositorio que no gobierna**. Con el sobre en el medio, cada
agente commitea sólo lo suyo.

| | quién |
|---|---|
| El sobre: registrarlo y validar su forma | **Tandilia** |
| El contenido de la respuesta, y la decisión de tomarlo o no | **el receptor** |
| Commitear en Tandilia | **nadie más que Tandilia** |

**Cuarzo no modifica ni commitea el repositorio de plataforma.** Se lee el sobre, se hace el
trabajo acá, y la respuesta se entrega para que Tandilia la registre.

### Qué lleva la respuesta

**El contenido lo gobierna cuarzo; la forma es del protocolo.** Se entrega para que Tandilia la
registre en el sobre, y lleva siete cosas:

| | |
|---|---|
| `declarada_por` | `"cuarzo"` |
| `resultado` | aceptado, hecho, necesita información, rechazado |
| `resumen` | qué se hizo, o por qué no |
| `cambios` | qué archivos, y en qué commit |
| `verificaciones` | qué se corrió y con qué salida |
| `pendientes` | lo que queda, dicho y no descubierto después |
| `preguntas` | lo que Tandilia tiene que resolver |

**Rechazar es una respuesta válida**, y lleva su razón: sin ella lo mismo se vuelve a pedir en seis
meses.

### Lo que cuarzo no hace, nunca

- **Commitear o modificar Tandilia.** Ni para registrar su propia respuesta.
- **Escribir un pedido nuevo en `PEDIDOS.md`.**
- **Copiar acá el esquema o los sobres centrales.** Una copia es una segunda fuente, y una segunda
  fuente miente el día que alguien toca una sola.
- **Leer los sobres centrales desde el emisor del catálogo.** Ese emisor publica lo que cuarzo
  declara; mirar el otro lado sería volver a acoplar un repositorio al contenido de otro (`TAN-8`).

**`PEDIDOS.md` es historial legado.** Tiene los 14 pedidos anteriores al protocolo y se conserva
para poder leer qué se pidió antes. **No recibe pedidos ni respuestas nuevas**, y nada debe esperar
que aparezcan ahí.

**No se migran en masa.** Si alguno necesita sobre central, lo decide Tandilia de a uno. El catálogo
los marca `origen: 'legado'` y declara que, ante la misma identidad, **prevalece el sobre central**.

## Cómo se corren las cosas

```bash
npm run avance      # dónde quedó la implementación, y qué sigue
npm test            # las decisiones, los límites de importación, y el artefacto
npm run dev         # levanta el esqueleto
npm run simulado    # el backend simulado en :4010 (delega en las-animas/backend)
npm run revisar     # Biome
npm run build       # compila con strict, y produce dist/
npm run clon        # el ritual de clonar, de verdad: empaqueta, instala y compila
npm run catalogo    # emite catalogo.json de la propia documentación (TAN-8)
```

**El esqueleto está en construcción.** El principio VI —primero las decisiones— se cumplió y se
agotó: ahora cuarzo tiene código.

`npm run avance` dice **en qué tramo va y qué sigue**, leyéndolo de las casillas de
`specs/002-el-esqueleto/tasks.md`. No hace falta buscarlo en la conversación anterior.

**Una casilla no cierra un tramo: lo cierra su punto de control**, que es la aplicación arrancando.

## Cuando algo del código está mal, primero se tría

**Tres cosas se confunden con deuda técnica, y ninguna lo es.** Meter un defecto en la lista de deuda
es cómo un defecto no se arregla nunca.

| | qué es | qué se hace |
|---|---|---|
| **Un defecto** | La aplicación se comporta mal | **Tarea del tramo en curso.** El tramo no cierra sin eso, y va con la comprobación que lo habría agarrado |
| **Un incumplimiento** | El código contradice una decisión ya tomada | **Se resuelve, no se agenda.** O se arregla el código o se enmienda la decisión — y **enmendar no lo decide un agente** |
| **Una garantía declarada que no existe** | Una decisión dice «lo verifica X» y X no lo verifica | **Lo más urgente.** La decisión miente, y quien la lee construye creyendo que está protegido |
| **Deuda** | Funciona, y restringe lo que viene | [`docs/deuda.md`](docs/deuda.md), ordenada por lo que rinde sobre lo que cuesta |

**La deuda que el próximo tramo va a pisar se paga antes del tramo.** Construir encima la multiplica,
y el síntoma aparece lejos de la causa.

**Y se paga agregando la garantía que faltaba**, no sólo reescribiendo. Sin algo que falle la próxima
vez, vuelve en el próximo apuro — que es exactamente cómo llegó.

## Qué NO va en este archivo

Para que no vuelva a crecer:

- **Decisiones** → `docs/arquitectura.md`, y las de seguridad en `docs/seguridad.md`
- **Estado, historia y traspaso** → `.specify/memory/estado.md`
- **Principios y convenciones** → `.specify/memory/constitution.md`

Acá va **sólo cómo trabajar**. Si algo que se agrega no cambia lo que un agente hace a
continuación, va en otro lado.
