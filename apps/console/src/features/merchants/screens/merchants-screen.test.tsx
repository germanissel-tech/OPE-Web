// @vitest-environment jsdom
import {
  ApplicationView,
  type Collection,
  closes,
  createApplication,
  createQueryClient,
  defineFlow,
  finishes,
  NoticesProvider,
  opens,
  QueryProvider,
  RequestFailed,
  ServicesProvider,
  StringsProvider,
  TelemetryProvider,
  useAction,
  useNoticeHost,
} from '@ope/core'
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { deactivateMerchant } from '../data/deactivate-merchant'
/* Lo de `api/` llega por `data/`, que es lo único que puede tocarla (`CU-15`);
   y las pantallas, por la funcionalidad que las declara (`CU-47`). Así la prueba
   respeta los mismos límites que el código que prueba. */
import { type Merchant, type OpeClient, opeService } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'

/**
 * **La grilla del hola mundo, en sus cuatro estados y con cursor** (`CU-24`,
 * `ADR-020`), montada en la aplicación de verdad y contra un servicio `ope`
 * de mentira que responde lo que el contrato ejemplifica.
 *
 * Lo que se afirma es lo que no se ve mirando con permisos completos y un
 * backend lleno: el vacío con su salida, que «cargar más» anote el cursor en la
 * dirección, que el alta no se dibuje sin `merchants:write`, y que un `409`
 * sea rechazo y un `403` deje rastro.
 */

afterEach(cleanup)

const [merchantsScreen, merchantScreen, newMerchantScreen, rotateScreen] = merchants.screens

const merchant = (merchantId: string): Merchant => ({
  merchantId,
  status: 'active',
  origins: [`https://${merchantId}.example`],
  createdAt: '2026-09-20T12:00:00Z',
  credentials: [{ kind: 'ingest', issuedAt: '2026-09-20T12:00:00Z' }],
})

const CURSOR = 'eyJhZnRlciI6Im1yY183ZjNrNWQycTRtNngifQ'

/** Un backend de mentira: dos tramos, y lo que se le pida que falle. */
function ope(options: {
  readonly pages?: readonly Collection<Merchant>[]
  readonly listFails?: RequestFailed
  readonly deactivateFails?: RequestFailed
}): OpeClient {
  const pages = options.pages ?? []
  return {
    async listMerchants(query) {
      if (options.listFails) throw options.listFails
      const page = query.cursor === undefined ? pages[0] : pages[1]
      return page ? { items: [...page.items], nextCursor: page.nextCursor } : { items: [] }
    },
    async listMerchantAdminLog() {
      return { items: [] }
    },
    async getMerchant(merchantId) {
      return merchant(merchantId)
    },
    async createMerchant() {
      throw new Error('no se prueba acá')
    },
    async deactivateMerchant(merchantId) {
      if (options.deactivateFails) throw options.deactivateFails
      return { ...merchant(merchantId), status: 'deactivated' }
    },
    async rotateIngestKey() {
      throw new Error('no se prueba acá')
    },
    async rotatePlatformKey() {
      throw new Error('no se prueba acá')
    },
    async rotatePlatformSecret() {
      throw new Error('no se prueba acá')
    },
    async setKillSwitch() {
      throw new Error('no se prueba acá')
    },
    async updateMerchantProfile() {
      throw new Error('no se prueba acá')
    },
  }
}

const recorded: { kind: string; code?: string }[] = []

function providers(client: OpeClient) {
  return ({ children }: { readonly children: ReactNode }) => (
    <QueryProvider client={createQueryClient()}>
      <StringsProvider>
        <TelemetryProvider
          value={{
            port: { record: (each) => recorded.push(each.event) },
            app: 'console',
            version: 'v0',
            envelope: {},
          }}
        >
          <NoticesProvider>
            <ServicesProvider services={[opeService(client)]}>{children}</ServicesProvider>
          </NoticesProvider>
        </TelemetryProvider>
      </StringsProvider>
    </QueryProvider>
  )
}

