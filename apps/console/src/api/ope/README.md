# `ope`

El backend de OPE, por su contrato. Es el sistema contra el que habla la consola, y después el portal.

## Los tipos

Salen de [`contracts/ope/api.d.ts`](../../../../../contracts/ope/api.d.ts), que `npm run contract:sync`
copia del backend (`generated/api.d.ts`, openapi-typescript). **Acá no se genera nada**: el backend ya
lo produce, y un segundo generador para lo mismo sería la copia que un día no coincide.

## Las capacidades

[`operations.ts`](operations.ts) toma lo que el contrato exige de cada operación de
[`contracts/ope/capabilities`](../../../../../contracts/ope/capabilities.d.ts): el módulo que el backend
emite por consumidor (`TAN-7`). Una operación se declara por su `operationId`, y un identificador
que el contrato no tiene **no compila** ([`operations.test-d.ts`](operations.test-d.ts)).

`ope-check conformity` verifica que ese módulo sea el del bundle sincronizado.

## El conector

[`client.ts`](client.ts) declara el servicio (`opeService`) y arma cada llamada sobre
`createOpeClient` de `@ope/core`, que cose la sesión una sola vez: `authorize` en cada pedido,
`observe` en cada respuesta (`CU-10`). Sin clave de idempotencia: OPE repite por cuerpo idéntico.
