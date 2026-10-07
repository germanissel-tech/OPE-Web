# Lo que el esqueleto modela · El esqueleto

Cinco cosas. **Ninguna sabe de negocio** (principio III): son las formas con las que una aplicación
declara lo suyo.

---

## 1 · La declaración de una pantalla

De acá salen **el menú, las rutas y el filtrado por capacidad de los dos lados** (`CU-23`), y **los
tipos de la navegación** (`CU-41`).

| campo | qué es |
|---|---|
| **identificador** | Con qué se la nombra al navegar |
| **título** | Lo que se ve en el menú y en la cabecera |
| **ruta** | Con sus parámetros. **De acá se derivan los tipos** |
| **capacidad requerida** | Sin ella no aparece en el menú **ni deja entrar por URL** |
| **componente** | Qué se dibuja |
| **sección del menú** | Dónde agrupa. **Puede no coincidir con la carpeta**, y es a propósito (`CU-15`) |
| **centro de la barra** | La puerta que `CU-23` dejó abierta. **Qué se puede publicar es `CU-28`, y está abierta** |

**Agregar una pantalla es tocar un lugar.** Cualquier tarea que además toque el menú o el ruteador
contradice `CU-23`.

---

## 2 · La acción

Lo que ejecuta un botón (`CU-37`). Vive en `features/<x>/data/`, que por `CU-15` es lo único que
puede importar de `api/`.

| campo | qué es |
|---|---|
| **operaciones** | Una o más del contrato. **Declara sus operaciones, no sus permisos** |
| **qué invalida** | Las consultas que quedan viejas cuando sale bien (`CU-25`) |
| **clave de idempotencia** | Sólo las que la piden (`CU-34`) |

**La capacidad no es un campo**: se **deriva** de `x-required-roles` de las operaciones declaradas
(`CU-37`). Por eso el botón que no está habilitado **no se dibuja**, y `CU-3` deja de depender de que
alguien se acuerde.

Lo que la acción **no** trae, porque lo pone el marco (`CU-25`): el aviso de éxito, los mensajes de
campo cuando vuelve `error.fields`, el aviso con el identificador del pedido para cualquier otro
error, y **no reintentar nunca**.

---

## 3 · El resultado, con sus cuatro estados

La pantalla entrega el resultado de la consulta y declara **dos** cosas; el resto lo dibuja el marco
(`CU-24`):

```tsx
<Result
  query={companies}
  empty={{ titulo: 'Todavía no hay empresas', accion: <Button>Nueva</Button> }}
  noMatches={{ titulo: 'Ningún filtro coincide', accion: limpiarFiltros }}
>
  {(datos) => <Tabla columnas={...} filas={datos} />}
</Result>
```

**Vacío y sin resultados son dos estados distintos** y dicen cosas distintas. Cargando y error los
pone el marco, y el error **envuelve la región, no la pantalla**.

---

## 4 · Los contextos, con sus vidas

Cuatro cosas que se llaman igual y **duran distinto** (`CU-26`). Meterlas en un solo lugar es lo que
las rompe.

| | dónde vive | aguanta |
|---|---|---|
| **De la pantalla** — qué registro se ve | En la URL | recargar y compartir el enlace |
| **De trabajo, estable** — la sucursal | En la máquina | apagar el navegador |
| **De trabajo, efímero** — el cliente actual | **Por pestaña** | recargar, y **no** vuelve mañana |
| **Del operador** — tema, globos | En la máquina | apagar el navegador |

Y dos reglas que valen para todo lo que se guarde:

- **Se estampa con el sujeto y se descarta si no coincide.** Otra persona en la misma máquina **no
  hereda** el cliente de la anterior.
- **Se guardan identificadores, no datos.** Nombre, saldo y condición en el disco de una máquina de
  mostrador es la misma exposición que ya rechazamos con el token. Lo demás se vuelve a pedir, y por
  `CU-14` ya está cacheado.

---

## 5 · La configuración

Se lee **al arrancar, antes de dibujar nada** (`CU-17`). De ahí salen el emisor, las URLs de cada
sistema, y lo que `CU-9` y `CU-15` dejaron configurable.

**Si falta un valor obligatorio, no arranca y dice cuál.** No sigue con valores por omisión: un
emisor mal configurado tiene que fallar al arrancar, no en el primer pedido con un `401` que manda a
buscar el problema donde no está.

Y **no se cachea** (`CU-36`): si el navegador la guarda, promover el mismo artefacto de pruebas a
producción no cambia nada, que es exactamente lo contrario de lo que `CU-17` buscaba.
