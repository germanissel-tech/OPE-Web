// @vitest-environment jsdom
import {
  ApplicationView,
  closes,
  createApplication,
  createQueryClient,
  defineFlow,
  defineScreen,
  finishes,
  NoticesProvider,
  opens,
  outcome,
  QueryProvider,
  RequestFailed,
  ServicesProvider,
  StringsProvider,
  TelemetryProvider,
} from '@ope/core'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { sharedStrings } from '../../../components/strings'
/* Lo de `api/` llega por `data/`, que es lo único que puede tocarla (`CU-15`). */
import {
  type MerchantConfiguration,
  type MerchantConfigurationVersion,
  type OpeClient,
  opeService,
} from '../data/merchant-configuration'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'

/**
 * **Con qué se sirve a un merchant, y de dónde sale cada valor** (feature 008,
 * escenarios 1, 2 y 7), montada en la aplicación de verdad contra un servicio
 * `ope` de mentira.
 *
 * Lo que se afirma es lo que no se ve con todo heredado: que un valor declarado
 * lo dice, que uno heredado nombra los defaults de los que sale, que una tasa se
 * lee en porcentaje y una duración en su unidad, y que sin versión propia se
 * dice en vez de mostrar un número.
 */

afterEach(cleanup)

/* La primera es la plataforma, que es la raíz; después la vista y la publicación del merchant. */
const [, merchantConfigurationScreen, publishMerchantConfigurationScreen] = configuration.screens
/** La versión del merchant, por su id: sólo `feature.ts` y `app/flows.ts` nombran pantallas (`CU-47`). */
const merchantVersionScreen = (() => {
  const found = configuration.screens.find((each) => each.id === 'merchantVersion')
  if (found === undefined) throw new Error('sin la versión del merchant')
  return found
})()

