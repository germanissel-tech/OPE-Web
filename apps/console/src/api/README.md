# Una carpeta por sistema

**Por sistema, no por funcionalidad** (`CU-22`). Una aplicación de Tandilia puede consumir varios
backends —`las-animas`, `centinela`, `tigre` son sistemas separados— y **el frontend es quien los
junta**, porque ningún backend sabe de los otros.

```
api/
├── demo/             ← el del hola mundo. Se borra al clonar
├── las-animas/       ← así se ve una de verdad
│   ├── types.ts      generado del contrato con openapi-typescript
│   └── client.ts     el cliente, construido con authorize
└── centinela/
```

> **Hoy sólo está `demo/`**, contra [`contracts/demo.yaml`](../../contracts/demo.yaml), que es un
> contrato del esqueleto y no de un sistema. Así el clon arranca **sin ningún repositorio al lado**,
> que es lo que `CU-20` promete.

## Lo que no se escribe a mano

**Los tipos se generan del contrato** (`CU-14`). Nadie los tipea, y un tipo escrito a mano acá es
una segunda fuente de verdad para algo que el backend ya publica.

## Cómo se construye un cliente

**Recibe `authorize`**, no va a buscarla:

```ts
const client = createClient(config.systems['las-animas'], session.authorize)
```

Quien lo usa **no sabe** si adentro hay un bearer, una cookie o mTLS (`CU-10`). Si mañana el
proveedor cambia de mecanismo, no se mueve una sola pantalla.

**Y cada llamada lleva el token de su destino** (`CU-22`): un token con permisos de todos los
sistemas es un token que ejerce más de lo que necesita.

## Quién puede importar de acá

**Sólo `features/<x>/data/`.** Lo verifica `cuarzo-check`.

Una pantalla nunca ve un tipo generado ni sabe de qué sistema vino el dato. Si mañana un endpoint se
parte en dos, o una funcionalidad pasa a componer dos backends, **se toca una carpeta**.

Es la capa anticorrupción del frontend, y nos toca a nosotros: el backend tiene la suya contra el
legacy (`ADR-001`) y **ninguna contra nosotros, a propósito**.

## El sobre, y dónde se desenvuelve

El contrato responde `{ data, meta }`. **Se desenvuelve en un solo lugar**, guardando
`meta.requestId` — que es lo que un operador necesita para pedir ayuda cuando algo falla (`CU-25`).

## Los nombres

**Los del contrato, acá y sólo acá.** `companies` y `settlements` son el vocabulario del transporte
de un sistema; hacia afuera se traducen a los de la aplicación.

Y ojo con los falsos amigos que advierte el glosario del backend: **empresa significa grupo de
clientes**, no razón social. Una pantalla que escriba «cliente» ahí **dice otra cosa**.
