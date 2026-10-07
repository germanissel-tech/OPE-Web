// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { defineWorkContext, writeContext } from '../src/base/context'
import { type Recorded, TelemetryProvider, useTelemetry } from '../src/base/telemetry'
import { useWorkContext, WorkContextProvider } from '../src/base/use-work-context'

/**
 * **El sobre que acompaña a todo evento** (`CU-35`).
 *
 * Se prueba porque **lo llena el marco y nadie lo ve al escribir**: quien emite
 * manda un evento pelado, así que si un campo del sobre queda vacío no hay
 * ninguna línea de código donde se note. Recién se descubre consultando el
 * tablero, meses después, cuando la consulta no devuelve nada.
 */

const branch = defineWorkContext('branch', 'machine')
const recorded: Recorded[] = []

afterEach(() => {
  cleanup()
  recorded.length = 0
  localStorage.clear()
  sessionStorage.clear()
})

function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <WorkContextProvider subject="ana" contexts={[branch]}>
      <TelemetryProvider
        value={{
          port: { record: (each) => recorded.push(each) },
          app: 'admin',
          version: 'v1.2.3',
          envelope: { branch },
        }}
      >
        {children}
      </TelemetryProvider>
    </WorkContextProvider>
  )
}

const emit = () => {
  const { result } = renderHook(
    () => ({ telemetry: useTelemetry(), branch: useWorkContext(branch) }),
    { wrapper },
  )
  act(() => result.current.telemetry.record({ kind: 'screenOpened', screen: 'ignorado' }))
  return result
}

describe('lo que acompaña a todo evento', () => {
  it('dice cuándo, de qué aplicación y de qué versión', () => {
    /* Sin esto no se puede ordenar, ni separar cuatro aplicaciones que reportan
       al mismo lugar, ni contestar «¿esto es nuevo?». */
    emit()

    expect(recorded[0]).toMatchObject({ app: 'admin', version: 'v1.2.3' })
    expect(Date.parse(recorded[0]?.at ?? '')).not.toBeNaN()
  })

  it('trae con qué agrupar, y sobrevive a recargar', () => {
    /* `CU-35` promete decir **si un error es frecuente o único**, y eso no se
       contesta sin algo que agrupe. Si no sobreviviera a recargar, un operador
       que recarga tras un error aparecería como dos. */
    emit()
    const first = recorded[0]?.session

    expect(first).toBeTruthy()
    expect(sessionStorage.getItem('cuarzo.telemetry.session')).toBe(first)
  })

  it('el identificador de sesión **no es el sujeto**', () => {
    /* Con el sujeto adentro, el tablero pasaría a tener el historial de
       navegación de una persona identificada. */
    emit()

    expect(recorded[0]?.session).not.toBe('ana')
  })
})

describe('el contexto que agrega la aplicación', () => {
  it('llega con el valor que está puesto', () => {
    writeContext(branch, 'ana', '7')
    emit()

    expect(recorded[0]?.context).toEqual({ branch: '7' })
  })

  it('llega declarado aunque no haya nada elegido, y **sobrevive a JSON**', () => {
    /* Con `undefined` la clave desaparece al serializar, y una consulta no
       podría distinguir «no hay sucursal elegida» de «esta aplicación no tiene
       sucursales». Por eso se prueba contra el texto y no contra el objeto: es
       lo que llega al otro lado. */
    emit()

    expect(recorded[0]?.context).toEqual({ branch: null })
    expect(JSON.parse(JSON.stringify(recorded[0])).context).toEqual({ branch: null })
  })
})
