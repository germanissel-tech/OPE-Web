import { describe, expect, it } from 'vitest'
import { createSessionStore } from '../src/store'

const sinCapacidades = () => new Set<string>()

describe('el almacén de la sesión', () => {
  it('avisa cuando el estado cambió', () => {
    const store = createSessionStore(sinCapacidades)
    let avisos = 0
    store.subscribe(() => {
      avisos += 1
    })

    store.apply({ type: 'resolved', subject: 'a', claims: { sub: 'a' } })

    expect(avisos).toBe(1)
    expect(store.getState().status).not.toBe('resolving')
  })

  it('NO avisa si el evento no correspondía', () => {
    /* La máquina ignora las transiciones que no van (`state.ts`). Redibujar por
       un evento que no hizo nada es ruido, y en una grilla grande se nota. */
    const store = createSessionStore(sinCapacidades)
    let avisos = 0
    store.subscribe(() => {
      avisos += 1
    })

    store.apply({ type: 'returned', subject: 'a', claims: { sub: 'a' } })

    expect(avisos).toBe(0)
  })

  it('deja de avisar al que se dio de baja', () => {
    const store = createSessionStore(sinCapacidades)
    let avisos = 0
    const baja = store.subscribe(() => {
      avisos += 1
    })

    baja()
    store.apply({ type: 'resolved', subject: 'a', claims: { sub: 'a' } })

    expect(avisos).toBe(0)
  })
})
