// @vitest-environment jsdom
import {
  ApplicationView,
  closes,
  createApplication,
  createQueryClient,
  DEFAULT_STRINGS,
  defineFlow,
  finishes,
  NoticesProvider,
  opens,
  QueryProvider,
  RequestFailed,
  ServicesProvider,
  StringsProvider,
  TelemetryProvider,
  useNoticeHost,
} from '@ope/core'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ReactNode, useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
/* Lo de `api/` llega por `data/`, que es lo único que puede tocarla (`CU-15`);
   y las pantallas, por la funcionalidad que las declara (`CU-47`). */
import {
  type Merchant,
  type MerchantCredentials,
  type OpeClient,
  opeService,
} from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'

/**
 * **El alta muestra las credenciales una sola vez, y nada más las ve**
 * (`GR-70`, `OW-8`).
 *
 * Montada en la aplicación de verdad, contra un servicio `ope` de mentira. Lo
 * que se afirma es lo que no se ve con el caso feliz: que un origen mal
 * formado no se manda, que el `422` cae en el renglón que lo pidió, que lo
 * registrado en telemetría y en avisos **no contiene ningún valor**, y que
 * «continuar» termina el alta en la ficha.
 */

afterEach(cleanup)

const [merchantsScreen, merchantScreen, newMerchantScreen] = merchants.screens

const ISSUED: MerchantCredentials = {
  merchant: {
    merchantId: 'mrc_nuevo',
    status: 'active',
    origins: ['https://tienda.example'],
    createdAt: '2026-10-08T12:00:00Z',
    credentials: [
      { kind: 'ingest', issuedAt: '2026-10-08T12:00:00Z' },
      { kind: 'platform', issuedAt: '2026-10-08T12:00:00Z' },
    ],
  },
  credentials: { ingestKey: 'ope_ik_SECRETA_UNO', platformKey: 'ope_pk_SECRETA_DOS' },
}

function ope(options: { readonly createFails?: RequestFailed } = {}): OpeClient & {
  readonly created: Parameters<OpeClient['createMerchant']>[0][]
} {
  const created: Parameters<OpeClient['createMerchant']>[0][] = []
  return {
    created,
    async listMerchants() {
      return { items: [] }
    },
    async getMerchant(merchantId): Promise<Merchant> {
      return { ...ISSUED.merchant, merchantId }
    },
    async createMerchant(body) {
      created.push(body)
      if (options.createFails) throw options.createFails
      return ISSUED
    },
    async deactivateMerchant() {
      throw new Error('no se prueba acá')
    },
  }
}

const recorded: unknown[] = []
const noticed: unknown[] = []

function NoticeProbe() {
  const { notifications } = useNoticeHost()
  useEffect(() => {
    noticed.push(...notifications)
  }, [notifications])
  return null
}

function providers(client: OpeClient) {
  return ({ children }: { readonly children: ReactNode }) => (
    <QueryProvider client={createQueryClient()}>
      <StringsProvider>
        <TelemetryProvider
          value={{
            port: { record: (each) => recorded.push(each) },
            app: 'console',
            version: 'v0',
            envelope: {},
          }}
        >
          <NoticesProvider>
            <NoticeProbe />
            <ServicesProvider services={[opeService(client)]}>{children}</ServicesProvider>
          </NoticesProvider>
        </TelemetryProvider>
      </StringsProvider>
    </QueryProvider>
  )
}

async function mount(client: OpeClient, capabilities: readonly string[], url = '/merchants/new') {
  const flow = defineFlow({
    id: 'merchants',
    root: merchantsScreen,
    steps: [
      opens(merchants.outcomes.merchantChosen, merchantScreen, ({ merchantId }) => ({
        merchantId,
      })),
      closes(merchants.outcomes.merchantClosed),
      opens(merchants.outcomes.merchantRequested, newMerchantScreen),
      finishes(merchants.outcomes.merchantCreated, merchantScreen, ({ merchantId }) => ({
        merchantId,
      })),
      closes(merchants.outcomes.newMerchantCancelled),
    ],
  })
  const application = createApplication(
    {
      name: 'console',
      screens: [merchantsScreen, merchantScreen, newMerchantScreen],
      flows: [flow],
      menu: [flow],
      featureRootOf: { merchants: 'merchants', merchant: 'merchants', 'new-merchant': 'merchants' },
      outcomesOf: {
        merchants: [merchants.outcomes.merchantChosen.id, merchants.outcomes.merchantRequested.id],
        merchant: [merchants.outcomes.merchantClosed.id],
        'new-merchant': [
          merchants.outcomes.merchantCreated.id,
          merchants.outcomes.newMerchantCancelled.id,
        ],
      },
      outcomes: Object.values(merchants.outcomes),
      toCapabilities: () => new Set(capabilities),
      systems: ['ope'],
    },
    ({ children }) => <>{children}</>,
  )

  await act(async () => {
    await application.router.navigate(url)
  })

  const Providers = providers(client)
  render(
    <Providers>
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
    </Providers>,
  )

  return application
}

