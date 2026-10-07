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
import { type Concurrency, useAction } from '../src/data/use-action'
import { NoticesProvider, useNoticeHost } from '../src/ui/use-notices'

/**
 * **Lo que la puerta hace con un rechazo por versión vieja** (`CU-29`).
 *
 * La prueba que más importa es la primera, y es la que no se ve: **cuando no
 * hay cruce no pasa nada**. Un operador que cambió el teléfono mientras otro
 * cambiaba el domicilio guarda y sigue trabajando; si acá apareciera un diálogo,
 * la protección sería el estorbo que la decisión existe para evitar.
 *
 * **Los avisos se miran de verdad.** Antes se declaraba una lista, se vaciaba
 * entre pruebas y no se escribía nunca: «no muestra nada» era el título y lo
 * único que se afirmaba era que el diálogo estaba vacío. Un aviso de falla en
 * el camino sin cruce habría dejado todo en verde.
 */

const fake = defineService<{ readonly ping: () => string }>('fake')
const SERVICES = [fake({ ping: () => 'pong' })]

afterEach(cleanup)

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

const writes = { roles: ['catalog:write'], idempotent: false, versioned: true }

type Body = { readonly name: string; readonly price: string; readonly version: string }

const cargado = { name: 'Amoxicilina', price: '2450.00' }

/**
 * Una acción que rechaza por versión vieja **las primeras `veces`**.
 *
 * Con una es la forma del caso real: el segundo intento lleva el testigo nuevo,
 * así que pasa. Con más, es el caso del tercero que sigue escribiendo — y sirve
 * para afirmar que la puerta **no encadena fusiones**. Guarda lo que recibió
 * para poder afirmar con qué testigo se guardó.
 */
function accionQueChoca(veces = 1) {
  const recibidos: Body[] = []
  let restantes = veces

  const escribir = operation('updateArticle', fake, writes, async (_s, body: Body) => {
    recibidos.push(body)
    if (restantes > 0) {
      restantes -= 1
      throw new RequestFailed(412, 'STALE_VERSION', '01JBQ', 'El registro cambió.')
    }
    return body.name
  })

  return {
    recibidos,
    action: defineAction({
      id: 'article.update',
      operations: { escribir },
      run: (input: Body, ops) => ops.escribir.run(input),
    }),
  }
}

const releyendo = (values: Record<string, unknown>) => async () => ({
  values,
  version: '"9"',
})

/**
 * La puerta montada, **con los avisos a la vista**.
 *
 * Que la lista salga del mismo `renderHook` es lo que deja afirmar «y no le
 * muestra nada al operador», que es la mitad de lo que estas pruebas prometen.
 */
function montar(action: ReturnType<typeof accionQueChoca>['action'], concurrency?: Concurrency) {
  return renderHook(
    () => ({
      action: useAction(action, concurrency ? { concurrency } : {}),
      avisos: useNoticeHost().notifications,
    }),
    { wrapper },
  )
}

const guardando = (result: { current: { action: { run: (input: Body) => Promise<void> } } }) =>
  act(async () => {
    await result.current.action.run({ name: 'Amoxicilina', price: '2600.00', version: '"1"' })
  })

describe('cuando el otro cambió algo que no se cruza', () => {
  it('vuelve a guardar con el testigo nuevo, y no le avisa de nada', async () => {
    /* **La prueba que decide si esto se usa o se evita.** El operador tocó el
       precio; el otro tocó el nombre. No hay nada que preguntar. */
    const { recibidos, action } = accionQueChoca()

    const { result } = montar(action, {
      loaded: cargado,
      onScreen: () => ({ ...cargado, price: '2600.00' }),
      retryWith: (values, version) => ({ ...values, version }),
      reread: releyendo({ ...cargado, name: 'Amoxicilina 750' }),
    })

    await guardando(result)

    expect(result.current.action.clash).toEqual([])
    /* Y se guardó dos veces: la que chocó, y la que llevó el testigo nuevo. */
    expect(recibidos).toHaveLength(2)
    expect(recibidos[1]?.version).toBe('"9"')

    /* **Un solo aviso, y es el de siempre.** El conflicto se resolvió y el
       operador no tiene por qué enterarse de que hubo uno. */
    expect(result.current.avisos.map((each) => each.tone)).toEqual(['success'])
  })

  it('y el reintento NO pisa lo que el otro cambió', async () => {
    /**
     * **La prueba que faltaba, y que encontró el punto de control.**
     *
     * El operador cambió el precio; el otro cambió el nombre. Sin fusionar, el
     * reintento manda el cuerpo original —con el nombre viejo— y **le borra el
     * cambio al otro en silencio**: no hay diálogo, no hay error, y la pantalla
     * dice «se guardó». Es exactamente lo que el mecanismo existe para evitar,
     * con un paso más.
     *
     * Lo que se manda es **lo del servidor con lo del operador encima**.
     */
    const { recibidos, action } = accionQueChoca()

    const { result } = montar(action, {
      loaded: cargado,
      onScreen: () => ({ ...cargado, price: '2600.00' }),
      retryWith: (values, version) => ({ ...values, version }),
      reread: releyendo({ ...cargado, name: 'Amoxicilina 750' }),
    })

    await guardando(result)

    /* El nombre, el del otro. El precio, el del operador. */
    expect(recibidos[1]?.name).toBe('Amoxicilina 750')
    expect(recibidos[1]?.price).toBe('2600.00')
  })

  it('y no encadena fusiones: si vuelve a chocar, avisa y para', async () => {
    /**
     * **Una sola fusión por gesto** (`CU-29`, `CU-25`).
     *
     * Un tercero que está escribiendo ahora mismo rechaza también el testigo
     * recién leído. Sin tope, la puerta relee, no encuentra cruce, escribe, y
     * vuelve a empezar — **un ciclo de escrituras completas** que sólo termina
     * cuando el otro se cansa. `CU-29` describe una relectura, y `CU-25` dice
     * que las escrituras no se reintentan.
     */
    const { recibidos, action } = accionQueChoca(5)

    const { result } = montar(action, {
      loaded: cargado,
      onScreen: () => ({ ...cargado, price: '2600.00' }),
      retryWith: (values, version) => ({ ...values, version }),
      reread: releyendo({ ...cargado, name: 'Amoxicilina 750' }),
    })

    await guardando(result)

    /* El primero y la fusión. **No hay un tercero.** */
    expect(recibidos).toHaveLength(2)
    /* Y el operador se entera, con el identificador del pedido: no se guardó. */
    expect(result.current.avisos).toHaveLength(1)
  })
})

