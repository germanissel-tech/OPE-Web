# Índice de decisiones

Todas las decisiones de cuarzo con su estado y su documento. **Este archivo se lee entero**: existe
para resolver una referencia sin abrir quinientas líneas, y para saber si un identificador existe
antes de citarlo.

No tiene contenido propio. Si algo de acá contradice al documento que lo desarrolla, **manda el
documento**.

## Cómo se cita una decisión

**`CU-n`** es de cuarzo. **`GR-n`** es de granito, y vive en `../granito/docs/identidad-visual.md`.

**Nunca un número pelado.** Un número solo es ambiguo —cuarzo y granito tienen los suyos y se
pisan— y de ahí salen las citas inventadas: un agente que busca en cuarzo un número que en realidad
es de granito no encuentra nada, y lo más probable es que complete lo que cree que dice.

## Las enmiendas, y qué cambió cada una

**2026-08-21 — los nombres de API pasaron a inglés.** `CU-15`, `CU-23`, `CU-24`, `CU-25`,
`CU-37` y `CU-40` nombraban su superficie en castellano —`ir()`, `<Resultado>`,
`declararPantalla`, `features/<x>/datos/`— y la constitución pide **el código en inglés**.

Se enmendaron las seis en vez de declarar una excepción: la excepción habría sido justo la
superficie que más se va a escribir, y quien leyera `goTo(screens.x)` al lado de `useSession()`
vería los dos idiomas en la misma línea.

**Se hizo antes de que existiera código que las usara** — sólo el tramo 2 estaba escrito. Más tarde
habría costado mucho más.

**2026-08-21 — `CU-10` separó extraer de interpretar.** La forma de Keycloak vivía inline en el
manifiesto de cada aplicación, así que cambiar de proveedor era editar lógica en las cuatro. Ahora
está en `@cuarzo/session/keycloak`, y cambiarlo es cambiar un import.

**2026-08-21 — `CU-36` precisó el límite del módulo configurado una vez.** Decía que lo llamado
desde cualquier lado va por módulo, sin decir para qué. Se leyó como permiso para guardar objetos con
estado ahí, y de eso salió un Service Locator. Ahora distingue **función sin estado** de **objeto con
ciclo de vida**.

**2026-08-23 — `CU-44` dejó de permitir dos formas de navegar.** Decía que salir de una
funcionalidad era un desenlace y moverse adentro era `goTo`. Su propio argumento la tumbó: dos
mecanismos son criterio, y en el mismo par de archivos del catálogo se eligió distinto cada vez.
Ahora **toda navegación entre pantallas es un desenlace**, y una pantalla no nombra a otra.

Llegó de afuera —`granito#PED-11`, sobre `GR-73`—, y con una razón que desde acá no se veía: una
pantalla que nombra su destino sirve en un solo recorrido.

**2026-08-24 — `CU-23` dejó de poner pantallas en el menú.** Al menú lateral entra **un flujo**,
así que `inMenu` se fue de la declaración de pantalla y `section` se mudó al flujo. Lo decide
`CU-47`, y lo demás de `CU-23` no se tocó: la pantalla se sigue declarando en un solo lugar.

**Ningún identificador cambió**: `CU-23` sigue siendo `CU-23`. Lo que cambió es lo que dice
adentro.

**Un identificador no se reutiliza ni cambia.** Una entrada abierta ya tiene su número, y al
cerrarse conserva el mismo. Así nada de lo escrito antes queda apuntando a otra cosa — que fue lo
que pasó cuando las abiertas eran letras y una se convirtió en dos decisiones.

## El índice

**Cuántas son y cuántas están abiertas lo informa `cuarzo-check`**, que ya las cuenta al verificar
que esta tabla coincida con los documentos. Escrito acá el número envejece con la decisión
siguiente, y ya lo había hecho: decía 42 cuando eran 48.

