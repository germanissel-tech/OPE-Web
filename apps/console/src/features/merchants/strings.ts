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

  /* El alta: el botón que la abre, la pantalla con sus dos secciones, y lo que
     anuncia. Es una pantalla y no un diálogo (`GR-70`). */
  newMerchant: 'Nuevo merchant',
  /* La identidad (feature 007, `ADR-045`): el nombre va primero, es lo que la
     grilla lista y la ficha encabeza. */
  identitySection: 'Identidad',
  identityWhy:
    'El nombre de la tienda o su razón social. Es lo que la grilla lista y la ficha encabeza.',
  name: 'Nombre',
  storeUrl: 'Tienda',
  contact: 'Contacto',
  contactName: 'Persona de contacto',
  contactEmail: 'Email',
  contactPhone: 'Teléfono',
  contactRole: 'Rol',
  notes: 'Notas',
  noIdentity: 'Todavía no tiene identidad: ni nombre, ni URL, ni contacto, ni notas.',
  contactWhy:
    'La persona con la que se lleva la relación comercial. Si hay contacto, nombre y email van; teléfono y rol son opcionales.',
  notesWhy:
    'Texto libre del operador: por qué se dio de alta, en qué etapa está, con quién se habla.',
  /* La edición de la identidad (feature 007): una pantalla que guarda la identidad entera. */
  editIdentity: 'Editar identidad',
  editIdentityTitle: (name: string) => `Editar la identidad de ${name}`,
  editIdentityWhy:
    'Se guarda entera: lo que se deje vacío se borra. Orígenes, estado y credenciales no cambian desde acá.',
  saveIdentity: 'Guardar',
  identitySaved: 'La identidad se guardó',
  identitySavedDetail: (name: string) => name,
  originsSection: 'Orígenes de la tienda',
  originsWhy:
    'Con esquema y host, sin ruta: https://tienda.example. Un origen pertenece a un solo merchant.',
  originRow: (position: number) => `Origen ${position}`,
  addOrigin: 'Agregar otro origen',
  removeOrigin: 'Quitar',
  signatureSection: 'Firma de las notificaciones',
  signatureWhy:
    'Si la plataforma firma, se acuña también un secreto de firma. Se puede crear después.',
  signature: 'La plataforma firma sus notificaciones',
  save: 'Crear',
  cancel: 'Cancelar',
  merchantCreated: 'El merchant se creó',
  merchantCreatedDetail: (merchantId: string) => merchantId,
  rejectedTitle: 'El servidor no lo aceptó',

  /* El segundo paso del alta: las credenciales, una sola vez (`OW-8`). Las
     claves de cada una son las del contrato (`MerchantCredentials`). */
  issuedTitle: 'Credenciales del merchant',
  issuedWarning:
    'Entregalas al merchant ahora: no vuelven a verse. Una que se pierda se rota desde la ficha.',
  ingestKey: 'Llave del tag',
  platformKey: 'Llave de la plataforma',
  platformSecret: 'Secreto de firma',
  continueToMerchant: 'Continuar a la ficha',

  /* Desactivar: la acción de fila. Es terminal, se dice, y se confirma. */
  deactivate: 'Desactivar',
  deactivateTitle: (merchantId: string) => `Desactivar ${merchantId}`,
  deactivateConsequence:
    'No se puede volver atrás: ninguna credencial del merchant vuelve a resolver, y no se puede recrear con el mismo identificador. Sus registros quedan.',
  merchantDeactivated: 'El merchant se desactivó',
  merchantDeactivatedDetail: (merchantId: string) => `${merchantId} · no se puede reactivar`,

  /* Rotar una credencial: es una pantalla (`GR-37`) con la gracia, y termina
     mostrando el valor nuevo una sola vez (`OW-8`). */
  rotate: 'Rotar',
  createSigning: 'Crear el secreto de firma',
  noSigning: 'Este merchant no firma sus notificaciones.',
  rotateTitle: (kind: 'ingest' | 'platform' | 'signing') =>
    ({
      ingest: 'Rotar la llave del tag',
      platform: 'Rotar la llave de la plataforma',
      signing: 'Rotar el secreto de firma',
    })[kind],
  rotateConsequence: (kind: 'ingest' | 'platform' | 'signing') =>
    ({
      ingest:
        'Se acuña una llave nueva para el tag. La anterior vale mientras dure la gracia; después el tag deja de autenticar hasta que use la nueva.',
      platform:
        'Se acuña una llave nueva para la plataforma. La anterior vale mientras dure la gracia; después sus pedidos se rechazan hasta que use la nueva.',
      signing:
        'Se acuña un secreto nuevo con el que la plataforma firma sus notificaciones. Si el merchant no firmaba, desde ahora firma.',
    })[kind],
  credentialLabel: (kind: 'ingest' | 'platform' | 'signing') =>
    ({ ingest: 'Llave del tag', platform: 'Llave de la plataforma', signing: 'Secreto de firma' })[
      kind
    ],
  graceSection: 'Gracia',
  graceWhy:
    'Cuánto sigue valiendo la credencial anterior, en segundos. Cero la revoca en el acto. El máximo lo fija la plataforma.',
  graceSeconds: 'Gracia',
  rotated: (kind: 'ingest' | 'platform' | 'signing') =>
    ({
      ingest: 'Se rotó la llave del tag',
      platform: 'Se rotó la llave de la plataforma',
      signing: 'Se rotó el secreto de firma',
    })[kind],
  issuedAtOf: 'Emitida',
  previousExpiresAt: 'La anterior vale hasta',
  noPrevious: 'No había una anterior',
  backToMerchant: 'Volver a la ficha',
  rotateNotFound: 'Esa credencial no existe',

  /* El interruptor de apagado (01 §14.2): un sí/no con consecuencia, en un
     diálogo (`GR-37`). */
  turnOff: 'Apagar OPE',
  turnOn: 'Encender OPE',
  turnOffTitle: (merchantId: string) => `Apagar OPE para ${merchantId}`,
  turnOnTitle: (merchantId: string) => `Encender OPE para ${merchantId}`,
  turnOffConsequence:
    'Desde el pedido siguiente no se toma ninguna decisión para este merchant: el SDK sigue recibiendo respuestas válidas, y el catálogo, los pedidos y las devoluciones se siguen aceptando. Los experimentos abiertos no cambian.',
  turnOnConsequence: 'Desde el pedido siguiente OPE vuelve a decidir para este merchant.',
  switchedOff: (merchantId: string) => `OPE quedó apagado para ${merchantId}`,
  switchedOn: (merchantId: string) => `OPE quedó encendido para ${merchantId}`,

  /* El registro de administración del merchant (`ADR-031` del backend). Las
     columnas que son campo del contrato (`operation`, `outcome`, `code`) se
     llaman por el campo. */
  log: 'Registro',
  logCaption: 'Registro de administración del merchant, lo más nuevo primero',
  atUtc: 'Instante (UTC)',
  operator: 'Operador',
  operation: 'Operación',
  outcome: 'Resultado',
  code: 'Código',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  denied: 'Denegada',
  logEmpty: 'Todavía nadie hizo nada sobre este merchant',
  logEmptyHelp: 'Cada acción de administración que lo nombre aparece acá.',

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
    badEmail: 'No tiene forma de email: nombre@dominio',
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