const ALL = ['merchants:read', 'merchants:write']

/* El rótulo de un campo obligatorio lleva la marca de granito al lado: se busca
   por el texto que empieza así, no por el texto exacto. */
const row = (position: number) =>
  screen.getByLabelText(new RegExp(`^${merchantsStrings.originRow(position)}`))

function type(position: number, value: string) {
  fireEvent.change(row(position), { target: { value } })
  fireEvent.blur(row(position))
}

const create = () => fireEvent.click(screen.getByRole('button', { name: merchantsStrings.save }))

describe('el alta de un merchant', () => {
  afterEach(() => {
    recorded.length = 0
    noticed.length = 0
  })

  it('un origen sin esquema no se manda: el renglón lo dice', async () => {
    const client = ope()
    await mount(client, ALL)
    await screen.findByText(merchantsStrings.originsSection)

    await act(async () => type(1, 'tienda.example'))
    await act(async () => create())

    expect(screen.getByText(merchantsStrings.shape.badFormat)).toBeDefined()
    expect(client.created).toHaveLength(0)
  })

  it('un 422 con puntero cae en el renglón que lo pidió, y el formulario sigue', async () => {
    const client = ope({
      createFails: new RequestFailed({
        status: 422,
        type: 'invalid-origin',
        title: 'A registered origin is not scheme://host[:port]',
        errors: [{ pointer: '/body/origins/1', message: 'El segundo no sirve.' }],
      }),
    })
    await mount(client, ALL)
    await screen.findByText(merchantsStrings.originsSection)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: merchantsStrings.addOrigin }))
    })
    await act(async () => type(1, 'https://uno.example'))
    await act(async () => type(2, 'https://dos.example'))
    await act(async () => create())

    await screen.findByText('El segundo no sirve.')
    expect(row(2).getAttribute('aria-invalid')).toBe('true')
    expect(row(1).getAttribute('aria-invalid')).not.toBe('true')
    expect(client.created).toEqual([
      { origins: ['https://uno.example', 'https://dos.example'], signature: false },
    ])
  })

  it('un 422 sin campos va al pie, con lo que el servidor dijo', async () => {
    const client = ope({
      createFails: new RequestFailed({
        status: 422,
        type: 'origin-already-registered',
        title: 'An origin already belongs to another merchant',
        detail: 'The origin https://uno.example belongs to another merchant.',
      }),
    })
    await mount(client, ALL)
    await screen.findByText(merchantsStrings.originsSection)

    await act(async () => type(1, 'https://uno.example'))
    await act(async () => create())

    await screen.findByText('The origin https://uno.example belongs to another merchant.')
    expect(screen.getByText(merchantsStrings.rejectedTitle)).toBeDefined()
  })

  it('al crear muestra las credenciales con «copiar», y ningún registro las contiene', async () => {
    const application = await mount(ope(), ALL)
    await screen.findByText(merchantsStrings.originsSection)

    await act(async () => type(1, 'https://tienda.example'))
    await act(async () => create())

    await screen.findByText('ope_ik_SECRETA_UNO')
    expect(screen.getByText('ope_pk_SECRETA_DOS')).toBeDefined()
    expect(screen.queryByText(merchantsStrings.platformSecret)).toBeNull()
    expect(screen.getAllByRole('button', { name: DEFAULT_STRINGS.copy })).toHaveLength(2)
    expect(screen.getByText(merchantsStrings.issuedWarning)).toBeDefined()

    /* `OW-8`: lo que salió de la pantalla —telemetría y avisos— no lleva el valor. */
    await waitFor(() => expect(noticed.length).toBeGreaterThan(0))
    const everything = JSON.stringify({ recorded, noticed })
    expect(everything).not.toContain('SECRETA')
    expect(everything).toContain('mrc_nuevo')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: merchantsStrings.continueToMerchant }))
    })

    expect(application.router.state.location.pathname).toBe('/merchants/mrc_nuevo')
    expect(document.body.innerHTML).not.toContain('SECRETA')
  })

  it('cancelar vuelve a la grilla sin crear nada', async () => {
    const client = ope()
    const application = await mount(client, ALL)
    await screen.findByText(merchantsStrings.originsSection)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: merchantsStrings.cancel }))
    })

    expect(application.router.state.location.pathname).toBe('/merchants')
    expect(client.created).toHaveLength(0)
  })

  it('sin merchants:write, la ruta responde «sin permisos»', async () => {
    await mount(ope(), ['merchants:read'])

    await screen.findByText(DEFAULT_STRINGS.forbidden)
    expect(screen.queryByText(merchantsStrings.originsSection)).toBeNull()
  })
})
