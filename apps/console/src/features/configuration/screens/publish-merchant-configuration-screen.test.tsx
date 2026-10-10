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
  useNoticeHost,
} from '@ope/core'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { type ReactNode, useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { sharedStrings } from '../../../components/strings'
/* Lo de `api/` llega por `data/`, que es lo único que puede tocarla (`CU-15`). */
import {
  type MerchantConfiguration,
  type MerchantConfigurationInput,
  type MerchantConfigurationVersion,
  type OpeClient,
  opeService,
} from '../data/merchant-configuration'
import { configuration } from '../feature'
import { configurationStrings } from '../strings'

/**
 * **Publicar una versión del merchant** (feature 008, escenarios 3 a 6),
 * montada en la aplicación de verdad contra un servicio `ope` de mentira.
 *
 * Lo que se afirma es lo que no se ve publicando un cambio feliz: que lo que no
 * se edita viaja idéntico, que heredar saca el valor del cuerpo, que un `409`
 * no pierde lo cargado y pide el motivo, y que un `422` cae donde tiene que
 * caer —en su campo, o al pie si la pantalla no lo edita—.
 */

afterEach(cleanup)

const [, merchantConfigurationScreen, publishMerchantConfigurationScreen] = configuration.screens

const effective = {
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
    version: 'mine-1',
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
} satisfies MerchantConfiguration['effective']

const served: MerchantConfiguration = {
  effective,
  declared: {
    holdoutShare: 0.07,
    decisionPolicy: { version: 'mine-1', threshold: 0.7 },
    anchors: { price: { selectors: ['.price'] } },
    attributeLabels: [{ label: 'Algodón peinado', value: 'combed-cotton' }],
  },
  versions: { platform: 'platform-2', defaults: 'defaults-1', merchant: 3 },
}

function ope(answers: readonly (MerchantConfigurationVersion | RequestFailed)[]) {
  const sent: MerchantConfigurationInput[] = []
  const no = () => {
    throw new Error('no se prueba acá')
  }
  const client: OpeClient = {
    listMerchants: no,
    async getMerchant() {
      return {
        witness: '"w-1"',
        merchantId: 'mrc_pub',
        status: 'active',
        origins: ['https://pub.example'],
        createdAt: '2026-10-09T12:00:00Z',
        credentials: [],
        displayName: 'Tienda Pub',
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
      return { items: [] }
    },
    async getMerchantConfigurationVersion() {
      throw new Error('no se prueba acá')
    },
    async publishMerchantConfiguration(_merchantId, body) {
      sent.push(body)
      const answer = answers[sent.length - 1]
      if (answer === undefined) throw new Error('sin respuesta preparada')
      if (answer instanceof RequestFailed) throw answer
      return answer
    },
    getPlatformConfiguration: no,
    listPlatformConfigurationVersions: no,
    getPlatformConfigurationVersion: no,
    publishPlatformConfiguration: no,
    getTreatmentDefaults: no,
    listTreatmentDefaultsVersions: no,
    getTreatmentDefaultsVersion: no,
    publishTreatmentDefaults: no,
  }
  return { client, sent }
}

const version = (number: number, declared = served.declared): MerchantConfigurationVersion => ({
  version: number,
  declared,
  corrective: false,
  publishedAt: '2026-10-10T12:00:00Z',
  operatorId: 'ops-1',
})

const noticed: ReturnType<typeof useNoticeHost>['notifications'][number][] = []

function NoticeProbe() {
  const { notifications } = useNoticeHost()
  useEffect(() => {
    noticed.push(...notifications)
  }, [notifications])
  return null
}

const hostScreen = defineScreen({ id: 'host', title: 'Host', path: '/host', component: () => null })
const opened = outcome<{ merchantId: string }>('test.configurationOpened')

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
    ],
  })
  const application = createApplication(
    {
      name: 'console',
      screens: [hostScreen, merchantConfigurationScreen, publishMerchantConfigurationScreen],
      flows: [flow],
      menu: [],
      featureRootOf: {
        host: 'host',
        merchantConfiguration: 'host',
        publishMerchantConfiguration: 'host',
      },
      outcomesOf: {
        host: [opened.id],
        merchantConfiguration: [
          configuration.outcomes.merchantConfigurationClosed.id,
          configuration.outcomes.merchantPublishRequested.id,
        ],
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
    await application.router.navigate('/merchants/mrc_pub/configuration/publish')
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

const WRITE = ['configuration:read', 'configuration:write']

/** El campo de un rótulo; con dos iguales, el primero (la frescura va antes que la sincronización). */
const fieldOf = (label: string) => {
  const found = screen.getAllByText(label, { selector: 'label' })[0]?.closest('.granito-field')
  if (!(found instanceof HTMLElement)) throw new Error(`sin campo para «${label}»`)
  return found
}

const publish = () =>
  fireEvent.click(screen.getByRole('button', { name: configurationStrings.publish }))

describe('publicar una versión del merchant', () => {
  afterEach(() => {
    noticed.length = 0
  })

  it('sin tocar nada, manda lo que se declaraba y avisa que no cambió nada', async () => {
    const { client, sent } = ope([version(3)])
    const application = await mount(client, WRITE)
    await screen.findByText(configurationStrings.carriedSection)

    expect(
      (screen.getByLabelText(configurationStrings.holdoutShare) as HTMLInputElement).value,
    ).toBe('7')
    await act(async () => publish())

    await waitFor(() => expect(sent).toHaveLength(1))
    /* Lo que no se edita viaja idéntico: es la falla más cara de la feature. */
    expect(sent[0]).toEqual({ declared: served.declared })
    await waitFor(() =>
      expect(application.router.state.location.pathname).toBe('/merchants/mrc_pub/configuration'),
    )
    await waitFor(() =>
      expect(noticed.some((each) => each.title === configurationStrings.unchanged)).toBe(true),
    )
  })

  it('declarar un valor heredado lo manda; heredar uno declarado lo saca', async () => {
    const { client, sent } = ope([version(4)])
    await mount(client, WRITE)
    await screen.findByText(configurationStrings.carriedSection)

    const catalog = fieldOf(configurationStrings['freshness.catalogMs'])
    expect(within(catalog).getByText('36 h')).toBeDefined()
    await act(async () => {
      fireEvent.click(within(catalog).getByRole('button', { name: configurationStrings.declare }))
    })
    await act(async () => {
      fireEvent.click(
        within(fieldOf(configurationStrings.holdoutShare)).getByRole('button', {
          name: configurationStrings.inherit,
        }),
      )
    })
    await act(async () => publish())

    await waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0]?.declared).not.toHaveProperty('holdoutShare')
    expect(sent[0]?.declared.freshness).toEqual({ catalogMs: 129600000 })
    expect(sent[0]?.declared.anchors).toEqual(served.declared.anchors)
    await waitFor(() =>
      expect(noticed.some((each) => each.title === configurationStrings.published)).toBe(true),
    )
  })

  it('un 409 conserva lo cargado, marca la correctiva y no sale sin motivo', async () => {
    const frozen = new RequestFailed({
      status: 409,
      type: 'configuration-frozen',
      title: 'The configuration is frozen while an experiment is active',
    })
    const { client, sent } = ope([frozen, version(4)])
    await mount(client, WRITE)
    await screen.findByText(configurationStrings.carriedSection)

    await act(async () => publish())
    await screen.findByText(sharedStrings.frozenTitle)
    /* Marcada sola: el motivo sólo aparece con la correctiva marcada. */
    expect(screen.getByText(sharedStrings.correctiveMark)).toBeDefined()
    expect(screen.getByLabelText(new RegExp(`^${sharedStrings.reasonLabel}`))).toBeDefined()

    /* Sin motivo, capa 1: no viaja. */
    await act(async () => publish())
    expect(sent).toHaveLength(1)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(new RegExp(`^${sharedStrings.reasonLabel}`)), {
        target: { value: 'Fixing a broken anchor.' },
      })
    })
    await act(async () => publish())
    await waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1]).toMatchObject({ corrective: true, reason: 'Fixing a broken anchor.' })
  })

  it('un 422 sobre la escalera cae en la escalera; uno sobre lo que no se edita, al pie', async () => {
    const rejected = new RequestFailed({
      status: 422,
      type: 'invalid-configuration-value',
      title: 'A configuration value violates an invariant of its type',
      errors: [
        {
          pointer: '/body/declared/commercialPolicy/incentiveLadderShare',
          message: 'The ladder does not increase.',
        },
        { pointer: '/body/declared/attributeLabels/0/label', message: 'Repeated label.' },
      ],
    })
    const { client } = ope([rejected])
    await mount(client, WRITE)
    await screen.findByText(configurationStrings.carriedSection)

    const ladder = fieldOf(configurationStrings['commercialPolicy.incentiveLadderShare'])
    await act(async () => {
      fireEvent.click(within(ladder).getByRole('button', { name: configurationStrings.declare }))
    })
    /* «Versión de la política» se carga sola al declarar algo comercial: viene de lo que rige. */
    await act(async () => {
      fireEvent.click(
        within(fieldOf(configurationStrings['commercialPolicy.version'])).getByRole('button', {
          name: configurationStrings.declare,
        }),
      )
    })
    await act(async () => publish())

    await screen.findByText('The ladder does not increase.')
    expect(
      within(fieldOf(configurationStrings['commercialPolicy.incentiveLadderShare'])).getByText(
        'The ladder does not increase.',
      ),
    ).toBeDefined()
    await waitFor(() =>
      expect(JSON.stringify(noticed)).toContain('declared.attributeLabels.0.label'),
    )
  })

  it('sin configuration:write la ruta no muestra la publicación', async () => {
    const { client } = ope([])
    await mount(client, ['configuration:read'])
    await act(async () => {})
    expect(screen.queryByText(configurationStrings.carriedSection)).toBeNull()
  })
})
