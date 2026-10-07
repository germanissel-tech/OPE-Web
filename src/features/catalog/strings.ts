/**
 * **Todo lo que esta funcionalidad le dice al operador** (`CU-43`).
 *
 * Vive acá y no en `app/` por dos razones. La primera es que no podría:
 * `CU-15` fija `lib` → `features` → `app` y nunca al revés, así que una
 * funcionalidad no puede importar un catálogo de la aplicación.
 *
 * La segunda es mejor: **los textos viajan con lo suyo.** Se copia la
 * funcionalidad y van; se borra y se van. Un catálogo compartido dejaría
 * claves que nadie sabe si todavía se usan.
 *
 * Lo que arregla, y no es hipotético: «Nuevo artículo» llegó a estar escrito
 * **tres veces en dos archivos** —el botón de la barra, el del vacío y el
 * título del diálogo— y nada lo notaba.
 */
export const catalogStrings = {
  /* El título de la pantalla, su entrada de menú y su encabezado de sección.
     Se escribe una vez y los tres salen de acá. */
  catalog: 'Catálogo',
  catalogSection: 'Catálogos',
  articles: 'Artículos del catálogo',

  /* Las columnas de la grilla y los campos del alta. */
  name: 'Nombre',
  price: 'Precio',
  discountedPrice: 'Con descuento',
  stock: 'Stock',
  status: 'Estado',
  active: 'Activo',
  inactive: 'Inactivo',

  /* El alta: el botón que la abre, el diálogo, y lo que anuncia al terminar.
     El título dice qué pasó; la descripción, con qué referirse a eso. */
  newArticle: 'Nuevo artículo',
  /* No hay «Cancelar»: lo pone el diálogo de granito, igual que el orden de los
     botones y el `Enter` (`granito#PED-1`). */
  save: 'Guardar',
  articleCreated: 'El artículo se creó',
  /* Con qué referirse al artículo después. Es una función porque nombra lo que
     pasó, no una categoría. */
  articleCreatedDetail: (code: string, name: string) => `Código ${code} · ${name}`,
  edit: 'Editar',
  editArticle: 'Editar artículo',
  articleNotFound: 'Ese artículo no existe',
  articleUpdated: 'El artículo se guardó',
  articleUpdatedDetail: (code: string, name: string) => `Código ${code} · ${name}`,

  /* Desactivar: la acción de fila. El motivo de por qué no se puede es un
     texto porque va al globo del botón apagado, no un booleano (`CU-46`). */
  /* Cómo lo nombra un lector de pantalla, y lo que dice el globo del icono. */
  openArticle: 'Ver la ficha',
  backToCatalog: 'Volver al catálogo',

  /* Las dos caras del interruptor. El rótulo sale del dato de la fila. */
  deactivate: 'Desactivar',
  activate: 'Activar',
  articleDeactivated: 'El artículo se desactivó',
  articleActivated: 'El artículo volvió a circulación',

  /**
   * Lo que se le dice a un campo con la forma mal (`CU-38`, capa 1).
   *
   * Los pone la aplicación porque el marco no sabe cómo se llama un campo ni en
   * qué tono le habla esta pantalla.
   */
  shape: {
    required: 'Es obligatorio.',
    tooLong: (max: number) => `No puede pasar de ${max} caracteres.`,
    badFormat: 'Va con dos decimales, así: 1250.00',
    outOfRange: (min: number | undefined, max: number | undefined) =>
      `Va entre ${min ?? 0} y ${max ?? '∞'}.`,
  },

  /* La capa 2. Va al globo del botón apagado, así que dice **qué corregir**. */
  discountAbovePrice: 'El precio con descuento no puede superar al de lista.',

  /* Los dos vacíos son distintos y por eso son dos (`CU-24`): que todavía no
     haya nada no es lo mismo que que el filtro no encuentre. */
  empty: 'Todavía no hay artículos',
  emptyHelp: 'Cuando se cargue el primero, aparece acá.',
  noMatches: 'Ningún artículo coincide',
  noMatchesHelp: 'Probá con otro nombre, o limpiá el filtro.',
  clearFilter: 'Limpiar el filtro',

  /* La ficha, a la que se llega desde la grilla. */
  article: 'Ficha del artículo',
  reachedWith: (id: string) =>
    `Se llegó acá con el identificador ${id}, y el compilador verificó el parámetro.`,

  /* El campo del hola mundo que muestra el aviso de trabajo sin guardar. */
  note: 'Nota',
} as const
