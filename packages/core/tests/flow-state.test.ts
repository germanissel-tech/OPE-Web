import { describe, expect, it } from 'vitest'
import {
  type FlowState,
  type StackEntry,
  toClose,
  toEnter,
  toFinish,
  toOpen,
} from '../src/base/flow-state'

/**
 * **Las tres transiciones de la pila** (`CU-47`).
 *
 * Se prueban acá y no mirando una pantalla porque son aritmética, y porque lo
 * que se rompe es invisible: una pila con un escalón de más no se ve hasta que
 * alguien cierra dos veces y termina en un formulario que ya envió.
 *
 * `GR-73` se trazó en papel y granito lo dijo. Esto es lo más cerca que se
 * puede estar de agotar el papel antes de que haya una pantalla real.
 */

const at = (screen: string, params: Record<string, string> = {}): StackEntry => ({ screen, params })

const flow = (...stack: StackEntry[]): FlowState => ({ flow: 'catalog', stack })

describe('abrir', () => {
  it('apila cuando el destino no está', () => {
    const move = toOpen(flow(at('catalogGrid')), at('catalogForm', { id: '7' }))

    expect(move.kind).toBe('push')
    expect(move.kind === 'push' && move.state.stack).toEqual([
      at('catalogGrid'),
      at('catalogForm', { id: '7' }),
    ])
  })

  it('desenrolla cuando el destino ya está abajo', () => {
    const move = toOpen(flow(at('catalogGrid'), at('catalogForm', { id: '7' })), at('catalogGrid'))

    expect(move).toEqual({
      kind: 'unwind',
      steps: 1,
      state: { flow: 'catalog', stack: [at('catalogGrid')] },
    })
  })

  it('no hace nada si el destino es donde ya estás', () => {
    /* Sin esto, abrir la pantalla actual apilaría un duplicado y cerrar
       parecería no hacer nada: el operador aprieta y ve la misma pantalla. */
    expect(toOpen(flow(at('catalogGrid')), at('catalogGrid')).kind).toBe('stay')
  })

  it('desenrolla varios de una', () => {
    /* De a uno, el operador vería pasar las pantallas intermedias. */
    const move = toOpen(flow(at('a'), at('b'), at('c'), at('d')), at('a'))

    expect(move.kind === 'unwind' && move.steps).toBe(3)
  })
})

describe('la identidad de un escalón, que es lo que resuelve la recursión', () => {
  it('el mismo movimiento con otro dato apila, porque es otro escalón', () => {
    /* `movimiento#7 → movimiento vinculado#9`. Con la pantalla sola esto
       desenrollaría al #7 y el #9 no se vería nunca. */
    const move = toOpen(flow(at('movement', { id: '7' })), at('movement', { id: '9' }))

    expect(move.kind).toBe('push')
  })

  it('volver al primero desenrolla, así que el ciclo no crece', () => {
    const move = toOpen(
      flow(at('movement', { id: '7' }), at('movement', { id: '9' })),
      at('movement', { id: '7' }),
    )

    expect(move.kind === 'unwind' && move.steps).toBe(1)
  })

  it('un parámetro de más no es el mismo escalón', () => {
    const move = toOpen(flow(at('report', { id: '7' })), at('report', { id: '7', tab: 'items' }))

    expect(move.kind).toBe('push')
  })

  it('los parámetros se comparan por valor, no por orden ni por referencia', () => {
    const move = toOpen(
      flow(at('report', { id: '7', tab: 'items' })),
      at('report', { tab: 'items', id: '7' }),
    )

    expect(move.kind).toBe('stay')
  })
})

describe('terminar', () => {
  it('reemplaza el escalón actual cuando el destino no está en la pila', () => {
    /* Cobrar desde la ficha y ver el comprobante emitido: si esto apilara,
       cerrar devolvería **al formulario de cobro que se acaba de enviar** — el
       caso con el que `GR-36` argumentó contra la pila entera. */
    const move = toFinish(flow(at('accountView'), at('chargeForm')), at('receipt', { id: '3' }))

    expect(move).toEqual({
      kind: 'replace',
      state: { flow: 'catalog', stack: [at('accountView'), at('receipt', { id: '3' })] },
    })
  })

  it('desenrolla cuando el destino ya está en la pila', () => {
    const move = toFinish(
      flow(at('catalogGrid'), at('catalogForm', { id: '7' })),
      at('catalogGrid'),
    )

    expect(move.kind === 'unwind' && move.steps).toBe(1)
  })

  it('reemplazar no alarga la pila, y ahí está la diferencia con abrir', () => {
    const start = flow(at('a'), at('b'))
    const opened = toOpen(start, at('c'))
    const finished = toFinish(start, at('c'))

    expect(opened.kind === 'push' && opened.state.stack).toHaveLength(3)
    expect(finished.kind === 'replace' && finished.state.stack).toHaveLength(2)
  })

  it('una secuencia de tres termina en dos escalones, no en cuatro', () => {
    /* `correr → seguimiento → liquidación`, que `GR-73` marca como el caso
       donde apilar produce un rulo. */
    let stack = flow(at('home'), at('run'))
    const one = toFinish(stack, at('tracking', { id: '1' }))
    stack = one.kind === 'replace' ? one.state : stack
    const two = toFinish(stack, at('settlement', { id: '1' }))

    expect(two.kind === 'replace' && two.state.stack).toEqual([
      at('home'),
      at('settlement', { id: '1' }),
    ])
  })
})

