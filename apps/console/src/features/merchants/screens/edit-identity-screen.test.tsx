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
  useNoticeHost,
} from '@ope/core'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ReactNode, useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
/* Lo de `api/` llega por `data/`, que es lo único que puede tocarla (`CU-15`);
   y las pantallas, por la funcionalidad que las declara (`CU-47`). */
import {
  type Merchant,
  type MerchantProfileInput,
  type OpeClient,
  opeService,
} from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'

/**
 * **La identidad se edita entera, precargada, y el `422` cae en su campo**
 * (feature 007, `ADR-045`), montada en la aplicación de verdad contra un
 * servicio `ope` de mentira. Lo que se afirma es lo que no se ve con el caso
 * feliz: lo vacío no viaja, un contacto a medias no sale, el contacto no llega
 * a ningún aviso ni registro, y sin la capacidad la ruta no abre.
 */

afterEach(cleanup)

const [merchantsScreen, merchantScreen, newMerchantScreen, rotateScreen, editIdentityScreen] =
  merchants.screens

const full: Merchant = {
  merchantId: 'mrc_edit',
  status: 'active',
  origins: ['https://edit.example'],
  createdAt: '2026-10-09T12:00:00Z',
  credentials: [{ kind: 'ingest', issuedAt: '2026-10-09T12:00:00Z' }],
  displayName: 'Tienda Norte',
  storeUrl: 'https://www.norte.example',
  contact: { name: 'Ana Secreta', email: 'ana.secreta@norte.example', role: 'owner' },
  notes: 'Pilot.',
}

