// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { type TelemetryEvent, TelemetryProvider } from '../src/base/telemetry'
import { StringsProvider } from '../src/base/use-strings'
import { defineAction, operation } from '../src/data/action'
import { RequestFailed } from '../src/data/envelope'
import { createQueryClient } from '../src/data/query'
import { defineService, ServicesProvider } from '../src/data/service'
import { useAction } from '../src/data/use-action'
import { NoticesProvider } from '../src/ui/use-notices'

/**
 * **Lo que queda registrado, y lo que no** (`CU-25`, `CU-35`).
 *
 * Se prueba porque es **lo que no se ve por definición**: el registro no está en
 * la pantalla. Un `403` que no deja rastro se ve exactamente igual que uno que
 * sí —el operador recibe el mismo aviso— y la diferencia sólo aparece el día que
 * alguien busca qué pantalla lo produjo y no encuentra nada.
 */

const fake = defineService<{ readonly ping: () => string }>('fake')
const SERVICES = [fake({ ping: () => 'pong' })]

const recorded: TelemetryEvent[] = []

afterEach(() => {
  cleanup()
  recorded.length = 0
})

function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={createQueryClient()}>
      <StringsProvider>
        <TelemetryProvider
          value={{
            port: { record: (each) => recorded.push(each.event) },
            app: 'demo',
            version: 'v1',
            envelope: {},
          }}
        >
          <NoticesProvider>
            <ServicesProvider services={SERVICES}>{children}</ServicesProvider>
          </NoticesProvider>
        </TelemetryProvider>
      </StringsProvider>
    </QueryClientProvider>
  )
}

const writes = { capabilities: ['catalog:write'] }

/** Una acción que falla con el código que se le pida. */
const failingWith = (code: string, status = 403) =>
  defineAction({
    id: 'article.create',
    operations: {
      create: operation('createArticle', fake, writes, async () => {
        throw new RequestFailed({ status, type: code, title: 'No se pudo.', requestId: 'req-1' })
      }),
    },
    /* **`void` acá es funcional, no un descuido**: es lo que deja llamar la
       acción sin argumento. Con `undefined` hay que pasarlo explícito, y las
       tres llamadas de abajo dejan de compilar. */
    // biome-ignore lint/suspicious/noConfusingVoidType: sin entrada, y así se invoca sin argumento
    run: (_input: void, ops) => ops.create.run(undefined as never),
  })

const ran = () => recorded.filter((each) => each.kind === 'actionRan')
const failures = () => recorded.filter((each) => each.kind === 'requestFailed')

describe('un error que es defecto nuestro', () => {
  it('deja rastro, con el pedido y la pantalla', async () => {
    /* `CU-3` dice que lo que un permiso no habilita no se muestra, así que un
       `403` significa que la pantalla ofreció algo que no correspondía. */
    const { result } = renderHook(() => useAction(failingWith('capability-missing')), { wrapper })

    await act(async () => {
      result.current.run()
    })

    expect(failures()).toHaveLength(1)
    expect(failures()[0]).toMatchObject({ code: 'capability-missing', requestId: 'req-1' })
  })

  it('una escritura que salió sin su testigo también (`CU-29`)', async () => {
    /* El testigo lo pone la pantalla que leyó el registro: si el servidor dice
       que faltó, la que falló es la pantalla. */
    const { result } = renderHook(() => useAction(failingWith('witness-required')), { wrapper })

    await act(async () => {
      result.current.run()
    })

    expect(failures()).toHaveLength(1)
    expect(failures()[0]).toMatchObject({ code: 'witness-required', requestId: 'req-1' })
  })

  it('un merchant fuera del alcance también', async () => {
    /* La pantalla ofreció operar sobre un merchant que la sesión no alcanza:
       `CU-3` dice que eso no se dibuja. */
    const { result } = renderHook(() => useAction(failingWith('merchant-out-of-scope')), {
      wrapper,
    })

    await act(async () => {
      result.current.run()
    })

    expect(failures()).toHaveLength(1)
  })

  it('y un alcance más angosto que lo pedido, también', async () => {
    /* `operator-scope-too-narrow`: el operador pidió algo sobre más merchants
       de los que su alcance cubre. El operador no puede hacer nada con eso, así
       que lo único útil es que quede registrado del lado de quien sí puede. */
    const { result } = renderHook(() => useAction(failingWith('operator-scope-too-narrow')), {
      wrapper,
    })

    await act(async () => {
      result.current.run()
    })

    expect(failures()).toHaveLength(1)
  })
})

describe('un rechazo de negocio', () => {
  it('**no** deja rastro de defecto: el sistema funcionó', async () => {
    /* Registrarlo como defecto nuestro llenaría el tablero de reglas de negocio
       y taparía los que sí lo son. */
    const { result } = renderHook(() => useAction(failingWith('merchant-deactivated', 409)), {
      wrapper,
    })

    await act(async () => {
      result.current.run()
    })

    expect(failures()).toHaveLength(0)
  })

  it('y se cuenta aparte de una falla', async () => {
    /* Sin separarlos, un tablero cuenta reglas de negocio como errores del
       sistema y el número deja de decir nada. */
    const { result } = renderHook(() => useAction(failingWith('merchant-deactivated', 409)), {
      wrapper,
    })

    await act(async () => {
      result.current.run()
    })

    expect(ran()[0]).toMatchObject({ outcome: 'rejected' })
  })
})

describe('cuánto tardó', () => {
  it('se mide en la puerta, que es donde ya se sabe', async () => {
    const { result } = renderHook(() => useAction(failingWith('INTERNAL_ERROR', 500)), { wrapper })

    await act(async () => {
      result.current.run()
    })

    expect(ran()[0]).toMatchObject({ action: 'article.create', outcome: 'failed' })
    expect(ran()[0]).toHaveProperty('durationMs')
  })
})