describe('cerrar', () => {
  it('desapila uno', () => {
    const move = toClose(flow(at('catalogGrid'), at('catalogForm', { id: '7' })), 'catalogGrid')

    expect(move).toEqual({
      kind: 'unwind',
      steps: 1,
      state: { flow: 'catalog', stack: [at('catalogGrid')] },
    })
  })

  it('con un solo escalón cae a la raíz, que no es un caso raro', () => {
    /* Pasa cada vez que alguien llega por un enlace pegado o abre una pestaña
       nueva. Una pantalla cuyo cerrar no hace nada es una pantalla incompleta
       (`GR-73`). */
    expect(toClose(flow(at('catalogForm', { id: '7' })), 'catalogGrid')).toEqual({
      kind: 'root',
      flow: 'catalog',
    })
  })

  it('con la pila vacía también, en vez de romperse', () => {
    expect(toClose(flow(), 'catalogGrid')).toEqual({ kind: 'root', flow: 'catalog' })
  })

  it('cerrar dos veces desde tres escalones deja uno, y después la raíz', () => {
    const first = toClose(flow(at('a'), at('b'), at('c')), 'raiz')
    const second = first.kind === 'unwind' ? toClose(first.state, 'raiz') : first

    expect(second.kind === 'unwind' && second.state.stack).toEqual([at('a')])
    expect(toClose({ flow: 'catalog', stack: [at('a')] }, 'raiz')).toEqual({
      kind: 'root',
      flow: 'catalog',
    })
  })
})

describe('ninguna transición muta lo que recibe', () => {
  it('la pila de entrada queda igual', () => {
    /* El estado viene de `history.state`: mutarlo sería cambiar el pasado, y el
       botón «atrás» mostraría algo que nunca existió. */
    const start = flow(at('a'), at('b'))
    const before = JSON.stringify(start)

    toOpen(start, at('c'))
    toFinish(start, at('c'))
    toClose(start, 'raiz')

    expect(JSON.stringify(start)).toBe(before)
  })
})

describe('entrar por un enlace pegado', () => {
  it('la pila arranca con la pantalla actual, no vacía', () => {
    expect(toEnter('catalog', at('catalogForm', { id: '7' }))).toEqual({
      flow: 'catalog',
      stack: [at('catalogForm', { id: '7' })],
    })
  })

  it('cerrar desde ahí cae a la raíz', () => {
    expect(toClose(toEnter('catalog', at('catalogForm', { id: '7' })), 'catalogGrid')).toEqual({
      kind: 'root',
      flow: 'catalog',
    })
  })

  it('y lo que se abra desde ahí vuelve a ella, que es por lo que no arranca en cero', () => {
    /* Con la pila en cero, este cerrar caería a la raíz y **el artículo del
       enlace se perdería** — el operador vuelve a un lugar donde no estuvo. */
    const entered = toEnter('catalog', at('catalogForm', { id: '7' }))
    const opened = toOpen(entered, at('priceHistory', { id: '7' }))
    const closed = opened.kind === 'push' ? toClose(opened.state, 'catalogGrid') : opened

    expect(closed.kind === 'unwind' && closed.state.stack).toEqual([at('catalogForm', { id: '7' })])
  })
})

describe('cerrar parado en la raíz del flujo', () => {
  /**
   * **No hace nada, y ésa es la corrección.**
   *
   * Caer a la raíz estando en la raíz apila una entrada idéntica. No se ve —la
   * dirección no cambia—, pero el «atrás» siguiente tampoco hace nada visible:
   * el operador aprieta dos veces para salir de una pantalla y no entiende por
   * qué.
   */
  it('se queda, en vez de apilar la misma dirección otra vez', () => {
    expect(toClose(flow(at('catalogGrid')), 'catalogGrid')).toEqual({ kind: 'stay' })
  })

  it('pero un escalón que NO es la raíz sí cae a ella', () => {
    /* La diferencia que hay que conservar: la ficha alcanzada por un enlace
       pegado tiene un solo escalón y cerrar **sí** tiene que llevar a la grilla. */
    expect(toClose(flow(at('catalogForm', { id: '7' })), 'catalogGrid')).toEqual({
      kind: 'root',
      flow: 'catalog',
    })
  })

  it('y con parámetros no es la raíz, aunque sea la misma pantalla', () => {
    /* La identidad de un escalón es pantalla **más parámetros** (`CU-47`), y
       acá vale igual: una grilla con un parámetro no es la raíz pelada. */
    expect(toClose(flow(at('catalogGrid', { id: '7' })), 'catalogGrid')).toEqual({ kind: 'stay' })
  })
})
