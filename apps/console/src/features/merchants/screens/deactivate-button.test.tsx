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
 * **Desactivar pide confirmación, con la consecuencia dicha** (`GR-37`).
 *
 * Es terminal. Lo que se afirma es que un clic no desactiva nada: abre el
 * diálogo, y la acción corre sólo al confirmar. Montado en la aplicación de
 * verdad, porque la grilla informa desenlaces y los desenlaces necesitan su
 * flujo.
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

function ope() {
  const deactivated: string[] = []
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
    async deactivateMerchant(merchantId) {
      deactivated.push(merchantId)
      return { ...merchant, status: 'deactivated' }
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
  return { client, deactivated }
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
    await application.router.navigate('/merchants')
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

const deactivateButtons = () => screen.getAllByRole('button', { name: merchantsStrings.deactivate })

describe('desactivar', () => {
  it('un clic abre la confirmación y no desactiva nada', async () => {
    const { client, deactivated } = ope()
    await mount(client)
    await screen.findAllByText('mrc_uno')

    await act(async () => {
      fireEvent.click(deactivateButtons()[0] as HTMLElement)
    })

    expect(screen.getByText(merchantsStrings.deactivateConsequence)).toBeDefined()
    expect(deactivated).toHaveLength(0)
  })

  it('cancelar no desactiva; confirmar sí', async () => {
    const { client, deactivated } = ope()
    await mount(client)
    await screen.findAllByText('mrc_uno')

    await act(async () => {
      fireEvent.click(deactivateButtons()[0] as HTMLElement)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: DEFAULT_STRINGS.cancel }))
    })
    expect(deactivated).toHaveLength(0)

    await act(async () => {
      fireEvent.click(deactivateButtons()[0] as HTMLElement)
    })
    /* El «Desactivar» del diálogo —lo modal—, no el de la fila que quedó debajo. */
    const dialog = document.querySelector('[aria-modal="true"]')
    if (!(dialog instanceof HTMLElement)) throw new Error('el diálogo no está abierto')
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: merchantsStrings.deactivate }))
    })

    await waitFor(() => expect(deactivated).toEqual(['mrc_uno']))
  })
})
