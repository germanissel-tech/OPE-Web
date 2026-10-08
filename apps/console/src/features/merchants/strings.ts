/**
 * **Todo lo que esta funcionalidad le dice al operador** (`CU-43`).
 *
 * Vive acá y no en `app/` por dos razones. La primera es que no podría:
 * `CU-15` fija `lib` → `features` → `app` y nunca al revés, así que una
 * funcionalidad no puede importar un catálogo de la aplicación.
 *
 * La segunda es mejor: **los textos viajan con lo suyo.** Se copia la
 * funcionalidad y van; se borra y se van.
 *
 * «Merchant» se queda en inglés: es el nombre del contrato y el del glosario
 * del MVP, y traducirlo sería inventar un segundo nombre para lo mismo.
 */
export const merchantsStrings = {
  /* El título de la pantalla, su entrada de menú y su encabezado de sección. */
  merchants: 'Merchants',
  merchantsSection: 'Administración',
  merchantsCaption: 'Merchants del alcance del operador',

  /* Las columnas de la grilla y los campos de la ficha. Las claves son las del
     contrato, que es lo que `labels` compara entre funcionalidades. */
  merchantId: 'Identificador',
  status: 'Estado',
  origins: 'Orígenes',
  createdAt: 'Alta',
  credentials: 'Credenciales',
  kind: 'Clase',
  issuedAt: 'Emitida',

  /* Los tres estados del contrato (`MerchantStatus`). */
  active: 'Activo',
  off: 'Apagado',
  deactivated: 'Desactivado',

  /* El alta: el botón que la abre, el diálogo, sus campos y lo que anuncia. */
  newMerchant: 'Nuevo merchant',
  origin: 'Origen de la tienda',
  originHelp: 'Con esquema y host, sin ruta: https://tienda.example',
  signature: 'La plataforma firma sus notificaciones',
  save: 'Crear',
  merchantCreated: 'El merchant se creó',
  merchantCreatedDetail: (merchantId: string) =>
    `${merchantId} · las credenciales se muestran una sola vez`,

  /* Desactivar: la acción de fila. Es terminal y se dice. */
  deactivate: 'Desactivar',
  merchantDeactivated: 'El merchant se desactivó',
  merchantDeactivatedDetail: (merchantId: string) => `${merchantId} · no se puede reactivar`,

  /* Cómo lo nombra un lector de pantalla, y lo que dice el globo del icono. */
  openMerchant: 'Ver la ficha',
  backToMerchants: 'Volver a merchants',

  /**
   * Lo que se le dice a un campo con la forma mal (`CU-38`, capa 1).
   *
   * Los pone la aplicación porque el marco no sabe cómo se llama un campo ni en
   * qué tono le habla esta pantalla.
   */
  shape: {
    required: 'Es obligatorio.',
    tooLong: (max: number) => `No puede pasar de ${max} caracteres.`,
    badFormat: 'Va con esquema y host, sin ruta: https://tienda.example',
    outOfRange: (min: number | undefined, max: number | undefined) =>
      `Va entre ${min ?? 0} y ${max ?? '∞'}.`,
  },

  /* Un solo vacío de verdad (`CU-24`): `listMerchants` no filtra, así que «el
     filtro no da» no puede pasar. Se declara igual, porque el tipo lo exige, y
     con el mismo texto. */
  empty: 'Todavía no hay merchants',
  emptyHelp: 'Cuando se dé de alta el primero, aparece acá.',

  /* La ficha, a la que se llega desde la grilla. */
  merchant: 'Ficha del merchant',
  merchantNotFound: 'Ese merchant no existe o está fuera del alcance',
  noCredentials: 'Sin credenciales vigentes',
} as const
