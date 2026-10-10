// @vitest-environment jsdom
import {
  ApplicationView,
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
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { type Merchant, type OpeClient, opeService } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'

/**
 * **El interruptor confirma, refleja el estado, y un `409` refresca la ficha**
 * (`GR-37`, `CU-25`).
 *
 * Lo que se afirma es lo que no se ve con el caso feliz: que un clic no apaga
 * nada, que sobre uno apagado se ofrece encender y sobre uno desactivado nada,
 * y que cuando el servidor dice que no la ficha se vuelve a pedir y dice lo
 * que ahora es cierto.
 */

afterEach(cleanup)

const [merchantsScreen, merchantScreen, newMerchantScreen, rotateScreen, editIdentityScreen] =
  merchants.screens

const base: Merchant = {
  merchantId: 'mrc_uno',
  status: 'active',
  origins: ['https://uno.example'],
  createdAt: '2026-09-20T12:00:00Z',
  credentials: [],
}

function ope(initial: Merchant['status'], options: { readonly switchFails?: RequestFailed } = {}) {
  const state = { status: initial, reads: 0, switched: [] as boolean[] }
  const client: OpeClient = {
    async listMerchants() {
      return { items: [{ ...base, status: state.status }] }
    },
    async listMerchantAdminLog() {
      return { items: [] }
    },
    async getMerchant() {
      state.reads += 1
      return { ...base, status: state.status, witness: '"w-1"' }
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
    async updateMerchantProfile() {
      throw new Error('no se prueba acá')
    },
    async getMerchantConfiguration() {
      throw new Error('no se prueba acá')
    },
    async listConfigurationVersions() {
      throw new Error('no se prueba acá')
    },
    async getMerchantConfigurationVersion() {
      throw new Error('no se prueba acá')
    },
    async publishMerchantConfiguration() {
      throw new Error('no se prueba acá')
    },
    async getPlatformConfiguration() {
      throw new Error('no se prueba acá')
    },
    async listPlatformConfigurationVersions() {
      throw new Error('no se prueba acá')
    },
    async getPlatformConfigurationVersion() {
      throw new Error('no se prueba acá')
    },
    async publishPlatformConfiguration() {
      throw new Error('no se prueba acá')
    },
    async getTreatmentDefaults() {
      throw new Error('no se prueba acá')
    },
    async listTreatmentDefaultsVersions() {
      throw new Error('no se prueba acá')
    },
    async getTreatmentDefaultsVersion() {
      throw new Error('no se prueba acá')
    },
    async publishTreatmentDefaults() {
      throw new Error('no se prueba acá')
    },
    async setKillSwitch(_id, body) {
      state.switched.push(body.enabled)
      if (options.switchFails) {
        /* Lo que un `409 merchant-deactivated` significa: otro lo desactivó. */
        state.status = 'deactivated'
        throw options.switchFails
      }
      state.status = body.enabled ? 'active' : 'off'
      return body
    },
  }
  return { client, state }
}

async function mount(client: OpeClient) {
  const capabilities = ['merchants:read', 'merchants:write']
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
      /* La edición de la identidad (feature 007): la ficha la ofrece, así que el flujo la cablea. */
      opens(merchants.outcomes.identityEditRequested, editIdentityScreen, ({ merchantId }) => ({
        merchantId,
      })),
      finishes(merchants.outcomes.identityClosed, merchantScreen, ({ merchantId }) => ({
        merchantId,
      })),
      /* La configuración es de otra funcionalidad: acá basta con que el
         desenlace tenga paso, y la ficha sirve de destino. */
      opens(merchants.outcomes.configurationRequested, merchantScreen, ({ merchantId }) => ({
        merchantId,
      })),
    ],
  })
  const application = createApplication(
    {
      name: 'console',
      screens: [
        merchantsScreen,
        merchantScreen,
        newMerchantScreen,
        rotateScreen,
        editIdentityScreen,
      ],
      flows: [flow],
      menu: [flow],
      featureRootOf: {
        merchants: 'merchants',
        merchant: 'merchants',
        'new-merchant': 'merchants',
        rotate: 'merchants',
        'edit-identity': 'merchants',
      },
      outcomesOf: {
        merchants: [merchants.outcomes.merchantChosen.id, merchants.outcomes.merchantRequested.id],
        merchant: [
          merchants.outcomes.merchantClosed.id,
          merchants.outcomes.rotationRequested.id,
          merchants.outcomes.identityEditRequested.id,
          merchants.outcomes.configurationRequested.id,
        ],
        'edit-identity': [merchants.outcomes.identityClosed.id],
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
    await application.router.navigate('/merchants/mrc_uno')
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
}

const modal = () => {
  const dialog = document.querySelector('[aria-modal="true"]')
  if (!(dialog instanceof HTMLElement)) throw new Error('el diálogo no está abierto')
  return within(dialog)
}

describe('el interruptor', () => {
  it('un clic abre la confirmación con la consecuencia, y no apaga nada', async () => {
    const { client, state } = ope('active')
    await mount(client)
    await screen.findByText('mrc_uno')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: merchantsStrings.turnOff }))
    })

    expect(screen.getByText(merchantsStrings.turnOffConsequence)).toBeDefined()
    expect(state.switched).toHaveLength(0)
  })

  it('confirmar apaga, y la ficha pasa a decir «apagado» y ofrecer encender', async () => {
    const { client, state } = ope('active')
    await mount(client)
    await screen.findByText('mrc_uno')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: merchantsStrings.turnOff }))
    })
    await act(async () => {
      fireEvent.click(modal().getByRole('button', { name: merchantsStrings.turnOff }))
    })

    await waitFor(() => expect(state.switched).toEqual([false]))
    await screen.findByRole('button', { name: merchantsStrings.turnOn })
    expect(screen.getByText(merchantsStrings.off)).toBeDefined()
  })

  it('sobre uno desactivado no se dibuja', async () => {
    const { client } = ope('deactivated')
    await mount(client)
    await screen.findByText('mrc_uno')

    expect(screen.queryByRole('button', { name: merchantsStrings.turnOff })).toBeNull()
    expect(screen.queryByRole('button', { name: merchantsStrings.turnOn })).toBeNull()
  })

  it('con un 409 la ficha se vuelve a pedir y dice lo que ahora es cierto', async () => {
    const { client, state } = ope('active', {
      switchFails: new RequestFailed({
        status: 409,
        type: 'merchant-deactivated',
        title: 'The merchant is deactivated',
      }),
    })
    await mount(client)
    await screen.findByText('mrc_uno')
    const readsBefore = state.reads

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: merchantsStrings.turnOff }))
    })
    await act(async () => {
      fireEvent.click(modal().getByRole('button', { name: merchantsStrings.turnOff }))
    })

    await waitFor(() => expect(state.reads).toBeGreaterThan(readsBefore))
    await screen.findByText(merchantsStrings.deactivated)
    expect(screen.queryByRole('button', { name: merchantsStrings.turnOff })).toBeNull()
  })
})
