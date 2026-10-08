/**
 * **Lo que el marco le dice al operador** (`CU-27`, `CU-42`).
 *
 * Son los textos de las piezas que publica cuarzo —los siete estados de sesión,
 * el arranque, la barra de usuario—, **no los de las pantallas**: una pantalla
 * escribe los suyos, donde ya declara su título y su ruta.
 *
 * Existe por tres razones concretas, y ninguna es el idioma:
 *
 * - **Se pueden reemplazar por aplicación.** El punto de venta de un mostrador
 *   no dice lo mismo que el panel de administración, y hoy cambiar una frase
 *   obligaba a reemplazar la vista entera.
 * - **Se pueden leer juntos.** Todo lo que la aplicación le dice al operador en
 *   un archivo, en vez de repartido en seis.
 * - **Dejan de separarse solos.** Con las frases sueltas convivían «Volver a
 *   entrar» y «Hay que volver a entrar» para el mismo concepto.
 *
 * **No hay segundo idioma, y por eso no hay `i18n`.** Un catálogo tipado da lo
 * que hace falta sin una dependencia nueva, sin formato de mensajes y —lo que
 * importa acá— sin carga asíncrona: un catálogo que se busca por red mete un
 * estado «cargando textos» en el arranque, justo donde `CU-9` pide que no haya
 * destellos.
 *
 * **Lo que NO entra**: los mensajes de `throw`. Los lee un desarrollador, no un
 * operador. Meterlos acá los hace parecer texto de interfaz y los pone a
 * competir por redacción con lo que sí lo es.
 */

export type Strings = {
  /* La sesión — los siete estados de `001` */
  noSession: string
  noSessionDetail: string
  unauthorized: string
  unauthorizedDetail: string
  sessionEnded: string
  /** Cuando volvió otra persona: se descarta todo lo anterior (`CU-26`). */
  sessionEndedOtherSubject: string
  sessionEndedDetail: string
  /** El backend dejó de reconocer la credencial en vuelo (`token-rejected`). */
  sessionEndedTokenRejected: string
  reload: string

  /* El ingreso con credencial — la vista de `anonymous` cuando el adaptador tiene entrada */
  signInTitle: string
  signInDetail: string
  credentialLabel: string
  signIn: string
  /** El backend no reconoció la credencial. No hubo pedido con texto del servidor: lo dice el marco. */
  signInRejected: string
  resolvingSession: string
  reenterTitle: string
  reenterWaitingDetail: string
  reenterFailedDetail: string
  reenter: string
  waiting: string
  forbidden: string
  forbiddenDetail: string

  /* El arranque */
  cannotStart: string
  missingConfig: string
  missingConfigWhy: string
  noHomeDeclared: string
  noHomeDeclaredDetail: string

  /* El resultado de una consulta — los cuatro estados de `CU-24` */
  loading: string
  loadFailed: string
  retry: string
  /** Precede al identificador del pedido. Es lo que el operador cita (`CU-25`). */
  requestIdLabel: string
  /**
   * Cuando el servidor no mandó identificador.
   *
   * **Se dice, no se rellena**: un hueco se lee como un olvido nuestro, y un
   * texto inventado se cita como si sirviera. OPE lo agrega en su feature 040.
   */
  noRequestId: string

  /* Una colección por cursor — `ADR-020` del backend, `OW-4` */
  loadMore: string
  /** «N cargados». Sin total, porque el contrato no lo da. */
  loadedCount: (loaded: number) => string
  noMore: string

  /* Salir con trabajo sin guardar — `CU-47` */
  /**
   * **Pregunta por lo que se pierde, no por lo que se hace.**
   *
   * «¿Salir?» obliga al operador a acordarse de qué estaba escribiendo; decirlo
   * en el título es lo que le deja contestar sin pensarlo dos veces.
   */
  unsavedTitle: string
  unsavedDescription: string
  /**
   * Los cinco del conflicto (`CU-29`).
   *
   * **La descripción no puede prometer quién escribió.** Con el legacy
   * escribiendo sobre la misma base, el cambio puede no venir de nadie del
   * panel — decir «otro operador» sería afirmar algo que no se sabe, y el día
   * que un operador vaya a preguntarle a un compañero que no tocó nada, el
   * aviso perdió la confianza que necesita para servir.
   */
  conflictTitle: string
  conflictDescription: string
  conflictConfirm: string
  conflictWhenOpened: string
  conflictNow: string
  /**
   * El verbo, y **es el de la consecuencia**: «Descartar», no «Aceptar».
   * Granito lo pide escrito por la misma razón —«Aceptar» no dice qué va a
   * pasar.
   */
  unsavedConfirm: string
  unsavedCancel: string

  /* Lo que dice una acción — `CU-25` */
  /** Lo que se dice cuando la acción no declaró qué anuncia. */
  actionDone: string
  /**
   * Cuando una pantalla revienta (`CU-30`).
   *
   * **No dice qué falló**: quien lo lee no puede hacer nada con eso, y el
   * detalle técnico va al registro, donde sí sirve.
   */
  /**
   * Cuando la URL no corresponde a ninguna pantalla.
   *
   * **No dice «404»**: es el nombre del código de un protocolo, y quien lo lee
   * está buscando un artículo, no depurando.
   */
  unknownRoute: string
  unknownRouteDetail: string
  screenFailed: string
  screenFailedDetail: string
  actionFailed: string
  /**
   * Cuando el servidor **contestó que no** (`CU-25`).
   *
   * No es lo mismo que una falla: el sistema funcionó, y lo que hay es una
   * regla. El motivo lo escribe el servidor; esto es sólo el encabezado.
   */
  actionRejected: string
  /**
   * Cuando no hubo servidor: red cortada, backend caído.
   *
   * **No hay `message` que mostrar** —no llegó a haber pedido—, así que el
   * texto es del marco. Sin esto, lo que ve un operador de mostrador es
   * `TypeError: Failed to fetch`.
   */
  serverUnreachable: string
  /**
   * **Cuando el servidor rechaza algo que el formulario no puede mostrar**
   * (`CU-49`).
   *
   * `fields` es una promesa: cada entrada tiene un control en la pantalla donde
   * se corrige, y la puerta se apoya en ella **para callarse**. Cuando la
   * promesa no se cumple, el rechazo no se ve en ningún lado: ni aviso, ni campo
   * marcado, y el botón se vuelve a encender.
   *
   * Esto es lo que aparece en su lugar. **No le pide nada al operador** —no hay
   * nada que pueda hacer— y lleva el identificador, que es lo único con lo que
   * alguien puede llegar a la causa.
   */
  rejectedOffForm: string
  rejectedOffFormDetail: (fields: string) => string

  /* El marco y la barra de usuario */
  signOut: string
  noName: string
  /** El rótulo accesible de la zona donde aterrizan los avisos (`CU-25`). */
  notices: string
  showTooltips: string
  hideTooltips: string
}