/** La aplicación de verdad, con un chrome que sólo dibuja la pantalla. */
async function mount(client: OpeClient, capabilities: readonly string[], url = '/merchants') {
  const flow = defineFlow({
    id: 'merchants',
    root: merchantsScreen,
    steps: [
      opens(merchants.outcomes.merchantChosen, merchantScreen, ({ merchantId }) => ({
        merchantId,
      })),
      opens(merchants.outcomes.merchantRequested, newMerchantScreen),
      finishes(merchants.outcomes.merchantCreated, merchantScreen, ({ merchantId }) => ({
        merchantId,
      })),
      closes(merchants.outcomes.newMerchantCancelled),
      opens(merchants.outcomes.rotationRequested, rotateScreen, ({ merchantId, kind }) => ({
        merchantId,
        kind,
      })),
      finishes(merchants.outcomes.rotationClosed, merchantScreen, ({ merchantId }) => ({
        merchantId,
      })),
    ],
  })
  const application = createApplication(
    {
      name: 'console',
      screens: [merchantsScreen, merchantScreen, newMerchantScreen, rotateScreen],
      flows: [flow],
      menu: [flow],
      featureRootOf: {
        merchants: 'merchants',
        merchant: 'merchants',
        'new-merchant': 'merchants',
        rotate: 'merchants',
      },
      outcomesOf: {
        merchants: [merchants.outcomes.merchantChosen.id, merchants.outcomes.merchantRequested.id],
        merchant: [merchants.outcomes.merchantClosed.id, merchants.outcomes.rotationRequested.id],
        'new-merchant': [
          merchants.outcomes.merchantCreated.id,
          merchants.outcomes.newMerchantCancelled.id,
        ],
        rotate: [merchants.outcomes.rotationClosed.id],
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

describe('la grilla de merchants', () => {
  it('con nada todavía, dice que no hay y ofrece el alta', async () => {
    await mount(ope({ pages: [{ items: [] }] }), ALL)

    await screen.findByText(merchantsStrings.empty)
    expect(
      screen.getAllByRole('button', { name: merchantsStrings.newMerchant }).length,
    ).toBeGreaterThan(0)
    /* Sin filas no hay «cargar más» que dibujar. */
    expect(screen.queryByText(/cargados/)).toBeNull()
  })

  it('con datos, muestra lo que el contrato devuelve y ofrece cargar más', async () => {
    await mount(
      ope({
        pages: [
          { items: [merchant('mrc_uno')], nextCursor: CURSOR },
          { items: [merchant('mrc_dos')] },
        ],
      }),
      ALL,
    )

    /* Sin nombre, el identificador ocupa la columna del nombre **y** la suya. */
    await screen.findAllByText('mrc_uno')
    expect(screen.getAllByText('mrc_uno')).toHaveLength(2)
    expect(screen.queryByText('https://mrc_uno.example')).toBeNull()
    expect(screen.getByText('1 cargado')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Cargar más' })).toBeDefined()
  })

  it('lista por nombre cuando lo hay, y por identificador en código cuando no (feature 007)', async () => {
    await mount(
      ope({
        pages: [
          {
            items: [
              {
                ...merchant('mrc_con'),
                displayName: 'Tienda Norte',
                storeUrl: 'https://norte.example',
              },
              merchant('mrc_sin'),
            ],
          },
        ],
      }),
      ALL,
    )

    await screen.findByText('Tienda Norte')
    expect(screen.getAllByText('mrc_con')).toHaveLength(1)
    const inCode = screen.getAllByText('mrc_sin').filter((each) => each.tagName === 'CODE')
    expect(inCode).toHaveLength(1)
    expect(screen.queryByText('https://norte.example')).toBeNull()
  })

  it('cargar más acumula y anota el cursor del tramo que llegó en la dirección', async () => {
    const application = await mount(
      ope({
        pages: [
          { items: [merchant('mrc_uno')], nextCursor: CURSOR },
          { items: [merchant('mrc_dos')] },
        ],
      }),
      ALL,
    )
    await screen.findAllByText('mrc_uno')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }))
    })

    await screen.findAllByText('mrc_dos')
    expect(screen.getAllByText('mrc_uno').length).toBeGreaterThan(0)
    expect(application.router.state.location.search).toContain(`merchants.c=${CURSOR}`)
    /* El último tramo no trajo cursor: se dice, en vez de dejar un botón muerto. */
    expect(screen.getByText('No hay más')).toBeDefined()
  })

  it('un enlace con cursor reproduce ese tramo, no la acumulación', async () => {
    await mount(
      ope({
        pages: [
          { items: [merchant('mrc_uno')], nextCursor: CURSOR },
          { items: [merchant('mrc_dos')] },
        ],
      }),
      ALL,
      `/merchants?merchants.c=${CURSOR}`,
    )

    await screen.findAllByText('mrc_dos')
    expect(screen.queryByText('mrc_uno')).toBeNull()
  })

  it('sin merchants:write, el alta no se dibuja', async () => {
    /* `CU-3`: lo que un permiso no habilita no se muestra, ni en la barra ni en
       la salida del vacío. */
    await mount(ope({ pages: [{ items: [] }] }), ['merchants:read'])

    await screen.findByText(merchantsStrings.empty)
    expect(screen.queryByRole('button', { name: merchantsStrings.newMerchant })).toBeNull()
  })

  it('un cursor viejo es un error con salida: reintentar vuelve al principio', async () => {
    const application = await mount(
      ope({
        listFails: new RequestFailed({
          status: 400,
          type: 'validation-failed',
          title: 'The request does not satisfy the contract',
          errors: [{ pointer: '/query/cursor', message: 'must match pattern' }],
        }),
      }),
      ALL,
      `/merchants?merchants.c=viejo`,
    )

    await screen.findByText('No se pudieron traer los datos')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    })

    expect(application.router.state.location.search).not.toContain('merchants.c=')
  })
})

describe('desactivar, contra lo que el backend contesta', () => {
  const hook = (client: OpeClient) =>
    renderHook(
      () => ({ action: useAction(deactivateMerchant), avisos: useNoticeHost().notifications }),
      { wrapper: providers(client) },
    )

  afterEach(() => {
    recorded.length = 0
  })

  it('un 409 merchant-deactivated es un rechazo: aviso de rechazo, sin rastro de defecto', async () => {
    const { result } = hook(
      ope({
        deactivateFails: new RequestFailed({
          status: 409,
          type: 'merchant-deactivated',
          title: 'The merchant is deactivated',
        }),
      }),
    )

    await act(() => result.current.action.run(merchant('mrc_uno')))

    await waitFor(() => expect(result.current.avisos).toHaveLength(1))
    expect(result.current.avisos[0]?.tone).toBe('warning')
    expect(recorded.filter((each) => each.kind === 'requestFailed')).toHaveLength(0)
  })

  it('un 403 merchant-out-of-scope es defecto nuestro: deja rastro', async () => {
    const { result } = hook(
      ope({
        deactivateFails: new RequestFailed({
          status: 403,
          type: 'merchant-out-of-scope',
          title: "The merchant is outside the operator's scope",
        }),
      }),
    )

    await act(() => result.current.action.run(merchant('mrc_uno')))

    await waitFor(() =>
      expect(recorded.filter((each) => each.kind === 'requestFailed')).toHaveLength(1),
    )
    expect(recorded.find((each) => each.kind === 'requestFailed')?.code).toBe(
      'merchant-out-of-scope',
    )
  })
})
