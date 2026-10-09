# `contracts/ope/` — el contrato de OPE, como artefacto

**No se edita a mano.** Lo deja `npm run contract:sync` (`scripts/contract-sync.mjs`), y
`ope-check conformity` verifica que el módulo de capacidades y el bundle no se hayan despegado.

| | |
|---|---|
| Versión del contrato | `1.13.0` |
| `sha256` del bundle | `06ea91708eac4c2b4f3e2447c8026b030a49e2963ae0d43c7ac4cba13eb06289` |
| Commit de OPE-Backend | `ec881d9aaec46282877b9fc2c9745304a340d242` |
| Sincronizado | 2026-10-09 |
| Módulo de capacidades | copiado de `generated/contract/` del backend (feature 040) |
| Restricciones | copiado de `generated/contract/` del backend (feature 040) |

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
