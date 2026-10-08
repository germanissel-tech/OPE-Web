/**
 * Generado por `npm run tipos` desde `contracts/demo.yaml` — no editar a mano.
 * This file was auto-generated. Do not make direct changes to the file.
 *
 * Qué le exige el contrato a cada operación: sus capacidades (los
 * `x-required-roles` del hola mundo), si pide clave de idempotencia, y si
 * exige el testigo del recurso. De acá salen la capacidad de una acción
 * (`CU-37`), su clave (`CU-34`) y la versión sobre la que escribe (`CU-29`),
 * y por eso se genera: escribirlo a mano sería la copia que un día no coincide
 * con lo que la API permite.
 */

export const contractRequires = {
  listArticles: { capabilities: ['catalog:read'], idempotent: false, versioned: false },
  createArticle: { capabilities: ['catalog:write'], idempotent: true, versioned: false },
  getArticle: { capabilities: ['catalog:read'], idempotent: false, versioned: false },
  updateArticle: { capabilities: ['catalog:write'], idempotent: false, versioned: true },
  deactivateArticle: { capabilities: ['catalog:write'], idempotent: false, versioned: false },
  activateArticle: { capabilities: ['catalog:write'], idempotent: false, versioned: false },
} as const

/** Los identificadores que el contrato declara. Un typo no compila. */
export type OperationId = keyof typeof contractRequires
