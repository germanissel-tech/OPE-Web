import { describe, expect, it } from 'vitest'
import type {
  PlatformConfigurationContent,
  TreatmentDefaultsContent,
} from '../../../api/ope/client'
import {
  defaultsBodyOf,
  defaultsConstraints,
  defaultsFormOf,
  platformBodyOf,
  platformConstraints,
  platformFormOf,
} from './level-body'

/**
 * **El cuerpo de una versión global** (research §7, data-model §3).
 *
 * Publicar sin tocar nada manda exactamente lo que rige —todo es propio, no
 * hay herencia—; en los defaults, la política de decisión y el riesgo de
 * devolución viajan idénticos aunque no pasen por el formulario.
 */

const platform: PlatformConfigurationContent = {
  dedupWindow: { ttlMs: 86400000, maxIds: 100000 },
  eventPastToleranceMs: 86400000,
  clockSkewToleranceMs: 300000,
  sessionDurationMs: 1800000,
  visitorWindowMs: 86400000,
  signatureWindowMs: 300000,
  rotationGraceMaxMs: 604800000,
  anchorDiagnosticsKept: 200,
  unmappedValuesKept: 200,
  retryAfterSeconds: 5,
}

const defaults: TreatmentDefaultsContent = {
  freshness: { catalogMs: 129600000, stockAndPriceMs: 600000 },
  syncLevel: {
    receiptsKept: 8,
    noDataAfterMs: 129600000,
    minutesLevelMaxAgeMs: 3600000,
    minutesLevelMedianIntervalMs: 900000,
    minutesLevelMinReceipts: 3,
  },
  holdoutShare: 0.05,
  decisionPolicy: {
    version: 'decision-default-1',
    rules: [
      {
        id: 'price.read',
        barrier: 'price',
        strength: 'strong',
        when: { fact: 'dwellSeconds', block: 'price' },
      },
    ],
    weights: { strong: 0.4, supporting: 0.2 },
    readingSeconds: 5,
    threshold: 0.7,
    priority: ['returns', 'fit', 'price'],
    evidence: { freshStockAndPrice: ['price'], availableVariant: ['fit'] },
  },
  commercialPolicy: {
    version: 'commercial-default-1',
    maxIncentiveShare: 0.1,
    incentiveLadderShare: [0.05, 0.1],
    directIncentiveOnPrice: true,
    returnRisk: { fact: 'dwellSeconds', block: 'policies' },
    highIntent: 'from-checkout',
    abandonment: 'reassure-returns',
    interventionsPerSession: 1,
    cooldownSeconds: 0,
    interventionsPerVisitorPerDay: 3,
  },
  evidenceProfile: { returnsPolicy: false, fitData: false, authorizedAttributes: [] },
  surfaces: ['product', 'cart'],
  barriers: ['fit', 'price', 'returns'],
  syncStrategy: { catalog: 'push', stockAndPrice: 'push', orders: 'push', returns: 'push' },
  locales: { supported: ['es-AR'], fallback: 'es-AR' },
}

describe('el cuerpo de una versión de la plataforma', () => {
  it('sin tocar nada, es lo que rige', () => {
    const { values, shown } = platformFormOf(platform)
    expect(platformBodyOf(values, shown)).toEqual({ content: platform })
  })

  it('cada número se carga en su unidad y vuelve exacto', () => {
    const { values, shown } = platformFormOf(platform)
    expect(values['content.sessionDurationMs']).toBe('30')
    expect(values['content.rotationGraceMaxMs']).toBe('7')
    const body = platformBodyOf({ ...values, 'content.sessionDurationMs': '45' }, shown)
    expect(body.content.sessionDurationMs).toBe(2700000)
  })

  it('todo valor es obligatorio, y el motivo sólo con la correctiva', () => {
    const { values, shown } = platformFormOf(platform)
    const required = platformConstraints(values, shown).required
    expect(required).toContain('content.dedupWindow.ttlMs')
    expect(required).not.toContain('reason')
    expect(platformConstraints({ ...values, corrective: 'true' }, shown).required).toContain(
      'reason',
    )
  })
})

describe('el cuerpo de una versión de los defaults', () => {
  it('sin tocar nada, es lo que rige', () => {
    const { values, shown } = defaultsFormOf(defaults)
    expect(defaultsBodyOf(values, shown, defaults)).toEqual({ content: defaults })
  })

  it('la política de decisión y el riesgo de devolución viajan idénticos', () => {
    const { values, shown } = defaultsFormOf(defaults)
    const body = defaultsBodyOf({ ...values, 'content.holdoutShare': '10' }, shown, defaults)
    expect(body.content.holdoutShare).toBe(0.1)
    expect(body.content.decisionPolicy).toBe(defaults.decisionPolicy)
    expect(body.content.commercialPolicy.returnRisk).toBe(defaults.commercialPolicy.returnRisk)
  })

  it('una lista obligatoria no se exige por su nombre, que lleva texto vacío', () => {
    const { values, shown } = defaultsFormOf(defaults)
    expect(values['content.evidenceProfile.authorizedAttributes']).toBe('')
    const required = defaultsConstraints(values, shown).required
    expect(required).not.toContain('content.evidenceProfile.authorizedAttributes')
    expect(required).not.toContain('content.surfaces')
    expect(required).not.toContain('content.decisionPolicy')
    expect(required).toContain('content.holdoutShare')
  })

  it('correctiva lleva su motivo', () => {
    const { values, shown } = defaultsFormOf(defaults)
    expect(
      defaultsBodyOf({ ...values, corrective: 'true', reason: 'Why' }, shown, defaults),
    ).toMatchObject({ corrective: true, reason: 'Why' })
  })
})
