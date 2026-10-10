import { configurationStrings } from '../strings'
import type { PlatformLeaf } from './units'

/** Una hoja de la plataforma que la pantalla muestra y edita, y que el catálogo rotula. */
export type PlatformField = PlatformLeaf & keyof typeof configurationStrings

/**
 * **Los valores de la plataforma, en sus grupos** (data-model §2).
 *
 * Todos se editan. Los cuatro primeros deciden **qué se cuenta** —la ventana de
 * deduplicación, las dos tolerancias de reloj y cuánto dura una sesión—, y por
 * eso van juntos y su sección lo dice: un cambio ahí alcanza la medición de todo
 * experimento activo.
 */
export const PLATFORM_GROUPS: readonly {
  readonly title: string
  readonly why: string
  readonly leaves: readonly PlatformField[]
}[] = [
  {
    title: configurationStrings.countingSection,
    why: configurationStrings.countingWhy,
    leaves: [
      'dedupWindow.ttlMs',
      'dedupWindow.maxIds',
      'eventPastToleranceMs',
      'clockSkewToleranceMs',
      'sessionDurationMs',
    ],
  },
  {
    title: configurationStrings.windowsSection,
    why: configurationStrings.windowsWhy,
    leaves: ['visitorWindowMs', 'signatureWindowMs', 'rotationGraceMaxMs'],
  },
  {
    title: configurationStrings.keptSection,
    why: configurationStrings.keptWhy,
    leaves: ['anchorDiagnosticsKept', 'unmappedValuesKept', 'retryAfterSeconds'],
  },
]