function ope(options: { readonly updateFails?: RequestFailed } = {}) {
  const updated: MerchantProfileInput[] = []
  const client: OpeClient = {
    async listMerchants() {
      return { items: [full] }
    },
    async listMerchantAdminLog() {
      return { items: [] }
    },
    async getMerchant() {
      return full
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
    async updateMerchantProfile(_id, body) {
      updated.push(body)
      if (options.updateFails) throw options.updateFails
      return { ...full, ...body }
    },
    async getMerchantConfiguration() {
      throw new Error('no se prueba acá')
    },
    async listConfigurationVersions() {
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
  }
  return { client, updated }
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
        'new-merchant': [
          merchants.outcomes.merchantCreated.id,
          merchants.outcomes.newMerchantCancelled.id,
        ],
        rotate: [merchants.outcomes.rotationClosed.id],
        'edit-identity': [merchants.outcomes.identityClosed.id],
      },
      outcomes: Object.values(merchants.outcomes),
      toCapabilities: () => new Set(capabilities),
      systems: ['ope'],
    },
    ({ children }: { readonly children: ReactNode }) => <>{children}</>,
  )

  await act(async () => {
    await application.router.navigate('/merchants/mrc_edit/identity')
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

const ALL = ['merchants:read', 'merchants:write']

const field = (label: string) =>
  screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement | HTMLTextAreaElement

function set(label: string, value: string) {
  fireEvent.change(field(label), { target: { value } })
  fireEvent.blur(field(label))
}

const save = () =>
  fireEvent.click(screen.getByRole('button', { name: merchantsStrings.saveIdentity }))

describe('editar la identidad de un merchant', () => {
  afterEach(() => {
    recorded.length = 0
    noticed.length = 0
  })

  it('precarga los siete valores, y guardar manda la identidad entera sin vacíos', async () => {
    const { client, updated } = ope()
    const application = await mount(client, ALL)
    await screen.findByText(merchantsStrings.editIdentityWhy)

    expect(field(merchantsStrings.name).value).toBe('Tienda Norte')
    expect(field(merchantsStrings.storeUrl).value).toBe('https://www.norte.example')
    expect(field(merchantsStrings.contactName).value).toBe('Ana Secreta')
    expect(field(merchantsStrings.contactEmail).value).toBe('ana.secreta@norte.example')
    expect(field(merchantsStrings.contactPhone).value).toBe('')
    expect(field(merchantsStrings.contactRole).value).toBe('owner')
    expect(field(merchantsStrings.notes).value).toBe('Pilot.')

    await act(async () => {
      set(merchantsStrings.name, 'Tienda Norte SA')
      set(merchantsStrings.storeUrl, '')
    })
    await act(async () => save())

    await waitFor(() => expect(updated).toHaveLength(1))
    expect(updated[0]).toEqual({
      displayName: 'Tienda Norte SA',
      contact: { name: 'Ana Secreta', email: 'ana.secreta@norte.example', role: 'owner' },
      notes: 'Pilot.',
    })
    /* Termina en la ficha, y el aviso dice el nombre y nunca el contacto. */
    await waitFor(() =>
      expect(application.router.state.location.pathname).toBe('/merchants/mrc_edit'),
    )
    await waitFor(() => expect(noticed.length).toBeGreaterThan(0))
    const everything = JSON.stringify({ recorded, noticed })
    expect(everything).toContain('Tienda Norte SA')
    expect(everything).not.toContain('Secreta')
    expect(everything).not.toContain('ana.secreta')
  })

  it('un 422 con puntero cae en la URL, y otro en el email del contacto', async () => {
    const { client } = ope({
      updateFails: new RequestFailed({
        status: 422,
        type: 'invalid-merchant-profile',
        title: 'A field of the merchant identity is not what it says it is',
        errors: [
          { pointer: '/body/storeUrl', message: 'Sólo parece una URL.' },
          { pointer: '/body/contact/email', message: 'Con espacios.' },
        ],
      }),
    })
    await mount(client, ALL)
    await screen.findByText(merchantsStrings.editIdentityWhy)

    await act(async () => set(merchantsStrings.storeUrl, 'https://'))
    await act(async () => save())

    await screen.findByText('Sólo parece una URL.')
    expect(field(merchantsStrings.storeUrl).getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Con espacios.')).toBeDefined()
    expect(field(merchantsStrings.contactEmail).getAttribute('aria-invalid')).toBe('true')
  })

  it('vaciar nombre y email del contacto lo quita; dejar uno solo es un error de capa 1', async () => {
    const { client, updated } = ope()
    await mount(client, ALL)
    await screen.findByText(merchantsStrings.editIdentityWhy)

    await act(async () => {
      set(merchantsStrings.contactName, '')
    })
    await act(async () => save())
    expect(updated).toHaveLength(0)
    expect(field(merchantsStrings.contactName).getAttribute('aria-invalid')).toBe('true')

    await act(async () => {
      set(merchantsStrings.contactEmail, '')
      set(merchantsStrings.contactRole, '')
    })
    await act(async () => save())
    await waitFor(() => expect(updated).toHaveLength(1))
    expect(updated[0]).not.toHaveProperty('contact')
  })

  it('un email sin forma no se manda: el campo lo dice', async () => {
    const { client, updated } = ope()
    await mount(client, ALL)
    await screen.findByText(merchantsStrings.editIdentityWhy)

    await act(async () => set(merchantsStrings.contactEmail, 'ana-sin-arroba'))
    await act(async () => save())

    expect(updated).toHaveLength(0)
    expect(screen.getByText(merchantsStrings.shape.badEmail)).toBeDefined()
  })

  it('cancelar vuelve a la ficha sin guardar', async () => {
    const { client, updated } = ope()
    const application = await mount(client, ALL)
    await screen.findByText(merchantsStrings.editIdentityWhy)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: merchantsStrings.cancel }))
    })
    await waitFor(() =>
      expect(application.router.state.location.pathname).toBe('/merchants/mrc_edit'),
    )
    expect(updated).toHaveLength(0)
  })

  it('sin merchants:write, la ruta responde «sin permisos»', async () => {
    const { client } = ope()
    await mount(client, ['merchants:read'])
    await waitFor(() => expect(screen.queryByText(merchantsStrings.editIdentityWhy)).toBeNull())
    expect(screen.queryByRole('button', { name: merchantsStrings.saveIdentity })).toBeNull()
  })
})
