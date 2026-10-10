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
  ServicesProvider,
  StringsProvider,
  TelemetryProvider,
} from '@ope/core'
import { act, cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
/* Lo de `api/` llega por `data/`, que es lo único que puede tocarla (`CU-15`);
   y las pantallas, por la funcionalidad que las declara (`CU-47`). */
import { type Merchant, type OpeClient, opeService } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'

/**
 * **La ficha encabeza por nombre y muestra la identidad que el merchant tiene**
 * (feature 007, `ADR-045`), montada en la aplicación de verdad contra un
 * servicio `ope` de mentira. Lo que se afirma es lo que no se ve con un
 * merchant completo: que los campos ausentes no se dibujan, que sin identidad
 * se dice y no se inventa, y que el enlace abre en otra pestaña.
 */

afterEach(cleanup)

const [merchantsScreen, merchantScreen, newMerchantScreen, rotateScreen, editIdentityScreen] =
  merchants.screens

const base: Merchant = {
  merchantId: 'mrc_ficha',
  status: 'active',
  origins: ['https://ficha.example'],
  createdAt: '2026-10-09T12:00:00Z',
  credentials: [{ kind: 'ingest', issuedAt: '2026-10-09T12:00:00Z' }],
}

const full: Merchant = {
  ...base,
  displayName: 'Tienda Norte',
  storeUrl: 'https://www.norte.example/es/',
  contact: { name: 'Ana Smith', email: 'ana@norte.example', phone: '+54 11 5555', role: 'owner' },
  notes: 'Pilot since October.',
}

function ope(merchant: Merchant): OpeClient {
  return {
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

function providers(client: OpeClient) {
  return ({ children }: { readonly children: ReactNode }) => (
    <QueryProvider client={createQueryClient()}>
      <StringsProvider>
        <TelemetryProvider
          value={{ port: { record: () => {} }, app: 'console', version: 'v0', envelope: {} }}
        >
          <NoticesProvider>
            <ServicesProvider services={[opeService(client)]}>{children}</ServicesProvider>
          </NoticesProvider>
        </TelemetryProvider>
      </StringsProvider>
    </QueryProvider>
  )
}

async function mount(client: OpeClient, capabilities: readonly string[]) {
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
      opens(merchants.outcomes.identityEditRequested, editIdentityScreen, ({ merchantId }) => ({
        merchantId,
      })),
      finishes(merchants.outcomes.identityClosed, merchantScreen, ({ merchantId }) => ({
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
    ({ children }) => <>{children}</>,
  )

  await act(async () => {
    await application.router.navigate('/merchants/mrc_ficha')
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
}

const ALL = ['merchants:read', 'merchants:write', 'credentials:rotate', 'log:read']

describe('la ficha de un merchant con identidad', () => {
  it('encabeza por nombre y dibuja los siete valores, con la URL como enlace a otra pestaña', async () => {
    await mount(ope(full), ALL)
    await screen.findByText('Ana Smith')
    expect(screen.getAllByText('Tienda Norte').length).toBeGreaterThan(0)
    expect(screen.getByText('ana@norte.example')).toBeDefined()
    expect(screen.getByText('+54 11 5555')).toBeDefined()
    expect(screen.getByText('owner')).toBeDefined()
    expect(screen.getByText('Pilot since October.')).toBeDefined()
    const link = screen.getByText('https://www.norte.example/es/')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('href')).toBe('https://www.norte.example/es/')
    expect(screen.getByText(merchantsStrings.identitySection)).toBeDefined()
  })

  it('no dibuja los campos del contacto que no tiene, ni el contacto cuando no hay', async () => {
    const { contact: _contact, ...withoutContact } = full
    await mount(ope(withoutContact), ALL)
    await screen.findByText('Pilot since October.')
    expect(screen.queryByText(merchantsStrings.contactName)).toBeNull()
    expect(screen.queryByText(merchantsStrings.contactEmail)).toBeNull()
  })

  it('ofrece «editar identidad» con merchants:write, también sobre un desactivado, y no sin ella', async () => {
    await mount(ope({ ...full, status: 'deactivated' }), ALL)
    await screen.findByText('Ana Smith')
    expect(screen.getByRole('button', { name: merchantsStrings.editIdentity })).toBeDefined()
    cleanup()
    await mount(ope(full), ['merchants:read'])
    await screen.findByText('Ana Smith')
    expect(screen.queryByRole('button', { name: merchantsStrings.editIdentity })).toBeNull()
  })

  it('la fecha de alta lleva línea de base, como todo dato de sólo lectura (GR-30)', async () => {
    await mount(ope(full), ALL)
    await screen.findByText('Ana Smith')
    const dates = screen.getAllByText('09/10/2026')
    expect(dates.some((each) => each.closest('.granito-value') !== null)).toBe(true)
  })

  it('el secreto de firma que falta es una fila sin acuñar con «crear»; sobre un desactivado no está', async () => {
    await mount(ope(full), ALL)
    await screen.findByText('Ana Smith')
    expect(screen.getByText(merchantsStrings.notIssued)).toBeDefined()
    expect(screen.getByRole('button', { name: merchantsStrings.create })).toBeDefined()
    expect(screen.getByRole('button', { name: merchantsStrings.rotate })).toBeDefined()
    cleanup()
    await mount(ope({ ...full, status: 'deactivated' }), ALL)
    await screen.findByText('Ana Smith')
    expect(screen.queryByText(merchantsStrings.notIssued)).toBeNull()
    expect(screen.queryByRole('button', { name: merchantsStrings.create })).toBeNull()
  })

  it('sin identidad lo dice, encabeza por identificador y no inventa un nombre', async () => {
    await mount(ope(base), ALL)
    await screen.findByText(merchantsStrings.noIdentity)
    expect(screen.queryByText(merchantsStrings.storeUrl)).toBeNull()
    expect(screen.queryByText(merchantsStrings.notes)).toBeNull()
    expect(screen.getAllByText('mrc_ficha').length).toBeGreaterThan(0)
  })
})
