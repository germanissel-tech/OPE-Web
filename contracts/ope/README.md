# `contracts/ope/` — el contrato de OPE, como artefacto

**No se edita a mano.** Lo deja `npm run contract:sync` (`scripts/contract-sync.mjs`), y
`ope-check conformity` verifica que el módulo de capacidades y el bundle no se hayan despegado.

| | |
|---|---|
| Versión del contrato | `1.11.0` |
| `sha256` del bundle | `404fa3c53649232b7323b7cb949c1d548336a7c18fae5cd565c2a2eb6db535b8` |
| Commit de OPE-Backend | `4d8718305240d12bcf633e2dd7d15b555194945f` |
| Sincronizado | 2026-10-08 |
| Módulo de capacidades | emitido por `scripts/contract-sync.mjs` desde el bundle, hasta que OPE-Backend 040 lo emita |
| Restricciones | emitido por `scripts/contract-sync.mjs` desde el bundle, hasta que OPE-Backend 040 lo emita |

## Los archivos

| archivo | de dónde sale | quién lo lee |
|---|---|---|
| `openapi.yaml` | `contracts/dist/openapi.yaml` del backend, sin tocar | `conformity`; una persona |
| `api.d.ts` | `generated/api.d.ts` del backend (openapi-typescript) | `openapi-fetch` en `apps/*/src/api/ope/`; `conformity` |
| `problem-types.d.ts` | `generated/problem-types.d.ts` del backend | `@ope/core` (`ProblemSlug`) |
| `capabilities.js` + `capabilities.d.ts` | el módulo de `TAN-7`: operación → capacidades e idempotencia, y el vocabulario del consumidor `admin` | `operation()`, `conformity`, la sesión falsa |
| `identity.json` | versión y `sha256` del bundle, y el commit del backend | `conformity`; este README |
| `constraints.js` + `constraints.d.ts` | la capa 1 de `CU-38`: qué puede verificar un formulario de cada cuerpo de pedido del consumidor `admin` | `useForm` desde `apps/*/src/api/ope/`; `conformity` |

La forma del módulo es la que el frontend publica en
`specs/005-la-base-de-ope/contracts/contract-artifact.md`, y la de las restricciones en
`specs/006-el-merchant-completo/contracts/constraints-artifact.md`; es lo que OPE-Backend 040 tiene
que emitir en `generated/contract/`. Cuando lo emita, el sincronizador copia en vez de emitir.
