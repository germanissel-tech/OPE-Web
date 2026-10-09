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
import { type CredentialIssued, type Merchant, type OpeClient, opeService } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'

/**
 * **Rotar muestra el valor nuevo una sola vez, y la gracia se valida antes y
 * después** (`GR-37`, `OW-8`).
 *
 * Montada en la aplicación de verdad, contra un servicio `ope` de mentira. Lo
 * que se afirma es lo que no se ve con el caso feliz: una gracia negativa no
 * se manda, el `422` cae en el campo, lo registrado no contiene el valor, y
 * una clase que no existe dibuja «no existe».
 */

afterEach(cleanup)

const [merchantsScreen, merchantScreen, newMerchantScreen, rotateScreen] = merchants.screens

const merchant: Merchant = {
  merchantId: 'mrc_uno',
  status: 'active',
  origins: ['https://uno.example'],
  createdAt: '2026-09-20T12:00:00Z',
  credentials: [{ kind: 'ingest', issuedAt: '2026-09-20T12:00:00Z' }],
}

const ISSUED: CredentialIssued = {
  kind: 'ingest',
  value: 'ope_ik_SECRETA_NUEVA',
  issuedAt: '2026-10-08T12:00:00Z',
  previousExpiresAt: '2026-10-08T13:00:00Z',
}

function ope(options: { readonly rotateFails?: RequestFailed } = {}) {
  const rotated: { readonly kind: string; readonly graceSeconds: number }[] = []
  const rotate = (kind: string) => async (_id: string, body: { graceSeconds: number }) => {
    rotated.push({ kind, graceSeconds: body.graceSeconds })
    if (options.rotateFails) throw options.rotateFails
    return { ...ISSUED, kind } as CredentialIssued
  }
  const client: OpeClient = {
    async listMerchants() {
      return { items: [merchant] }
    },
    async listMerchantAdminLog() {
      return { items: [] }
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
    rotateIngestKey: rotate('ingest'),
    rotatePlatformKey: rotate('platform'),
    rotatePlatformSecret: rotate('signing'),
    async setKillSwitch() {
      throw new Error('no se prueba acá')
    },
    async updateMerchantProfile() {
      throw new Error('no se prueba acá')
    },
  }
  return { client, rotated }
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

async function mount(
  client: OpeClient,
  capabilities: readonly string[],
  url = '/merchants/mrc_uno/rotate/ingest',
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
          value={{
            port: { record: (each) => recorded.push(each) },
            app: 'console',
            version: 'v0',
            envelope: {},
          }}
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

const ALL = ['merchants:read', 'credentials:rotate']

const grace = () => screen.getByLabelText(new RegExp(`^${merchantsStrings.graceSeconds}`))

function typeGrace(value: string) {
  fireEvent.change(grace(), { target: { value } })
  fireEvent.blur(grace())
}

const rotate = () => fireEvent.click(screen.getByRole('button', { name: merchantsStrings.rotate }))

describe('rotar una credencial', () => {
  afterEach(() => {
    recorded.length = 0
    noticed.length = 0
  })

  it('una gracia negativa no se manda: el campo lo dice', async () => {
    const { client, rotated } = ope()
    await mount(client, ALL)
    await screen.findByText(merchantsStrings.graceWhy)

    await act(async () => typeGrace('-1'))
    await act(async () => rotate())

    expect(screen.getByText(merchantsStrings.shape.outOfRange(0, undefined))).toBeDefined()
    expect(rotated).toHaveLength(0)
  })

  it('un 422 con puntero cae en el campo de gracia', async () => {
    const { client } = ope({
      rotateFails: new RequestFailed({
        status: 422,
        type: 'rotation-grace-too-long',
        title: 'The rotation grace exceeds the platform maximum',
        errors: [{ pointer: '/body/graceSeconds', message: 'Demasiado.' }],
      }),
    })
    await mount(client, ALL)
    await screen.findByText(merchantsStrings.graceWhy)

    await act(async () => typeGrace('700000'))
    await act(async () => rotate())

    await screen.findByText('Demasiado.')
    expect(grace().getAttribute('aria-invalid')).toBe('true')
  })

  it('al rotar muestra el valor una vez con «copiar», y ningún registro lo contiene', async () => {
    const { client, rotated } = ope()
    const application = await mount(client, ALL)
    await screen.findByText(merchantsStrings.graceWhy)

    await act(async () => typeGrace('3600'))
    await act(async () => rotate())

    await screen.findByText('ope_ik_SECRETA_NUEVA')
    expect(rotated).toEqual([{ kind: 'ingest', graceSeconds: 3600 }])
    expect(screen.getByRole('button', { name: DEFAULT_STRINGS.copy })).toBeDefined()
    expect(screen.getByText('2026-10-08 13:00 UTC')).toBeDefined()

    await waitFor(() => expect(noticed.length).toBeGreaterThan(0))
    expect(JSON.stringify({ recorded, noticed })).not.toContain('SECRETA')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: merchantsStrings.backToMerchant }))
    })
    expect(application.router.state.location.pathname).toBe('/merchants/mrc_uno')
    expect(document.body.innerHTML).not.toContain('SECRETA')
  })

  it('elige la operación por la clase de la ruta', async () => {
    const { client, rotated } = ope()
    await mount(client, ALL, '/merchants/mrc_uno/rotate/signing')
    await screen.findByText(merchantsStrings.graceWhy)

    await act(async () => rotate())

    await waitFor(() => expect(rotated).toEqual([{ kind: 'signing', graceSeconds: 0 }]))
  })

  it('una clase que no existe dibuja «no existe»', async () => {
    const { client } = ope()
    await mount(client, ALL, '/merchants/mrc_uno/rotate/banana')

    await screen.findByText(merchantsStrings.rotateNotFound)
  })

  it('sin credentials:rotate, la ruta responde «sin permisos»', async () => {
    const { client } = ope()
    await mount(client, ['merchants:read'])

    await screen.findByText(DEFAULT_STRINGS.forbidden)
  })
})
