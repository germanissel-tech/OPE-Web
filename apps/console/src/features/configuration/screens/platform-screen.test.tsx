// @vitest-environment jsdom
import {
  ApplicationView,
  closes,
  createApplication,
  createQueryClient,
  defineFlow,
  finishes,
  NoticesProvider,
  omits,
  opens,
  QueryProvider,
  RequestFailed,
  ServicesProvider,
  StringsProvider,
  TelemetryProvider,
  useNoticeHost,
} from '@ope/core'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { type ReactNode, useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { sharedStrings } from '../../../components/strings'
/* Lo de `api/` llega por `data/`, que es lo único que puede tocarla (`CU-15`). */
import {
  ALL_MERCHANTS,
  type PlatformConfigurationContent,
  type PlatformConfigurationInput,
  type PlatformConfigurationVersion,
  type TreatmentDefaultsContent,
  type TreatmentDefaultsInput,
  type TreatmentDefaultsVersion,
} from '../data/levels'
import { type OpeClient, opeService } from '../data/merchant-configuration'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'

/**
 * **Los niveles globales** (feature 008, escenarios 4 y 5): la plataforma y
 * los defaults, vistos, recorridos y publicados, montados en la aplicación de
 * verdad contra un servicio `ope` de mentira.
 *
 * Lo que se afirma es lo que no se ve con permisos completos y un cambio
 * feliz: que con alcance acotado no hay «publicar», que el aviso nombra las
 * mediciones que se reiniciaron, que un `409` pasa a correctiva sin perder lo
 * cargado, y que lo que los defaults no editan viaja idéntico.
 */

afterEach(cleanup)

/** Una pantalla de la funcionalidad, por su id: sólo `feature.ts` y `app/flows.ts` las nombran (`CU-47`). */
const screenOf = (id: string) => {
  const found = configuration.screens.find((each) => each.id === id)
  if (found === undefined) throw new Error(`sin pantalla «${id}»`)
  return found
}

const platformScreen = screenOf('platform')
const defaultsScreen = screenOf('defaults')
const publishPlatformScreen = screenOf('publishPlatform')
const publishDefaultsScreen = screenOf('publishDefaults')
const levelVersionScreen = screenOf('levelVersion')

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

const platformVersion = (
  version: number,
  extra: Partial<PlatformConfigurationVersion> = {},
): PlatformConfigurationVersion => ({
  version,
  stampedAs: `platform-${version}`,
  content: platform,
  corrective: false,
  publishedAt: '2026-10-10T12:00:00Z',
  operatorId: 'ops-1',
  ...extra,
})

const defaultsVersion = (version: number): TreatmentDefaultsVersion => ({
  version,
  stampedAs: `defaults-${version}`,
  content: defaults,
  corrective: false,
  publishedAt: '2026-10-10T12:00:00Z',
  operatorId: 'ops-1',
})

type Answer<T> = T | RequestFailed

function answerAt<T>(queue: readonly Answer<T>[] | undefined, at: number): T {
  const next = queue?.[at]
  if (next === undefined) throw new Error('sin respuesta preparada')
  if (next instanceof RequestFailed) throw next
  return next
}

function ope(answers: {
  readonly platform?: readonly Answer<PlatformConfigurationVersion>[]
  readonly defaults?: readonly Answer<TreatmentDefaultsVersion>[]
}) {
  const sentPlatform: PlatformConfigurationInput[] = []
  const sentDefaults: TreatmentDefaultsInput[] = []
  const no = () => {
    throw new Error('no se prueba acá')
  }
  const history = [
    platformVersion(2, {
      corrective: true,
      reason: 'Session length fixed.',
      windowsRestarted: ['exp_dev_000001'],
    }),
  ]
  const client: OpeClient = {
    listMerchants: no,
    getMerchant: no,
    createMerchant: no,
    deactivateMerchant: no,
    rotateIngestKey: no,
    rotatePlatformKey: no,
    rotatePlatformSecret: no,
    setKillSwitch: no,
    updateMerchantProfile: no,
    listMerchantAdminLog: no,
    getMerchantConfiguration: no,
    listConfigurationVersions: no,
    getMerchantConfigurationVersion: no,
    publishMerchantConfiguration: no,
    async getPlatformConfiguration() {
      return { version: 'platform-2', ...platform, witness: '"w-1"' }
    },
    async listPlatformConfigurationVersions() {
      return { items: history }
    },
    async getPlatformConfigurationVersion(version) {
      const found = history.find((each) => each.version === version)
      if (found === undefined) throw new Error('sin versión')
      return found
    },
    async publishPlatformConfiguration(body) {
      sentPlatform.push(body)
      return answerAt(answers.platform, sentPlatform.length - 1)
    },
    async getTreatmentDefaults() {
      return { version: 'defaults-1', ...defaults, witness: '"w-1"' }
    },
    async listTreatmentDefaultsVersions() {
      return { items: [defaultsVersion(1)] }
    },
    getTreatmentDefaultsVersion: no,
    async publishTreatmentDefaults(body) {
      sentDefaults.push(body)
      return answerAt(answers.defaults, sentDefaults.length - 1)
    },
  }
  return { client, sentPlatform, sentDefaults }
}

const noticed: ReturnType<typeof useNoticeHost>['notifications'][number][] = []

function NoticeProbe() {
  const { notifications } = useNoticeHost()
  useEffect(() => {
    noticed.push(...notifications)
  }, [notifications])
  return null
}

/** Los dos recorridos globales, como los compone `app/flows.ts`. */
function flows() {
  const versionSteps = [
    opens(configuration.outcomes.levelVersionChosen, levelVersionScreen, ({ level, version }) => ({
      level,
      version,
    })),
    closes(configuration.outcomes.versionClosed),
  ]
  return [
    defineFlow({
      id: 'configuration',
      root: platformScreen,
      steps: [
        opens(configuration.outcomes.platformPublishRequested, publishPlatformScreen),
        finishes(configuration.outcomes.platformPublished, platformScreen),
        closes(configuration.outcomes.levelPublishCancelled),
        ...versionSteps,
        omits(configuration.outcomes.defaultsPublishRequested),
        omits(configuration.outcomes.defaultsPublished),
      ],
    }),
    defineFlow({
      id: 'defaults',
      root: defaultsScreen,
      steps: [
        opens(configuration.outcomes.defaultsPublishRequested, publishDefaultsScreen),
        finishes(configuration.outcomes.defaultsPublished, defaultsScreen),
        closes(configuration.outcomes.levelPublishCancelled),
        ...versionSteps,
        omits(configuration.outcomes.platformPublishRequested),
        omits(configuration.outcomes.platformPublished),
      ],
    }),
  ]
}

async function mount(client: OpeClient, capabilities: readonly string[], at: string) {
  const { outcomes } = configuration
  const application = createApplication(
    {
      name: 'console',
      screens: [
        platformScreen,
        defaultsScreen,
        publishPlatformScreen,
        publishDefaultsScreen,
        levelVersionScreen,
      ],
      flows: flows(),
      menu: [],
      featureRootOf: {
        platform: 'platform',
        publishPlatform: 'platform',
        levelVersion: 'platform',
        defaults: 'defaults',
        publishDefaults: 'defaults',
      },
      outcomesOf: {
        platform: [outcomes.platformPublishRequested.id, outcomes.levelVersionChosen.id],
        publishPlatform: [outcomes.platformPublished.id, outcomes.levelPublishCancelled.id],
        levelVersion: [outcomes.versionClosed.id],
        defaults: [outcomes.defaultsPublishRequested.id, outcomes.levelVersionChosen.id],
        publishDefaults: [outcomes.defaultsPublished.id, outcomes.levelPublishCancelled.id],
      },
      outcomes: Object.values(outcomes),
      toCapabilities: () => new Set(capabilities),
      systems: ['ope'],
    },
    ({ children }: { readonly children: ReactNode }) => <>{children}</>,
  )

  await act(async () => {
    await application.router.navigate(at)
  })

  render(
    <QueryProvider client={createQueryClient()}>
      <StringsProvider>
        <TelemetryProvider
          value={{ port: { record: () => {} }, app: 'console', version: 'v0', envelope: {} }}
        >
          <NoticesProvider>
            <NoticeProbe />
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
  return application
}

const READ = ['configuration:read']
/** Escribir con alcance acotado: todo lo del consumidor, menos el alcance total. */
const NARROW = ['configuration:read', 'configuration:write']
const ALL = [...NARROW, ALL_MERCHANTS]

const fieldOf = (label: string) => {
  const found = screen.getAllByText(label, { selector: 'label' })[0]?.closest('.granito-field')
  if (!(found instanceof HTMLElement)) throw new Error(`sin campo para «${label}»`)
  return found
}

const publishButton = () =>
  screen.queryByRole('button', { name: configurationStrings.publishVersion })

const publish = () =>
  fireEvent.click(screen.getByRole('button', { name: configurationStrings.publish }))

const sawNotice = (title: string, description?: string) =>
  noticed.some(
    (each) =>
      each.title === title && (description === undefined || each.description === description),
  )

describe('la plataforma y los defaults', () => {
  afterEach(() => {
    noticed.length = 0
  })

  it('la plataforma: la versión por su nombre y cada valor en su unidad', async () => {
    await mount(ope({}).client, READ, '/configuration/platform')
    await screen.findByText(configurationStrings.inForce)

    expect(within(fieldOf(configurationStrings.versionName)).getByText('platform-2')).toBeDefined()
    expect(
      within(fieldOf(configurationStrings.sessionDurationMs)).getByText('30 min'),
    ).toBeDefined()
    expect(within(fieldOf(configurationStrings.rotationGraceMaxMs)).getByText('7 d')).toBeDefined()
    /* El historial dice qué medición reinició la versión correctiva. */
    expect(await screen.findByText('exp_dev_000001')).toBeDefined()
  })

  it('«publicar» exige escribir y alcance sobre todos los merchants', async () => {
    const { client } = ope({})
    const offered = async (capabilities: readonly string[], at: string) => {
      await mount(client, capabilities, at)
      await screen.findByText(configurationStrings.inForce)
      const found = publishButton() !== null
      cleanup()
      return found
    }

    for (const at of ['/configuration/platform', '/configuration/defaults']) {
      expect(await offered(NARROW, at)).toBe(false)
      expect(await offered([...READ, ALL_MERCHANTS], at)).toBe(false)
      expect(await offered(ALL, at)).toBe(true)
    }
  })

  it('una versión del historial se abre, de sólo lectura, y se vuelve', async () => {
    const application = await mount(ope({}).client, READ, '/configuration/platform')
    await screen.findByText('exp_dev_000001')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: sharedStrings.openVersion }))
    })

    await screen.findByText(configurationStrings.versionWhy)
    expect(application.router.state.location.pathname).toBe('/configuration/platform/versions/2')
    expect(within(fieldOf(sharedStrings.reason)).getByText('Session length fixed.')).toBeDefined()
    expect(
      within(fieldOf(configurationStrings.windowsRestarted)).getByText('exp_dev_000001'),
    ).toBeDefined()
    expect(
      within(fieldOf(configurationStrings.sessionDurationMs)).getByText('30 min'),
    ).toBeDefined()
    expect(screen.queryByRole('textbox')).toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: configurationStrings.back }))
    })
    await waitFor(() =>
      expect(application.router.state.location.pathname).toBe('/configuration/platform'),
    )
  })

  it('publicar la plataforma sin tocar nada manda lo que rige, y avisa que no cambió nada', async () => {
    const { client, sentPlatform } = ope({ platform: [platformVersion(2)] })
    const application = await mount(client, ALL, '/configuration/platform/publish')
    await screen.findByText(sharedStrings.correctiveMark)

    await act(async () => publish())
    await waitFor(() => expect(sentPlatform).toHaveLength(1))
    expect(sentPlatform[0]).toEqual({ content: platform })
    await waitFor(() => expect(sawNotice(configurationStrings.unchanged)).toBe(true))
    await waitFor(() =>
      expect(application.router.state.location.pathname).toBe('/configuration/platform'),
    )
  })

  it('un 409 pasa a correctiva; publicada, el aviso nombra la medición que reinició', async () => {
    const frozen = new RequestFailed({
      status: 409,
      type: 'configuration-frozen',
      title: 'The configuration is frozen while an experiment is active',
    })
    const restarted = platformVersion(3, {
      corrective: true,
      reason: 'Longer sessions.',
      windowsRestarted: ['exp_dev_000001'],
    })
    const { client, sentPlatform } = ope({ platform: [frozen, restarted] })
    await mount(client, ALL, '/configuration/platform/publish')
    await screen.findByText(sharedStrings.correctiveMark)

    const session = screen.getByLabelText(new RegExp(`^${configurationStrings.sessionDurationMs}`))
    await act(async () => {
      fireEvent.change(session, { target: { value: '45' } })
      fireEvent.blur(session)
    })
    await act(async () => publish())
    await screen.findByText(sharedStrings.frozenTitle)
    /* El motivo queda enfocado: la sección está arriba, y se publicó desde el pie. */
    expect(document.activeElement).toBe(
      screen.getByLabelText(new RegExp(`^${sharedStrings.reasonLabel}`)),
    )

    /* Sin motivo no viaja. */
    await act(async () => publish())
    expect(sentPlatform).toHaveLength(1)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(new RegExp(`^${sharedStrings.reasonLabel}`)), {
        target: { value: 'Longer sessions.' },
      })
    })
    await act(async () => publish())
    await waitFor(() => expect(sentPlatform).toHaveLength(2))
    /* Lo cargado antes del 409 sigue ahí: viaja en el segundo intento. */
    expect(sentPlatform[1]).toMatchObject({
      corrective: true,
      reason: 'Longer sessions.',
      content: { sessionDurationMs: 2700000 },
    })
    await waitFor(() =>
      expect(
        sawNotice(
          configurationStrings.published,
          configurationStrings.publishedRestarting(3, ['exp_dev_000001']),
        ),
      ).toBe(true),
    )
  })

  it('los defaults: lo que no se edita viaja idéntico', async () => {
    const { client, sentDefaults } = ope({ defaults: [defaultsVersion(2)] })
    await mount(client, ALL, '/configuration/defaults/publish')
    await screen.findByText(configurationStrings.carriedSection)

    const holdout = screen.getByLabelText(new RegExp(`^${configurationStrings.holdoutShare}`))
    expect((holdout as HTMLInputElement).value).toBe('5')
    await act(async () => {
      fireEvent.change(holdout, { target: { value: '8' } })
      fireEvent.blur(holdout)
    })
    await act(async () => publish())

    await waitFor(() => expect(sentDefaults).toHaveLength(1))
    const sent = sentDefaults[0]?.content
    expect(sent?.holdoutShare).toBe(0.08)
    expect(sent?.decisionPolicy).toEqual(defaults.decisionPolicy)
    expect(sent?.commercialPolicy.returnRisk).toEqual(defaults.commercialPolicy.returnRisk)
    expect(sent?.surfaces).toEqual(['product', 'cart'])
    await waitFor(() =>
      expect(
        sawNotice(configurationStrings.published, configurationStrings.publishedDetail(2)),
      ).toBe(true),
    )
  })
})
