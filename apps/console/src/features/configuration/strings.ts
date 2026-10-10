/**
 * **Todo lo que la configuración le dice al operador** (`CU-43`).
 *
 * Los rótulos de los valores son las hojas del contrato (`freshness.catalogMs`),
 * porque son los mismos en la configuración del merchant, en los defaults y en
 * el historial: un rótulo es del campo, no de la pantalla.
 */
export const configurationStrings = {
  configuration: 'Configuración',
  platform: 'Plataforma',
  defaults: 'Defaults de tratamiento',

  /* Los grupos del tratamiento, con su porqué en voz baja (`GR-24`). */
  freshnessSection: 'Frescura',
  freshnessWhy: 'Cuánto tiempo sostiene una afirmación el último dato de catálogo y de stock.',
  syncLevelSection: 'Nivel de sincronización',
  syncLevelWhy: 'Cómo se juzga la cadencia con que la tienda manda sus datos.',
  holdoutSection: 'Reparto',
  holdoutWhy: 'La parte del tráfico que queda fuera de todo experimento.',
  scopeSection: 'Dónde y qué',
  scopeWhy: 'En qué páginas puede intervenir OPE, y qué barreras puede inferir.',
  syncStrategySection: 'Sincronización por flujo',
  syncStrategyWhy: 'Cómo llega cada flujo de datos de la tienda.',
  localesSection: 'Idiomas',
  localesWhy: 'Los idiomas que sirve la tienda, y el de reserva cuando el de la página no está.',
  evidenceSection: 'Evidencia',
  evidenceWhy:
    'Qué puede citar un mensaje: la política de devoluciones, los datos de talle, atributos.',
  commercialSection: 'Política comercial',
  commercialWhy: 'El incentivo, sus escalones y sus topes, y cuántas veces se interviene.',
  decisionSection: 'Política de decisión',
  decisionWhy:
    'Las reglas con que se infiere una barrera. Se ve resumida: se edita en una feature posterior, y ' +
    'viaja intacta en cada versión.',

  /* Los valores, por su hoja en el contrato. */
  'freshness.catalogMs': 'Catálogo',
  'freshness.stockAndPriceMs': 'Stock y precio',
  'syncLevel.receiptsKept': 'Recepciones que se guardan',
  'syncLevel.noDataAfterMs': 'Sin datos después de',
  'syncLevel.minutesLevelMaxAgeMs': 'Antigüedad máxima para nivel de minutos',
  'syncLevel.minutesLevelMedianIntervalMs': 'Intervalo mediano para nivel de minutos',
  'syncLevel.minutesLevelMinReceipts': 'Recepciones mínimas para nivel de minutos',
  holdoutShare: 'Holdout',
  surfaces: 'Superficies',
  barriers: 'Barreras',
  'syncStrategy.catalog': 'Catálogo',
  'syncStrategy.stockAndPrice': 'Stock y precio',
  'syncStrategy.orders': 'Órdenes',
  'syncStrategy.returns': 'Devoluciones',
  'locales.supported': 'Soportados',
  'locales.fallback': 'De reserva',
  'evidenceProfile.returnsPolicy': 'Política de devoluciones',
  'evidenceProfile.fitData': 'Datos de talle',
  'evidenceProfile.authorizedAttributes': 'Atributos autorizados',
  'commercialPolicy.version': 'Versión de la política',
  'commercialPolicy.maxIncentiveShare': 'Techo del incentivo',
  'commercialPolicy.incentiveLadderShare': 'Escalones del incentivo',
  'commercialPolicy.marginShare': 'Margen',
  'commercialPolicy.directIncentiveOnPrice': 'Incentivo directo en precio',
  'commercialPolicy.highIntent': 'Alta intención desde',
  'commercialPolicy.abandonment': 'Ante el abandono',
  'commercialPolicy.interventionsPerSession': 'Intervenciones por sesión',
  'commercialPolicy.cooldownSeconds': 'Espera entre intervenciones',
  'commercialPolicy.interventionsPerVisitorPerDay': 'Intervenciones por visitante y día',
  'commercialPolicy.returnRisk': 'Riesgo de devolución',
  'decisionPolicy.version': 'Versión de la política',
  'decisionPolicy.threshold': 'Umbral',
  'decisionPolicy.rules': 'Reglas',

  /* Los valores de las listas cerradas del contrato. */
  product: 'Página de producto',
  cart: 'Carrito',
  fit: 'Talle',
  price: 'Precio',
  returns: 'Devoluciones',
  push: 'La tienda empuja',
  pull: 'OPE pide',
  subscribe: 'Suscripción',
  'from-cart': 'El carrito',
  'from-checkout': 'El checkout',
  never: 'Nunca',
  nothing: 'Nada',
  'reassure-returns': 'Tranquilizar sobre devoluciones',
  yes: 'Sí',
  no: 'No',

  /* Las unidades, a la vista al lado del número. */
  units: { ms: 'ms', s: 's', min: 'min', h: 'h', d: 'd' },
  percent: '%',
  rulesCount: (count: number) => (count === 1 ? '1 regla' : `${count} reglas`),
  defined: 'Definida',

  /* La configuración de un merchant (feature 008). */
  configurationTitle: (name: string) => `Configuración de ${name}`,
  versionsInForce: 'Versiones que rigen',
  versionsInForceWhy:
    'Las tres que estampa cada decisión del merchant: la de plataforma, la de los defaults y la suya.',
  platformVersion: 'Plataforma',
  defaultsVersion: 'Defaults',
  merchantVersion: 'Merchant',
  noOwnVersion: 'Sin versión propia: todo se hereda de los defaults',
  versionNumber: (version: number) => `Versión ${version}`,
  ownSection: 'Lo propio del merchant',
  ownWhy:
    'Lo que el merchant declara y no tiene default. Se ve acá; se edita en una feature posterior, y ' +
    'viaja intacto en cada versión.',
  anchors: 'Anclajes declarados',
  attributeLabels: 'Etiquetas de atributos',
  labelsCount: (count: number) => (count === 1 ? '1 etiqueta' : `${count} etiquetas`),
  backToMerchant: 'Volver a la ficha',
  merchantNotFound: 'Ese merchant no existe, o no está en tu alcance',

  /* La plataforma (feature 008): el nivel 1, igual para todos los merchants. */
  inForce: 'La versión que rige',
  platformWhy:
    'Este nivel es el mismo para todos los merchants. Cuatro de sus valores deciden qué se cuenta: ' +
    'cambiarlos con un experimento activo exige una versión correctiva.',
  versionName: 'Nombre',
  windowsRestarted: 'Mediciones reiniciadas',
  levelNotFound: 'Este nivel todavía no tiene versión',
  countingSection: 'Qué se cuenta',
  countingWhy:
    'La deduplicación, las tolerancias de reloj y la duración de la sesión: un cambio acá alcanza la ' +
    'medición de todo experimento activo.',
  windowsSection: 'Ventanas',
  windowsWhy:
    'Cuánto dura un visitante, cuánto vale una firma y cuánta gracia puede tener una rotación.',
  keptSection: 'Lo que se guarda',
  keptWhy:
    'Cuántos diagnósticos y valores sin mapear se guardan, y cuánto se sugiere esperar al reintentar.',
  'dedupWindow.ttlMs': 'Ventana de deduplicación',
  'dedupWindow.maxIds': 'Identificadores en la ventana',
  eventPastToleranceMs: 'Tolerancia hacia el pasado',
  clockSkewToleranceMs: 'Tolerancia de reloj',
  sessionDurationMs: 'Duración de la sesión',
  visitorWindowMs: 'Ventana del visitante',
  signatureWindowMs: 'Ventana de firma',
  rotationGraceMaxMs: 'Gracia máxima de rotación',
  anchorDiagnosticsKept: 'Diagnósticos de anclaje guardados',
  unmappedValuesKept: 'Valores sin mapear guardados',
  retryAfterSeconds: 'Reintento sugerido',

  /* De dónde sale un valor. */
  declared: 'Declarado por el merchant',
  inherited: (defaults: string) => `Heredado de ${defaults}`,
} as const
