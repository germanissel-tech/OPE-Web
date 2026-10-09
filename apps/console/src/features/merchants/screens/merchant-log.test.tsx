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
} from '@ope/core'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { type AdminEntry, type Merchant, type OpeClient, opeService } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'

/**
 * **El registro del merchant, en sus cuatro estados y con cursor** (`CU-24`,
 * `OW-4`), dentro de la ficha.
 *
 * Lo que se afirma es lo que no se ve con un backend lleno: el vacío con su
 * texto, que «cargar más» anote `log.c` en la dirección, que el error tenga
 * salida, y que sin `log:read` la sección no esté y la ficha sí.
 */

afterEach(cleanup)

const [merchantsScreen, merchantScreen, newMerchantScreen, rotateScreen] = merchants.screens

const merchant: Merchant = {
  merchantId: 'mrc_uno',
  status: 'active',
  origins: ['https://uno.example'],
  createdAt: '2026-09-20T12:00:00Z',
  credentials: [],
}

const entry = (operation: string, outcome: AdminEntry['outcome'], code?: string): AdminEntry => ({
  at: '2026-10-08T15:04:05Z',
  operatorId: 'ops-1',
  operation,
  merchantId: 'mrc_uno',
  outcome,
  ...(code === undefined ? {} : { code }),
})

const CURSOR = 'eyJhZnRlciI6IjIwMjYtMTAtMDgifQ'

function ope(options: {
  readonly pages?: readonly Collection<AdminEntry>[]
  readonly logFails?: RequestFailed
}) {
  const pages = options.pages ?? []
  const client: OpeClient = {
    async listMerchants() {
      return { items: [merchant] }
    },
    async listMerchantAdminLog(_id, query) {
      if (options.logFails) throw options.logFails
      const page = query.cursor === undefined ? pages[0] : pages[1]
      return page ? { items: [...page.items], nextCursor: page.nextCursor } : { items: [] }
    },
    async getMerchant() {
      return merchant
    },
    async createMerchant() {
      throw new Error('no se prueba acá')
    },
    async deactivateMerchant() {
      throw new Error('no se prueba acá')
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
  }
  return client
}

async function mount(
  client: OpeClient,
  capabilities: readonly string[],
  url = '/merchants/mrc_uno',
) {
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
    ({ children }: { readonly children: ReactNode }) => <>{children}</>,
  )

  await act(async () => {
    await application.router.navigate(url)
  })

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

  return application
}

const READS = ['merchants:read', 'log:read']

describe('el registro del merchant', () => {
  it('con nada todavía, dice que nadie hizo nada', async () => {
    await mount(ope({ pages: [{ items: [] }] }), READS)

    await screen.findByText(merchantsStrings.logEmpty)
    expect(screen.queryByText(/cargados/)).toBeNull()
  })

  it('con entradas, muestra instante en UTC, operación, resultado y código', async () => {
    await mount(
      ope({
        pages: [
          {
            items: [
              entry('setKillSwitch', 'rejected', 'merchant-deactivated'),
              entry('createMerchant', 'accepted'),
            ],
          },
        ],
      }),
      READS,
    )

    await screen.findByText('setKillSwitch')
    expect(screen.getAllByText('2026-10-08 15:04 UTC')).toHaveLength(2)
    expect(screen.getByText(merchantsStrings.rejected)).toBeDefined()
    expect(screen.getByText(merchantsStrings.accepted)).toBeDefined()
    expect(screen.getByText('merchant-deactivated')).toBeDefined()
    expect(screen.getByText(merchantsStrings.atUtc)).toBeDefined()
  })

  it('cargar más acumula y anota el cursor como log.c', async () => {
    const application = await mount(
      ope({
        pages: [
          { items: [entry('setKillSwitch', 'accepted')], nextCursor: CURSOR },
          { items: [entry('createMerchant', 'accepted')] },
        ],
      }),
      READS,
    )

    await screen.findByText('setKillSwitch')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }))
    })

    await screen.findByText('createMerchant')
    expect(screen.getByText('setKillSwitch')).toBeDefined()
    expect(application.router.state.location.search).toContain(`log.c=${CURSOR}`)
  })

  it('un error tiene salida: reintentar vuelve al principio', async () => {
    const application = await mount(
      ope({
        logFails: new RequestFailed({
          status: 400,
          type: 'validation-failed',
          title: 'The request does not satisfy the contract',
          errors: [{ pointer: '/query/cursor', message: 'must match pattern' }],
        }),
      }),
      READS,
      '/merchants/mrc_uno?log.c=viejo',
    )

    await screen.findByText('No se pudieron traer los datos')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    })

    expect(application.router.state.location.search).not.toContain('log.c=')
  })

  it('sin log:read, la sección no se dibuja y la ficha sí', async () => {
    await mount(ope({ pages: [{ items: [entry('createMerchant', 'accepted')] }] }), [
      'merchants:read',
    ])

    await screen.findByText('mrc_uno')
    expect(screen.queryByText(merchantsStrings.log)).toBeNull()
    expect(screen.queryByText('createMerchant')).toBeNull()
  })
})
