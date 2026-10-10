/**
 * **Lo que dicen los componentes compartidos de la consola** (`CU-43`).
 *
 * Un componente de acá no puede importar el catálogo de una funcionalidad
 * (`components` no mira a `features`), así que lo que dice vive acá.
 */
export const sharedStrings = {
  /** La hora de un instante, en UTC y dicho así: granito formatea fechas, no instantes. */
  timeUtc: (time: string) => ` ${time} UTC`,

  /* El historial de versiones de un nivel de configuración (feature 008). */
  versions: 'Versiones',
  versionsCaption: 'Versiones publicadas, la más nueva primero',
  version: 'Versión',
  publishedAtUtc: 'Publicada (UTC)',
  operator: 'Operador',
  kind: 'Tipo',
  corrective: 'Correctiva',
  regular: 'Normal',
  reason: 'Motivo',
  noVersions: 'Todavía no hay versiones',
  noVersionsHelp: 'Cada versión que se publique aparece acá, con quién la publicó y por qué.',
  openVersion: 'Ver la versión',

  /* La versión correctiva, cuando hay una medición en curso (feature 008). */
  correctiveSection: 'Versión correctiva',
  correctiveWhy:
    'Hay un experimento activo que este cambio alcanza: sólo se acepta como correctiva, con su motivo, ' +
    'y reinicia la ventana de medición del experimento.',
  correctiveMark: 'Publicar como correctiva',
  reasonLabel: 'Motivo',
  reasonHelp: 'Queda en el historial y en el registro de administración.',
} as const
