# Una carpeta por sistema

**Por sistema, no por funcionalidad** (`CU-22`). Hoy la consola habla con uno —OPE-Backend— y la
carpeta se llama como él:

```
api/
└── ope/
    ├── client.ts         el servicio: createOpeClient con la sesión cosida, y cada llamada
    ├── operations.ts     opeOperation(id, run), tipada contra el módulo del contrato
    ├── identity.ts       quién es el operador (hoy una sonda; getOperator con la 040)
    └── README.md         qué es cada archivo
```

## Lo que no se escribe a mano

**Los tipos salen de [`contracts/ope/api.d.ts`](../../../../contracts/ope/api.d.ts)**, que
`npm run contract:sync` copia del backend (`CU-14`, `OW-5`). **Las capacidades y la idempotencia de
cada operación salen de [`contracts/ope/capabilities`](../../../../contracts/ope/capabilities.d.ts)**,
el módulo del consumidor `admin`: un `operationId` o una capacidad que el contrato no tiene **no
compila**, y `ope-check conformity` verifica que el módulo sea el del bundle.

## Cómo se construye el servicio

**Recibe la sesión** —`authorize` y `observe`, juntas— y no va a buscarla:

```ts
opeService(createClient(config.systems.ope, session))
```

Quien lo usa **no sabe** si adentro hay un encabezado, una cookie o mTLS (`CU-10`, `OW-2`). Y cada
respuesta pasa por `observe`: un `401` en vuelo termina la sesión sin que ninguna pantalla se
acuerde de avisar.

**Sin clave de idempotencia**: OPE repite por cuerpo idéntico (`x-idempotency`).

## Quién puede importar de acá

**Sólo `features/<x>/data/`**, y **sólo `api/` lee `contracts/ope/`**. Lo verifica `ope-check`.

Una pantalla nunca ve un tipo generado ni sabe de qué sistema vino el dato. Es la capa
anticorrupción del frontend.

## La respuesta, y dónde se lee

OPE responde el recurso **pelado** y, cuando no puede, un **Problem Details** (`OW-3`). `unwrap` lo
lee en un solo lugar: el tipo del problema para ramificar, el `detail` para mostrar, los `errors[]`
para los campos, y el identificador del pedido **si vino** — que llega con la 040.

## Los nombres

**Los del contrato, acá y sólo acá.** `merchantId`, `origins`, `credentials` son el vocabulario del
transporte; una pantalla los muestra con los rótulos de su catálogo.
