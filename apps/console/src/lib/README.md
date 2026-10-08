# Lo transversal

El formateo y lo que cruza todo sin ser visual ni de una funcionalidad.

**Está vacía a propósito**, y conviene revisar antes de llenarla: casi todo lo que parece candidato
ya vive en otro lado.

| lo que uno buscaría acá | dónde está |
|---|---|
| La sesión, autorizar un pedido | `@cuarzo/session` |
| Navegar, el registro de pantallas | `@cuarzo/core` |
| Formatear un importe, una fecha | **granito**, con `format` — y su `configure` |
| Leer y validar la configuración | `@cuarzo/core`, con `readConfig` |

## Qué sí va

Funciones **sin estado** que usan varias funcionalidades: una comparación, una normalización, un
cálculo del negocio de esta aplicación.

**Sin estado es la palabra.** Lo que tiene ciclo de vida —un cliente, una conexión, un caché— lo
construye la raíz de composición y se **recibe** (`CU-36`). Una variable mutable de módulo acá
falla en `cuarzo-check`.

## Qué puede importar

```
lib · components  →  features  →  app
```

`lib/` es el piso: **puede importar de `lib/` y de nada más de `src/`**. Si algo de acá necesita una
pantalla o un componente, está en el lugar equivocado.
