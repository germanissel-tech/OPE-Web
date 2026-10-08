import { describe, expect, it } from 'vitest'
import { createSessionStore } from '../src/store'

const sinCapacidades = () => new Set<string>()
const conCapacidades = () => new Set(['merchants:read'])

describe('la máquina, con la entrada desde anonymous', () => {
  it('desde anonymous se entra: es lo que un ingreso con credencial necesita', () => {
    const store = createSessionStore(conCapacidades)
    store.apply({ type: 'no-session' })
    expect(store.getState().status).toBe('anonymous')

    store.apply({ type: 'resolved', subject: 'op', claims: { sub: 'op' } })

    expect(store.getState().status).toBe('active')
    expect(store.getState().subject).toBe('op')
  })

  it('pero unauthorized sigue sin salida: entrar de nuevo es el bucle infinito', () => {
    const store = createSessionStore(sinCapacidades)
    store.apply({ type: 'resolved', subject: 'op', claims: { sub: 'op' } })
    expect(store.getState().status).toBe('unauthorized')

    store.apply({ type: 'resolved', subject: 'op', claims: { sub: 'op' } })
    store.apply({ type: 'no-session' })

    expect(store.getState().status).toBe('unauthorized')
  })

  it('y ended sigue terminal: ni con una credencial nueva se vuelve', () => {
    const store = createSessionStore(conCapacidades)
    store.apply({ type: 'no-session' })
    store.apply({ type: 'ended', reason: 'token-rejected' })

    store.apply({ type: 'resolved', subject: 'op', claims: { sub: 'op' } })

    expect(store.getState().status).toBe('ended')
    expect(store.getState().reason).toBe('token-rejected')
  })
})

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