/**
 * Los que trae puestos.
 *
 * Si una aplicación no declara ninguno, dice esto — que es castellano
 * rioplatense y habla de lo que el operador ve, no de lo que pasó adentro.
 */
export const DEFAULT_STRINGS: Strings = {
  noSession: 'No hay sesión',
  noSessionDetail: 'Se va al proveedor de identidad.',
  unauthorized: 'Sin permisos en esta aplicación',
  unauthorizedDetail:
    'La sesión es válida, pero no habilita nada acá. Hay que pedirle acceso a quien administra los permisos.',
  sessionEnded: 'La sesión terminó',
  sessionEndedOtherSubject: 'Volvió otra persona, así que se descarta todo lo anterior.',
  sessionEndedDetail: 'Hay que recargar para volver a empezar.',
  sessionEndedTokenRejected:
    'El sistema dejó de reconocer la credencial. Hay que volver a entrar con una vigente.',
  reload: 'Recargar',

  signInTitle: 'Entrar',
  signInDetail: 'Escribí la credencial de operador que te entregaron.',
  credentialLabel: 'Credencial',
  signIn: 'Entrar',
  signInRejected: 'El sistema no reconoce esa credencial.',
  resolvingSession: 'Resolviendo la sesión',
  reenterTitle: 'Hay que volver a entrar',
  reenterWaitingDetail:
    'Se abrió una ventana para entrar. Si se cierra sin entrar, o pasa demasiado tiempo, hay que empezar de nuevo.',
  reenterFailedDetail: 'La sesión no se pudo renovar. Lo que está en pantalla sigue acá.',
  reenter: 'Volver a entrar',
  waiting: 'Esperando…',
  forbidden: 'Esta pantalla no está habilitada para esta sesión',
  forbiddenDetail: 'La dirección existe, pero la sesión no tiene la capacidad que exige.',

  cannotStart: 'La aplicación no puede arrancar',
  missingConfig: 'Falta configuración en /config.json:',
  missingConfigWhy: 'El porqué de no arrancar con valores por omisión está en CU-17.',
  noHomeDeclared: 'No hay pantalla de inicio',
  noHomeDeclaredDetail:
    'Ninguna pantalla declaró la ruta raíz. Se llega a las demás desde el menú.',

  loading: 'Buscando',
  loadFailed: 'No se pudieron traer los datos',
  retry: 'Reintentar',
  requestIdLabel: 'Identificador del pedido',
  noRequestId: 'sin identificador',

  loadMore: 'Cargar más',
  loadedCount: (loaded: number) => (loaded === 1 ? '1 cargado' : `${loaded} cargados`),
  noMore: 'No hay más',

  conflictTitle: 'El registro cambió mientras lo editabas',
  conflictDescription:
    'Estos campos que tocaste también cambiaron. Lo que escribiste no se perdió: revisalo y volvé a guardar si corresponde.',
  conflictConfirm: 'Seguir editando',
  conflictWhenOpened: 'Al abrir:',
  conflictNow: 'Ahora:',
  unsavedTitle: 'Hay cambios sin guardar',
  unsavedDescription: 'Si salís ahora se pierden. Podés quedarte y guardarlos.',
  unsavedConfirm: 'Salir y descartar',
  unsavedCancel: 'Quedarme',

  actionDone: 'Listo',
  unknownRoute: 'Esa dirección no existe',
  unknownRouteDetail:
    'Puede ser un enlace viejo, o que la pantalla haya cambiado de lugar. Elegí una del menú.',
  screenFailed: 'Esta pantalla no se pudo mostrar',
  screenFailedDetail:
    'Se puede volver a intentar, o ir a otra desde el menú. Si vuelve a pasar, mencioná este identificador.',
  actionFailed: 'No se pudo completar',
  actionRejected: 'No se puede hacer eso',
  serverUnreachable:
    'No se pudo llegar al servidor. Puede ser la red, o que el sistema esté caído.',
  rejectedOffForm: 'El servidor rechazó algo que esta pantalla no muestra',
  rejectedOffFormDetail: (fields: string) =>
    `No se guardó. Mencioná esto al reportarlo: ${fields}.`,

  signOut: 'Cerrar sesión',
  noName: 'Sin nombre',
  notices: 'Avisos',
  showTooltips: 'Mostrar globos de ayuda',
  hideTooltips: 'Ocultar globos de ayuda',
}
