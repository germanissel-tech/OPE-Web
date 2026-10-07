# Las cosas · El testigo y el conflicto

**Carpeta**: `004-el-testigo-y-el-conflicto` · **Fecha**: 2026-08-29

Cinco cosas, y **tres son campos nuevos en algo que ya existe**. Ésa es la señal de que la
investigación encontró el camino y no hubo que inventar una forma.

---

## 1 · El testigo, en `Meta`

Lo que identifica la versión de un registro. **Opaco**: cuarzo lo guarda y lo devuelve, no lo lee.

```
Meta
├── requestId        ya estaba — sale de un encabezado
├── version?         NUEVO — sale del encabezado, igual que el anterior
├── page? size? …    ya estaban
```

**Opcional, y a propósito**: una lista no lo trae, y una respuesta de un servidor que no lo emite
tampoco. Que falte no es un error de transporte — **es un error recién cuando alguien intenta
escribir un recurso que lo exige**, y ahí lo dice la cosa 3.

## 2 · La versión cargada

Lo que la pantalla trajo al abrir: **los valores y el testigo**. Es la referencia contra la que se
compara, y `CU-29` ya dijo lo que cuesta: *«es el registro que ya se trajo, así que es memoria y no
maquinaria»*.

No es un tipo nuevo: es el `Page<T>` que la pantalla ya tiene, guardado.

## 3 · La operación que exige testigo

`operation` declara hoy `{ roles, idempotent }`. Gana uno:

```
{ roles, idempotent, versioned }
```

**De ahí sale la garantía de «no compila»**: cuando `versioned` es verdadero, el tipo de lo que la
acción le pasa exige el testigo. Es el mismo mecanismo con el que una ruta con parámetros no se
navega sin ellos (`CU-41`).

El testigo **no viaja en el cuerpo**: va por el canal que ya usa la clave de idempotencia —tercer
parámetro de `run`, puesto por la puerta y no por quien llama—. Que sea el mismo canal no es
casualidad: los dos son datos de protección que la puerta administra y la pantalla no toca.

## 4 · El choque

Lo que la comparación produce. **No es un diff**: es la intersección.

```
Choque
└── campos[]
    ├── nombre
    ├── alAbrir      lo que había cuando se cargó
    └── ahora        lo que hay en el servidor
```

Se calcula con tres entradas —la versión cargada, lo que el operador tiene en pantalla, y lo que el
servidor devolvió al releer— y una regla:

> un campo entra **si el operador lo cambió** y **además cambió en el servidor**.

**Lista vacía significa que no hay conflicto real**, y ése es el caso frecuente: se guarda con el
testigo nuevo y nadie se entera. `CU-29` lo dice así — *«eso es lo que evita que la protección se
vuelva un estorbo diario»*.

**Lo que el operador tiene en pantalla no se toca nunca.** No entra a esta cosa: entra como entrada
de la comparación y se queda donde está.

## 5 · El rechazo por conflicto

Un `RequestFailed` como los que ya existen, reconocido por su código —nunca por su mensaje
(`CU-14`)—. Se distingue de los de validación: aquéllos vuelven a los campos (`CU-38`), éste **no
vuelve a ningún campo** y no puede caer en el mismo camino, o el operador ve un formulario que
parece mal llenado.

Lleva su identificador de pedido, como todos (`CU-4`).

---

## Lo que NO es una cosa acá

**El campo atado a otro.** `CU-29` dice que hace falta y que la aplicación lo declara; no hay ningún
caso real, así que **no se le inventa una forma**. Lo que sí se exige del diseño es que el cálculo
del choque **pueda recibirlo después sin cambiar de forma** — la lista de campos que entran se amplía,
no se recalcula de otra manera.

**El conflicto resuelto.** Cuarzo no fusiona ni elige. Lo que sigue al choque es del operador.
