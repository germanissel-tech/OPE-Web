# Investigación · El esqueleto

Las cinco incógnitas que quedaban al planificar, y cómo se resolvieron. **Ninguna quedó abierta.**

---

## 1 · Con qué se rutea

**Resuelto por `CU-41`**, que salió de acá: la incógnita resultó ser una decisión, no un detalle de
implementación, así que se preguntó en vez de elegirla en el plan.

**React Router como transporte, y los tipos derivados del registro de `CU-23`.** El razonamiento
completo y lo descartado están en la decisión.

Lo que importa para este plan: **el arreglo de rutas se arma del registro, no se escribe.** Cualquier
tarea que agregue una ruta a mano contradice `CU-23` y `CU-41` a la vez.

---

## 2 · Cómo se verifica la dirección de las importaciones

`CU-16` ya declaró el hueco —*Biome no puede verificar límites entre carpetas*— y que **la sostiene
una comprobación propia**. Faltaba cómo.

**Decisión: se escribe a mano, en `tests/boundaries.mjs`, sin dependencias.**

Cada archivo de `src/` cae en una zona por su ruta —`app`, `features`, `components`, `lib`, `api`—, se leen sus
importaciones relativas, se resuelve a qué zona apuntan, y **falla si la dirección va al revés** de
lo que fija `CU-15`. Las importaciones de paquetes se ignoran, salvo las que `CU-36` reserva para la
raíz de composición.

**Por qué a mano.** `dependency-cruiser` hace esto y está bien hecho. Se descartó porque
`tests/decisions.mjs` ya resolvió un problema de la misma clase en 158 líneas sin dependencias, y
porque la regla que se verifica es **nuestra y corta** — la configuración de una herramienta general
sería más larga que la comprobación.

**Riesgo declarado**: un análisis por texto no ve importaciones dinámicas ni alias raros. Se acepta:
`CU-15` prohíbe los alias que lo harían ambiguo, y una importación dinámica que cruce una zona es
igual de visible al leer.

---

## 3 · Cómo se verifica que la implementación falsa no está en producción

`CU-36` lo exige —*no hay bandera que la encienda porque no hay qué encender*— y **una comprobación
revisa el artefacto**.

**Decisión: la falsa exporta una marca constante, y `tests/artifact.mjs` falla si aparece en
`dist/`.**

Es lo mismo que ya hace granito para verificar que su paquete cumple lo que promete, y tiene la
propiedad que importa: **no depende de cómo esté configurado el empaquetador.** Verifica el resultado,
no la intención.

Se descartó confiar en que el sacudido de árbol la saque: eso es una propiedad de la configuración,
y una configuración cambia sin que nadie lo note.

---

## 4 · Cómo se prueba el clon sin haber publicado nada

Es la incógnita que más importaba, porque **el escenario 16 es la prueba que verifica la promesa** y
depende de resolver los paquetes desde el registro — que todavía no existe.

**Decisión: `npm pack` y se instala desde el archivo.**

`tests/clone.mjs` construye los dos paquetes, los empaqueta, copia el esqueleto a una carpeta
temporal, **borra `packages/` y `specs/`**, reescribe las dos dependencias apuntando a los archivos,
instala, compila y levanta.

**Por qué sirve.** Un archivo de `npm pack` es exactamente lo que se sube al registro: mismo
contenido, mismo `files`, misma resolución. Si algo falta en `files` —el caso más probable de todos—
**esta prueba lo agarra igual que lo agarraría el registro**, y sin publicar ni tener red.

Se descartó `npm link` y los espacios de trabajo: los dos resuelven contra la carpeta de al lado, o
sea **prueban justamente lo que el clon no va a tener**.

---

## 5 · Cómo se organizan los espacios de trabajo

**Decisión: la aplicación es la raíz, y los paquetes cuelgan de `packages/`.**

```
cuarzo/           ← la aplicación:  esto es lo que se clona
└── packages/     ← @cuarzo/core y @cuarzo/session:  esto se borra al clonar
```

La otra forma —`apps/esqueleto` junto a `packages/`— es más prolija para un repositorio de
bibliotecas, y es la que usa granito. **Acá estorba**: obligaría a que clonar fuera «copiar una
subcarpeta y subirla un nivel», y `CU-20` pide que clonar sea clonar.

Con la aplicación en la raíz, el ritual es **borrar dos carpetas**, que es lo que dice el escenario
16 y lo que la prueba ejecuta.

**Consecuencia aceptada**: el `package.json` de la raíz hace dos cosas a la vez —declara los espacios
de trabajo y es el de la aplicación—. Al clonar, la sección de espacios de trabajo se saca. Es una
línea, y está en el ritual.
