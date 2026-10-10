# `contracts/ope/` — el contrato de OPE, como artefacto

**No se edita a mano.** Lo deja `npm run contract:sync` (`scripts/contract-sync.mjs`), que copia
`generated/contract/` de OPE-Backend tal cual, y `ope-check conformity` verifica que el módulo de
capacidades, las restricciones y el bundle no se hayan despegado.

| | |
|---|---|
| Versión del contrato | `1.15.0` |
| `sha256` del bundle copiado | `f37d13fe868d0794f107cd785a0ca587bab22137243d665af912bf02fe0ca7f0` |
| Commit de OPE-Backend | `47246a2f17747c73839b12d7a9c1ef73bbe1a30d` |
| Sincronizado | 2026-10-10 |

## Los archivos

Los ocho salen de `generated/contract/` del backend, que los emite con `npm run contract:types`
(`ADR-044`); la forma es la que este repositorio publica en
`specs/005-la-base-de-ope/contracts/contract-artifact.md` y
`specs/006-el-merchant-completo/contracts/constraints-artifact.md`.

| archivo | qué es | quién lo lee |
|---|---|---|
| `openapi.yaml` | el bundle del contrato, con su cabecera de generado | `conformity`; una persona |
| `api.d.ts` | los tipos de openapi-typescript | `openapi-fetch` en `apps/*/src/api/ope/`; `conformity` |
| `problem-types.d.ts` | el catálogo de problemas | `@ope/core` (`ProblemSlug`) |
| `capabilities.js` + `capabilities.d.ts` | el módulo de `TAN-7`: operación → capacidades e idempotencia, y el vocabulario del consumidor `admin` | `operation()`, `conformity`, la sesión falsa |
| `identity.json` | versión y `sha256` del bundle copiado | `conformity`; este README |
| `constraints.js` + `constraints.d.ts` | la capa 1 de `CU-38`: qué puede verificar un formulario de cada cuerpo de pedido del consumidor `admin` | `useForm` desde `apps/*/src/api/ope/`; `conformity` |
