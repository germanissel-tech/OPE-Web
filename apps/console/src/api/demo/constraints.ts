/**
 * Generado por `npm run tipos` desde `contracts/demo.yaml` — no editar a mano.
 * This file was auto-generated. Do not make direct changes to the file.
 *
 * Lo que el contrato le exige a cada mensaje: qué campos son obligatorios, sus
 * largos y patrones, y las invariantes que miran dos campos del mismo mensaje.
 *
 * De acá salen las dos capas locales de `CU-38`, y por eso se genera. Una copia
 * a mano sería la que un día no coincide con lo que la API acepta — y la que se
 * pasa de estricta **no se descubre nunca**: bloquea al operador por algo que el
 * servidor habría aceptado, y nadie tiene cómo enterarse.
 */

export const constraints = {
  Article: {
    required: ['id', 'name', 'price', 'active'],
    fields: {
      id: { type: 'integer', displayAs: 'integer' },
      name: { type: 'string' },
      price: { type: 'string', pattern: '^[0-9]+\\.[0-9]{2}$', displayAs: 'money' },
      discountedPrice: { type: 'string', pattern: '^[0-9]+\\.[0-9]{2}$', displayAs: 'money' },
      stock: { type: 'integer', minimum: 0, maximum: 99999, displayAs: 'integer' },
      active: { type: 'boolean' },
    },
    invariants: [],
  },
  ArticleCreate: {
    required: ['name', 'price'],
    fields: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      price: { type: 'string', pattern: '^[0-9]+\\.[0-9]{2}$', displayAs: 'money' },
      discountedPrice: { type: 'string', pattern: '^[0-9]+\\.[0-9]{2}$', displayAs: 'money' },
      stock: { type: 'integer', minimum: 0, maximum: 99999, displayAs: 'integer' },
      active: { type: 'boolean' },
    },
    invariants: [
      { code: 'DISCOUNT_ABOVE_PRICE', rule: 'discountedPrice <= price' },
    ],
  },
  Meta: {
    required: ['requestId'],
    fields: {
      requestId: { type: 'string' },
    },
    invariants: [],
  },
  PageMeta: {
    required: ['requestId', 'page', 'size', 'totalItems', 'totalPages'],
    fields: {
      requestId: { type: 'string' },
      page: { type: 'integer', displayAs: 'integer' },
      size: { type: 'integer', displayAs: 'integer' },
      totalItems: { type: 'integer', displayAs: 'integer' },
      totalPages: { type: 'integer', displayAs: 'integer' },
    },
    invariants: [],
  },
  Error: {
    required: ['error'],
    fields: {
      error: { type: 'object' },
    },
    invariants: [],
  },
} as const

/** Los mensajes que el contrato declara. Un typo no compila. */
export type SchemaName = keyof typeof constraints