describe('cuando sí se cruza', () => {
  const cruzando = {
    loaded: cargado,
    onScreen: () => ({ ...cargado, price: '2600.00' }),
    retryWith: (values: Readonly<Record<string, unknown>>, version: string) => ({
      ...values,
      version,
    }),
    reread: releyendo({ ...cargado, price: '3100.00' }),
  }

  it('muestra sólo el campo cruzado, y no vuelve a guardar', async () => {
    const { recibidos, action } = accionQueChoca()

    const { result } = montar(action, cruzando)
    await guardando(result)

    expect(result.current.action.clash).toEqual([
      { field: 'price', whenOpened: '2450.00', now: '3100.00' },
    ])
    /* **No se guardó encima.** `CU-29` lo descarta explícitamente: releer y
       escribir igual es sobrescribir el trabajo del otro con un paso más. */
    expect(recibidos).toHaveLength(1)

    /* **Y sin aviso**: lo que hay que decir lo dice el diálogo, y un aviso
       encima sería contarlo dos veces con dos tonos distintos. */
    expect(result.current.avisos).toEqual([])
  })

  it('y lo tecleado sigue donde estaba', async () => {
    /* La puerta no toca lo que el operador tiene en pantalla: entra como dato
       de la comparación y sale igual (`CU-9`). */
    const { action } = accionQueChoca()
    const enPantalla = { ...cargado, price: '2600.00' }
    const copia = { ...enPantalla }

    const { result } = montar(action, { ...cruzando, onScreen: () => enPantalla })
    await guardando(result)

    expect(enPantalla).toEqual(copia)
  })

  it('se puede descartar sin guardar', async () => {
    const { recibidos, action } = accionQueChoca()

    const { result } = montar(action, cruzando)
    await guardando(result)
    await act(async () => {
      result.current.action.dismissClash()
    })

    expect(result.current.action.clash).toEqual([])
    expect(recibidos).toHaveLength(1)
  })
})

describe('cuando la relectura falla', () => {
  it('no se guarda nada, y se avisa', async () => {
    /* No se puede comparar, así que no se puede decidir. Peor que el caso bueno,
       y mejor que pisar el trabajo del otro. */
    const { recibidos, action } = accionQueChoca()

    const { result } = montar(action, {
      loaded: cargado,
      onScreen: () => ({ ...cargado, price: '2600.00' }),
      retryWith: (values, version) => ({ ...values, version }),
      reread: async () => {
        throw new Error('sin red')
      },
    })

    await guardando(result)

    expect(result.current.action.clash).toEqual([])
    expect(recibidos).toHaveLength(1)
    /* **Callarse acá sería lo peor**: el operador creería que se guardó. */
    expect(result.current.avisos).toHaveLength(1)
  })
})

describe('sin nada declarado', () => {
  it('el rechazo no pisa nada, aunque no se pueda comparar', async () => {
    /* Una pantalla que no declara con qué comparar recibe menos que la
       protección entera — pero **nunca guarda encima**, que es lo que importa. */
    const { recibidos, action } = accionQueChoca()

    const { result } = montar(action)
    await guardando(result)

    expect(result.current.action.clash).toEqual([])
    expect(recibidos).toHaveLength(1)
  })
})
