# `demo`

> **No es un sistema de Tandilia: es el del hola mundo.** Se borra al clonar, junto con
> `src/features/` y `contracts/demo.yaml`. Es el paso 6 del ritual, no un olvido.

Existe para que el esqueleto pueda probar lo suyo —tipos generados, cliente con autorización, el
sobre, los cuatro estados, filtro y paginado del servidor— **sin depender de otro repositorio**.
Ésa es la promesa de `CU-20`: clonar y que arranque.

## Los tipos

[`types.ts`](types.ts) lo genera `openapi-typescript` desde [`contracts/demo.yaml`](../../../contracts/demo.yaml):

```bash
npm run tipos
```

**Se regenera, no se corrige.** Las comprobaciones de `TAN-6` lo saltean y lo dicen: marcarle algo
sería pedir que alguien edite un archivo que dice «no editar», y la corrección duraría hasta la
próxima generación.

**No se instala `openapi-typescript`**: su par exige TypeScript 5 y acá hay 7. Corre con `npx`,
fuera del árbol de dependencias, y sólo cuando cambia el contrato.

## El simulado

```bash
npm run simulado    # prism, en :4010
```

Sale del mismo archivo que los tipos, así que **no pueden desincronizarse**: si el contrato cambia,
cambian los dos.

### Hay dos, y cada uno hace algo distinto

```bash
npm run simulado            # el del ejemplo: filtra, pagina, arma el sobre
npm run simulado:contrato   # Prism: valida que el pedido cumpla el contrato
```

**El del ejemplo** vive en [`tests/mock.mjs`](../../../tests/mock.mjs) y **lee los artículos del
mismo contrato**, así que no hay una segunda lista que se desincronice. Existe porque Prism en modo
estático **responde el ejemplo mire lo que mire la consulta**: con `?search=zzz` devolvía los tres
artículos igual, y con eso el ejemplo del esqueleto no podía mostrar ni el filtro ni los dos vacíos
—que son justo lo que `CU-24` existe para probar—.

**Prism sigue estando** para lo que hace mejor: verificar que lo que mandamos cumple el contrato, y
responder `422` cuando no. Los dos escuchan en `:4010`, así que se levanta uno por vez.

## Cuando esta aplicación hable con un backend de verdad

Se borra esta carpeta y se crea una por sistema (`CU-22`), con **los tipos generados del contrato de
ese backend** — no escritos a mano (`CU-14`).

```
api/
├── las-animas/     types.ts generado · client.ts
└── centinela/
```

Un backend de Tandilia genera los suyos en su propio repositorio. Si todavía no los publica, se
regeneran acá desde su contrato bundleado y se versiona el resultado — está pedido para
`las-animas` en `las-animas/backend#PED-6`.

## Quién puede importar de acá

**Sólo `features/<x>/data/`.** Lo verifica `cuarzo-check`.

Una pantalla nunca ve un tipo generado ni sabe de qué sistema vino el dato. Si mañana un endpoint se
parte en dos, o una funcionalidad pasa a componer dos backends, **se toca una carpeta**.