| id | estado | título | dónde | depende de |
|---|---|---|---|---|
| **CU-1** | decidida | Una pantalla a la vez, y sin apilar | arquitectura | — |
| **CU-2** | decidida | La pantalla declara; el shell coloca | arquitectura | — |
| **CU-3** | decidida | Lo que un permiso no habilita, no se muestra | arquitectura | — |
| **CU-4** | decidida | Toda pantalla que trae datos tiene cuatro estados, no uno | arquitectura | — |
| **CU-5** | decidida | Un formulario tiene tres estados | arquitectura | — |
| **CU-6** | decidida | El formato de un dato se define una sola vez | arquitectura | — |
| **CU-7** | decidida | De dónde sale granito | arquitectura | — |
| **CU-8** | decidida | La sesión se renueva sola, en silencio | seguridad | CU-11 |
| **CU-9** | decidida | Volver a entrar no descarga la página | seguridad | CU-1, CU-10, CU-12 |
| **CU-10** | decidida | La autenticación entra por una puerta; hoy es Keycloak | seguridad | CU-14 |
| **CU-11** | decidida | Una sola autenticación, un token por aplicación | seguridad | — |
| **CU-12** | decidida | Salir de una es salir de todas | seguridad | CU-8 |
| **CU-13** | decidida | Una acción puede pedir la autorización de otra persona | seguridad | CU-3, CU-18 *(abierta)* |
| **CU-14** | decidida | Cómo se piden los datos | arquitectura | CU-9, CU-10 |
| **CU-15** | decidida | La estructura y la configuración de un proyecto | arquitectura | CU-14, CU-20, CU-22 |
| **CU-16** | decidida | El linter y el formateador | arquitectura | CU-15 |
| **CU-17** | decidida | Compilación y despliegue | arquitectura | CU-10, CU-11, CU-15 |
| **CU-18** | abierta | Cómo viaja una autorización por excepción | seguridad | CU-13 |
| **CU-19** | abierta | Cómo consume una aplicación un feature flag | arquitectura | TAN-1 *(plataforma)* |
| **CU-20** | decidida | Cuarzo es la aplicación base, y se clona | arquitectura | CU-7 |
| **CU-21** | abierta | Qué skills lleva el esqueleto | arquitectura | CU-20 |
| **CU-22** | decidida | Un token por sistema, y el frontend compone | arquitectura | CU-10, CU-11 |
| **CU-23** | decidida | Una pantalla se declara una vez, y navegar es tipado | arquitectura | CU-1, CU-3, CU-15 |
| **CU-24** | decidida | El marco dibuja los cuatro estados, no la pantalla | arquitectura | CU-4, CU-14 |
| **CU-25** | decidida | Una acción declara qué invalida, y no maneja su propio error | arquitectura | CU-4, CU-5, CU-14 |
| **CU-26** | decidida | Los tres contextos, y cuánto vive cada uno | arquitectura | CU-9, CU-11 |
| **CU-27** | decidida | La barra de usuario la arma el esqueleto | arquitectura | CU-12, CU-26, CU-36 |
| **CU-28** | abierta | Qué puede publicar una pantalla en el centro de la barra | arquitectura | CU-23, CU-26 |
| **CU-29** | decidida | Cuando otro editó lo mismo, se dice qué cambió | arquitectura | CU-5, CU-25 |
| **CU-30** | decidida | Cuando una pantalla revienta, el marco sobrevive | arquitectura | CU-4, CU-24, CU-35 |
| **CU-31** | decidida | Los textos van con la pantalla; el vocabulario del negocio, aparte | arquitectura | — |
| **CU-32** | decidida | Cómo se exporta un archivo | arquitectura | CU-10, CU-24, CU-25 |
| **CU-33** | decidida | Cómo se sigue una corrida | arquitectura | CU-14, CU-26, CU-32 |
| **CU-34** | decidida | La clave de idempotencia se ata al cuerpo del intento | arquitectura | CU-25, CU-29 |
| **CU-35** | decidida | El registro es un puerto, y hay algo que nunca sale | arquitectura | CU-10, CU-25, CU-36 |
| **CU-36** | decidida | La raíz de composición | arquitectura | CU-10, CU-14, CU-17, CU-23, CU-35 |
| **CU-37** | decidida | Una acción declara sus operaciones, y escribe en un solo lugar | arquitectura | CU-3, CU-15, CU-25, CU-34 |
| **CU-38** | decidida | La validación de un formulario tiene tres capas | arquitectura | CU-5, CU-25, CU-37 |
| **CU-39** | decidida | Las notificaciones son de cada aplicación, y se consultan | arquitectura | CU-14, CU-23, CU-27, CU-33 |
| **CU-40** | decidida | Qué publica cuarzo, qué se copia, y cómo se actualiza | arquitectura | CU-7, CU-15, CU-20 |
| **CU-41** | decidida | El ruteador, y de dónde salen los tipos | arquitectura | CU-15, CU-23 |
| **CU-42** | decidida | El manifiesto: dónde declara una aplicación lo suyo | arquitectura | CU-20, CU-23, CU-36, CU-40 |
| **CU-43** | decidida | Lo que el marco dice, en un catálogo | arquitectura | CU-9, CU-27, CU-42 |
| **CU-44** | decidida | Una pantalla informa qué pasó; la aplicación decide qué sigue | arquitectura | CU-15, CU-23, CU-26, CU-41 |
| **CU-45** | decidida | Una falla del marco dice qué clase de falla es | arquitectura | CU-17, CU-25 |
| **CU-46** | decidida | Cuándo un botón se deshabilita, y quién sabe la regla | arquitectura | CU-3, CU-25, CU-34, CU-37 |
| **CU-47** | decidida | Cómo se atraviesa una aplicación: el flujo, la pila y los cuatro verbos | arquitectura | CU-3, CU-14, CU-15, CU-23, CU-26, CU-41, CU-42, CU-44 |
| **CU-48** | decidida | El menú lateral se declara, y es un nivel | arquitectura | CU-3, CU-23, CU-27, CU-43, CU-47 |
| **CU-49** | decidida | Un rechazo que la pantalla no puede mostrar no se pierde | arquitectura | CU-5, CU-14, CU-25, CU-29, CU-38, TAN-9 *(plataforma)*, TAN-10 *(plataforma)* |

## Qué lo mantiene honesto

`packages/core/checks/decisions.mjs`, que corre con `npm test`. Falla si un identificador está repetido, si
una decisión no declara su estado, si esta tabla no coincide con los documentos, o si alguien cita
un `CU-n` que no existe.

**Un documento no asegura nada por sí solo** — ver la constitución. Éste tampoco: lo asegura la
prueba.
