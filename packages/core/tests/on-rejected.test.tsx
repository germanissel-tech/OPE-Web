// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { TelemetryProvider } from '../src/base/telemetry'
import { StringsProvider } from '../src/base/use-strings'
import { defineAction, operation } from '../src/data/action'
import { RequestFailed } from '../src/data/envelope'
import { createQueryClient } from '../src/data/query'
import { defineService, ServicesProvider } from '../src/data/service'
import { useAction } from '../src/data/use-action'
import { NoticesProvider, useNoticeHost } from '../src/ui/use-notices'

/**
 * **Cuando el servidor contesta que no, la pantalla se entera después del
 * aviso** (`CU-25`).
 *
 * Lo que se afirma es lo que separa un rechazo de una falla: con un `409` o un
 * `422` la pantalla recibe la respuesta y puede volver a pedir lo que mostraba;
 * con un fallo de red no recibe nada, porque no hay estado nuevo que mirar.
 */

afterEach(cleanup)

const fake = defineService<{ readonly ping: () => string }>('fake')
const SERVICES = [fake({ ping: () => 'pong' })]

function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={createQueryClient()}>
      <StringsProvider>
        <TelemetryProvider
          value={{ port: { record: () => {} }, app: 'demo', version: 'v1', envelope: {} }}
        >
          <NoticesProvider>
            <ServicesProvider services={SERVICES}>{children}</ServicesProvider>
          </NoticesProvider>
        </TelemetryProvider>
      </StringsProvider>
    </QueryClientProvider>
  )
}

const writes = { capabilities: ['thing:write'] }

function actionThat(outcome: () => Promise<string>) {
  const write = operation('updateThing', fake, writes, async (_s, _: string) => outcome())
  return defineAction({
    id: 'thing.update',
    operations: { write },
    run: (input: string, ops) => ops.write.run(input),
  })
}

const conflict = () =>
  Promise.reject(
    new RequestFailed({ status: 409, type: 'thing-closed', title: 'The thing is closed' }),
  )

describe('onRejected', () => {
  it('corre con un rechazo del servidor, después del aviso', async () => {
    const seen: string[] = []
    const { result } = renderHook(
      () => ({
        action: useAction(actionThat(conflict), {
          onRejected: (failed) => {
            seen.push(`rejected:${failed.status}`)
          },
        }),
        notices: useNoticeHost().notifications,
      }),
      { wrapper },
    )

    await act(async () => {
      await result.current.action.run('x')
    })

    expect(seen).toEqual(['rejected:409'])
    expect(result.current.notices.length).toBeGreaterThan(0)
  })

  it('no corre con un fallo de red: no hay estado nuevo que mirar', async () => {
    const seen: string[] = []
    const { result } = renderHook(
      () =>
        useAction(
          actionThat(() => Promise.reject(new Error('socket hang up'))),
          {
            onRejected: () => {
              seen.push('rejected')
            },
          },
        ),
      { wrapper },
    )

    await act(async () => {
      await result.current.run('x').catch(() => undefined)
    })

    expect(seen).toEqual([])
  })

  it('no corre cuando salió bien: para eso está onDone', async () => {
    const seen: string[] = []
    const { result } = renderHook(
      () =>
        useAction(
          actionThat(() => Promise.resolve('ok')),
          {
            onDone: () => {
              seen.push('done')
            },
            onRejected: () => {
              seen.push('rejected')
            },
          },
        ),
      { wrapper },
    )

    await act(async () => {
      await result.current.run('x')
    })

    expect(seen).toEqual(['done'])
  })
})