const effective: MerchantConfiguration['effective'] = {
  freshness: { catalogMs: 129600000, stockAndPriceMs: 600000 },
  syncLevel: {
    receiptsKept: 8,
    noDataAfterMs: 129600000,
    minutesLevelMaxAgeMs: 3600000,
    minutesLevelMedianIntervalMs: 900000,
    minutesLevelMinReceipts: 3,
  },
  holdoutShare: 0.07,
  decisionPolicy: {
    version: 'default-1',
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
    threshold: 0.6,
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
  locales: { supported: ['es-AR', 'en'], fallback: 'es-AR' },
  platform: {
    version: 'platform-2',
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
  },
}

const declaredHoldout: MerchantConfiguration = {
  effective,
  declared: { holdoutShare: 0.07, anchors: { price: { selectors: ['.price'] } } },
  versions: { platform: 'platform-2', defaults: 'defaults-1', merchant: 3 },
}

const nothingDeclared: MerchantConfiguration = {
  effective,
  declared: {},
  versions: { platform: 'platform-2', defaults: 'defaults-1' },
}

const v3: MerchantConfigurationVersion = {
  version: 3,
  declared: declaredHoldout.declared,
  corrective: true,
  reason: 'Experiment restarted on purpose.',
  publishedAt: '2026-10-09T12:00:00Z',
  operatorId: 'ops-1',
  windowsRestarted: ['exp_spring'],
}

/** Cuántas veces se recorrió el historial: abrir una versión por número no lo recorre (research §6). */
const calls = { listConfigurationVersions: 0 }

function ope(served: MerchantConfiguration, versions: readonly MerchantConfigurationVersion[]) {
  const no = () => {
    throw new Error('no se prueba acá')
  }
  const client: OpeClient = {
    listMerchants: no,
    async getMerchant() {
      return {
        witness: '"w-1"',
        merchantId: 'mrc_conf',
        status: 'active',
        origins: ['https://conf.example'],
        createdAt: '2026-10-09T12:00:00Z',
        credentials: [],
        displayName: 'Tienda Conf',
      }
    },
    createMerchant: no,
    deactivateMerchant: no,
    rotateIngestKey: no,
    rotatePlatformKey: no,
    rotatePlatformSecret: no,
    setKillSwitch: no,
    updateMerchantProfile: no,
    listMerchantAdminLog: no,
    async getMerchantConfiguration() {
      return { ...served, witness: '"w-1"' }
    },
    async listConfigurationVersions() {
      calls.listConfigurationVersions += 1
      return { items: [...versions] }
    },
    async getMerchantConfigurationVersion(_merchantId, version) {
      const found = versions.find((each) => each.version === version)
      if (found !== undefined) return found
      throw new RequestFailed({
        status: 404,
        type: 'configuration-version-not-found',
        title: 'The configuration version does not exist',
      })
    },
    publishMerchantConfiguration: no,
    getPlatformConfiguration: no,
    listPlatformConfigurationVersions: no,
    getPlatformConfigurationVersion: no,
    publishPlatformConfiguration: no,
    getTreatmentDefaults: no,
    listTreatmentDefaultsVersions: no,
    getTreatmentDefaultsVersion: no,
    publishTreatmentDefaults: no,
  }
  return client
}

/**
 * **La ficha de mentira desde la que se llega.** En la aplicación es la del
 * merchant, que es de otra funcionalidad y se compone en `app/`; acá alcanza con
 * una pantalla sin parámetros que sea la raíz del flujo y a la que se vuelva.
 */
const hostScreen = defineScreen({
  id: 'host',
  title: 'Host',
  path: '/host',
  component: () => null,
})
const opened = outcome<{ merchantId: string }>('test.configurationOpened')

let mounted: ReturnType<typeof createApplication> | undefined

async function mount(client: OpeClient, capabilities: readonly string[]) {
  const flow = defineFlow({
    id: 'configuration',
    root: hostScreen,
    steps: [
      opens(opened, merchantConfigurationScreen, ({ merchantId }) => ({ merchantId })),
      finishes(configuration.outcomes.merchantConfigurationClosed, hostScreen),
      opens(
        configuration.outcomes.merchantPublishRequested,
        publishMerchantConfigurationScreen,
        ({ merchantId }) => ({ merchantId }),
      ),
      finishes(
        configuration.outcomes.merchantConfigurationPublished,
        merchantConfigurationScreen,
        ({ merchantId }) => ({ merchantId }),
      ),
      closes(configuration.outcomes.merchantPublishCancelled),
      opens(
        configuration.outcomes.merchantVersionChosen,
        merchantVersionScreen,
        ({ merchantId, version }) => ({ merchantId, version }),
      ),
      closes(configuration.outcomes.versionClosed),
    ],
  })
  const application = createApplication(
    {
      name: 'console',
      screens: [
        hostScreen,
        merchantConfigurationScreen,
        publishMerchantConfigurationScreen,
        merchantVersionScreen,
      ],
      flows: [flow],
      menu: [],
      featureRootOf: {
        host: 'host',
        merchantConfiguration: 'host',
        publishMerchantConfiguration: 'host',
        merchantVersion: 'host',
      },
      outcomesOf: {
        host: [opened.id],
        merchantConfiguration: [
          configuration.outcomes.merchantConfigurationClosed.id,
          configuration.outcomes.merchantPublishRequested.id,
          configuration.outcomes.merchantVersionChosen.id,
        ],
        merchantVersion: [configuration.outcomes.versionClosed.id],
        publishMerchantConfiguration: [
          configuration.outcomes.merchantConfigurationPublished.id,
          configuration.outcomes.merchantPublishCancelled.id,
        ],
      },
      outcomes: [opened, ...Object.values(configuration.outcomes)],
      toCapabilities: () => new Set(capabilities),
      systems: ['ope'],
    },
    ({ children }: { readonly children: ReactNode }) => <>{children}</>,
  )

  await act(async () => {
    await application.router.navigate('/merchants/mrc_conf/configuration')
  })
  mounted = application

  render(
    <QueryProvider client={createQueryClient()}>
      <StringsProvider>
        <TelemetryProvider
          value={{ port: { record: () => {} }, app: 'console', version: 'v0', envelope: {} }}
        >
          <NoticesProvider>
            <ServicesProvider services={[opeService(client)]}>
              <ApplicationView
                application={application}
                status="active"
                capabilities={new Set(capabilities)}
                endReason={undefined}
                reenter={() => {}}
                signIn={undefined}
                userCaption={undefined}
                waitThresholdMs={0}
              />
            </ServicesProvider>
          </NoticesProvider>
        </TelemetryProvider>
      </StringsProvider>
    </QueryProvider>,
  )
}

/** El campo de un rótulo, para leer su valor y lo que dice debajo. */
const fieldOf = (label: string, at = 0) => {
  const labels = screen.getAllByText(label, { selector: 'label' })
  const field = labels[at]?.closest('.granito-field')
  if (!(field instanceof HTMLElement)) throw new Error(`sin campo para «${label}»`)
  return field
}

describe('la configuración de un merchant', () => {
  it('dice las tres versiones, y de dónde sale cada valor', async () => {
    await mount(ope(declaredHoldout, [v3]), ['configuration:read'])
    await screen.findByText(configurationStrings.versionNumber(3))

    expect(screen.getByText('platform-2')).toBeDefined()
    const holdout = fieldOf(configurationStrings.holdoutShare)
    expect(within(holdout).getByText('7 %')).toBeDefined()
    expect(within(holdout).getByText(configurationStrings.declared)).toBeDefined()

    /* «Catálogo» rotula dos valores: la frescura va primero. */
    const catalog = fieldOf(configurationStrings['freshness.catalogMs'])
    expect(within(catalog).getByText('36 h')).toBeDefined()
    expect(within(catalog).getByText(configurationStrings.inherited('defaults-1'))).toBeDefined()
  })

  it('lo complejo se ve resumido, y lo propio del merchant también', async () => {
    await mount(ope(declaredHoldout, [v3]), ['configuration:read'])
    await screen.findByText(configurationStrings.versionNumber(3))

    expect(screen.getByText(configurationStrings.rulesCount(1))).toBeDefined()
    expect(screen.getByText('price')).toBeDefined()
    expect(screen.getByText(configurationStrings.labelsCount(0))).toBeDefined()
  })

  it('sin versión propia lo dice, y todo es heredado', async () => {
    await mount(ope(nothingDeclared, []), ['configuration:read'])
    await screen.findByText(configurationStrings.noOwnVersion)

    expect(screen.queryByText(configurationStrings.declared)).toBeNull()
    /* El historial llega aparte de la configuración: se espera su estado vacío. */
    expect(await screen.findByText(sharedStrings.noVersions)).toBeDefined()
  })

  it('el historial muestra la versión correctiva con su motivo', async () => {
    await mount(ope(declaredHoldout, [v3]), ['configuration:read'])
    await screen.findByText('Experiment restarted on purpose.')
    expect(screen.getByText(sharedStrings.corrective)).toBeDefined()
  })

  it('el historial dice qué medición reinició cada versión (feature 009)', async () => {
    await mount(ope(declaredHoldout, [v3]), ['configuration:read'])
    await screen.findByText('Experiment restarted on purpose.')
    expect(screen.getByText(configurationStrings.windowsRestarted)).toBeDefined()
    expect(screen.getByText('exp_spring')).toBeDefined()
  })

  it('una versión del historial se abre: lo que declaraba, y lo demás heredado', async () => {
    await mount(ope(declaredHoldout, [v3]), ['configuration:read'])
    await screen.findByText('Experiment restarted on purpose.')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: sharedStrings.openVersion }))
    })

    calls.listConfigurationVersions = 0
    await screen.findByText(configurationStrings.versionSection)
    expect(mounted?.router.state.location.pathname).toBe(
      '/merchants/mrc_conf/configuration/versions/3',
    )
    /* Por número, en una petición: el historial no se recorre (feature 009). */
    expect(calls.listConfigurationVersions).toBe(0)
    expect(
      within(fieldOf(configurationStrings.windowsRestarted)).getByText('exp_spring'),
    ).toBeDefined()
    expect(
      within(fieldOf(sharedStrings.reason)).getByText('Experiment restarted on purpose.'),
    ).toBeDefined()
    const holdout = fieldOf(configurationStrings.holdoutShare)
    expect(within(holdout).getByText('7 %')).toBeDefined()
    expect(within(holdout).queryByText(configurationStrings.inheritedThen)).toBeNull()
    /* Lo que no declaraba no se inventa: se dice heredado, sin valor. */
    const catalog = fieldOf(configurationStrings['freshness.catalogMs'])
    expect(within(catalog).getByText(configurationStrings.inheritedThen)).toBeDefined()
    expect(within(catalog).queryByText('36 h')).toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: configurationStrings.back }))
    })
    await waitFor(() =>
      expect(mounted?.router.state.location.pathname).toBe('/merchants/mrc_conf/configuration'),
    )
  })

  it('un número que el merchant no publicó dice que esa versión no existe', async () => {
    await mount(ope(declaredHoldout, [v3]), ['configuration:read'])
    await act(async () => {
      await mounted?.router.navigate('/merchants/mrc_conf/configuration/versions/7')
    })
    expect(await screen.findByText(configurationStrings.versionNotFound)).toBeDefined()
  })

  it('sin configuration:read la ruta no muestra la configuración', async () => {
    await mount(ope(declaredHoldout, [v3]), ['merchants:read'])
    await act(async () => {})
    expect(screen.queryByText(configurationStrings.versionsInForce)).toBeNull()
  })
})
