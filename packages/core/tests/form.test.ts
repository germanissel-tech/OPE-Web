// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { RejectedField } from '../src/data/envelope'
import { shapeErrorOf, useForm } from '../src/ui/use-form'
import { NoticesProvider, useNoticeHost } from '../src/ui/use-notices'

/**
 * **Cuándo se marca un campo** (`CU-38`).
 *
 * Se prueba acá porque **no se ve mirando la pantalla**: con los datos correctos
 * —que es como se la mira— las tres reglas dan el mismo resultado. Lo que
 * cambia es la experiencia de quien se equivoca, y ésa nadie la ensaya.
 */

const strings = {
  required: 'Es obligatorio.',
  tooLong: (max: number) => `No puede pasar de ${max} caracteres.`,
  badFormat: 'Va con dos decimales.',
  outOfRange: (min: number | undefined, max: number | undefined) => `Va entre ${min} y ${max}.`,
}

const constraints = {
  required: ['name', 'price'],
  fields: {
    name: { type: 'string', minLength: 1, maxLength: 5 },
    price: { type: 'string', pattern: '^[0-9]+\\.[0-9]{2}$' },
    note: { type: 'string' },
    stock: { type: 'integer', minimum: 0, maximum: 100 },
  },
}

/**
 * **El formulario ahora avisa**, así que necesita dónde dejar el aviso.
 *
 * No es incidental: un rechazo que la pantalla no puede mostrar tiene que salir
 * por algún lado o desaparece (`CU-49`), y por eso `useForm` exige el proveedor
 * en vez de callarse cuando no está.
 */
const wrapper = ({ children }: { readonly children: ReactNode }) =>
  createElement(NoticesProvider, null, children)

const emptyForm = () =>
  renderHook(() => useForm({ name: '', price: '', note: '', stock: '' }, constraints, strings), {
    wrapper,
  })

describe('la forma de un valor', () => {
  it('dice que falta antes que cualquier otra cosa', () => {
    /* «Formato inválido» de un campo vacío manda a mirar lo que no es. */
    expect(shapeErrorOf('', constraints.fields.price, true, strings)).toBe(strings.required)
  })

  it('vacío y opcional está bien', () => {
    expect(shapeErrorOf('', constraints.fields.price, false, strings)).toBeUndefined()
  })

  it('mide el rango, que es tan del contrato como el largo', () => {
    /* Era el hueco: se validaba el patrón y se dejaba pasar un valor fuera de
       rango. En el contrato del backend son 56 campos. */
    const stock = constraints.fields.stock

    expect(shapeErrorOf('50', stock, false, strings)).toBeUndefined()
    expect(shapeErrorOf('101', stock, false, strings)).toBe(strings.outOfRange(0, 100))
    expect(shapeErrorOf('-1', stock, false, strings)).toBe(strings.outOfRange(0, 100))
  })

  it('de algo que no es un número dice que la forma está mal, no el rango', () => {
    /* «Va entre 0 y 100» de un «abc» manda a mirar lo que no es. */
    expect(shapeErrorOf('abc', constraints.fields.stock, false, strings)).toBe(strings.badFormat)
  })

  it('mide el largo y el patrón sobre el valor sin espacios', () => {
    expect(shapeErrorOf('  12.50  ', constraints.fields.price, true, strings)).toBeUndefined()
    expect(shapeErrorOf('12,50', constraints.fields.price, true, strings)).toBe(strings.badFormat)
    expect(shapeErrorOf('Ibuprofeno', constraints.fields.name, true, strings)).toBe(
      strings.tooLong(5),
    )
  })
})

describe('la forma de un email, y las restricciones que dependen de los valores (feature 007 de la consola)', () => {
  const email = { type: 'string', format: 'email' }

  it('un email sin arroba o sin punto en el dominio no tiene forma, con su texto propio si lo hay', () => {
    const withEmail = { ...strings, badEmail: 'No tiene forma de email.' }
    expect(shapeErrorOf('ana', email, false, withEmail)).toBe('No tiene forma de email.')
    expect(shapeErrorOf('ana@sin-punto', email, false, withEmail)).toBe('No tiene forma de email.')
    expect(shapeErrorOf('ana@a.example', email, false, withEmail)).toBeUndefined()
    /* Sin texto propio, es un formato más. */
    expect(shapeErrorOf('ana', email, false, strings)).toBe(strings.badFormat)
    /* Otro `format` no juzga nada: el contrato puede decir más de lo que se valida acá. */
    expect(shapeErrorOf('x', { type: 'string', format: 'uri' }, false, strings)).toBeUndefined()
  })

  it('las restricciones pueden ser una función de los valores, evaluada en cada dibujo', () => {
    const conditional = (values: Record<string, string>) => ({
      required: ['name', ...(values.note === '' ? [] : ['price'])],
      fields: constraints.fields,
    })
    const { result } = renderHook(
      () => useForm({ name: 'ok', price: '', note: '', stock: '' }, conditional, strings),
      { wrapper },
    )
    expect(result.current.hasShapeErrors).toBe(false)
    act(() => result.current.set('note', 'algo'))
    expect(result.current.hasShapeErrors).toBe(true)
    act(() => result.current.blur('price'))
    expect(result.current.errorOf('price')).toBe(strings.required)
  })
})

describe('cuándo se marca un campo', () => {
  it('**nunca** mientras se escribe por primera vez', () => {
    /* Marcar en rojo al segundo carácter es hostigar a alguien que todavía está
       escribiendo lo correcto. */
    const { result } = emptyForm()

    act(() => result.current.set('price', '1'))

    expect(result.current.errorOf('price')).toBeUndefined()
  })

  it('al salir del campo', () => {
    const { result } = emptyForm()

    act(() => result.current.set('price', '1'))
    act(() => result.current.blur('price'))

    expect(result.current.errorOf('price')).toBe(strings.badFormat)
  })

  it('o al intentar guardar, lo que pase primero', () => {
    /* El que nunca tocó un campo obligatorio no salió de él: sin esto, aprieta
       guardar y no pasa nada. */
    const { result } = emptyForm()

    act(() => {
      result.current.attempt()
    })

    expect(result.current.errorOf('name')).toBe(strings.required)
    expect(result.current.errorOf('price')).toBe(strings.required)
  })

  it('y una vez marcado, se corrige en vivo', () => {
    /* Ahí sí cada tecla actualiza: ya sabe qué está mal y está buscando
       arreglarlo. */
    const { result } = emptyForm()

    act(() => result.current.set('price', '1'))
    act(() => result.current.blur('price'))
    expect(result.current.errorOf('price')).toBe(strings.badFormat)

    act(() => result.current.set('price', '12.50'))
    expect(result.current.errorOf('price')).toBeUndefined()
  })

  it('marcar uno no marca a los demás', () => {
    const { result } = emptyForm()

    act(() => result.current.blur('price'))

    expect(result.current.errorOf('price')).toBe(strings.required)
    expect(result.current.errorOf('name')).toBeUndefined()
  })
})

describe('intentar guardar', () => {
  it('no deja seguir si hay algo mal en la forma', () => {
    const { result } = emptyForm()

    let allowed: boolean | undefined
    act(() => {
      allowed = result.current.attempt()
    })

    expect(allowed).toBe(false)
  })

  it('deja seguir cuando la forma está bien', () => {
    const { result } = renderHook(
      () => useForm({ name: 'Ibup', price: '12.50', note: '' }, constraints, strings),
      { wrapper },
    )

    let allowed: boolean | undefined
    act(() => {
      allowed = result.current.attempt()
    })

    expect(allowed).toBe(true)
  })
})

describe('lo que rechazó el servidor', () => {
  it('se muestra aunque el campo nunca se haya tocado', () => {
    /* No lo produjo escribir: ya se intentó guardar, así que no hay «primera
       vez» que respetar (`CU-25`, `CU-5`). */
    const { result } = renderHook(
      () =>
        useForm({ name: 'Ibup', price: '12.50', note: '' }, constraints, strings, [
          { field: 'name', message: 'Ya existe uno con ese nombre.' },
        ]),
      { wrapper },
    )

    expect(result.current.errorOf('name')).toBe('Ya existe uno con ese nombre.')
  })

  it('gana sobre el local, porque es el que decide', () => {
    /* El servidor es el que decide (`CU-38`): mostrar el nuestro encima sería
       tapar la razón real por la que no se guardó. */
    const { result } = renderHook(
      () =>
        useForm({ name: 'Ibuprofeno', price: '12.50', note: '' }, constraints, strings, [
          { field: 'name', message: 'Ya existe uno con ese nombre.' },
        ]),
      { wrapper },
    )

    act(() => result.current.blur('name'))

    expect(result.current.errorOf('name')).toBe('Ya existe uno con ese nombre.')
  })
})

describe('lo que rechazó el servidor y esta pantalla no muestra', () => {
  /**
   * **El respaldo** (`CU-49`).
   *
   * `fields` promete que cada entrada tiene un control donde corregirse, y la
   * puerta se apoya en esa promesa **para callarse**. Cuando no se cumple, el
   * rechazo desaparece: ni aviso, ni campo marcado, y el botón se vuelve a
   * encender.
   *
   * Es la garantía que no depende de que cada backend cumpla la regla, y por eso
   * vive de este lado.
   */
  it('no desaparece: sale por el único lugar que queda', () => {
    const { result } = renderHook(
      () => ({
        form: useForm({ name: 'Ibup', price: '12.50', note: '' }, constraints, strings, [
          { field: 'If-Match', message: 'Es obligatorio.' },
        ]),
        avisos: useNoticeHost().notifications,
      }),
      { wrapper },
    )

    /* No hay control que se llame así, así que no hay dónde pintarlo. */
    expect(result.current.form.errorOf('name')).toBeUndefined()

    expect(result.current.avisos).toHaveLength(1)
    expect(result.current.avisos[0]?.description).toContain('If-Match')
  })

  it('tampoco cuando tiene control pero llega sin texto', () => {
    /* **El caso que se ve idéntico a que no pasó nada.** Un servidor que llame
       `detail` a lo que el contrato llama `message` marca el campo con nada
       adentro: el operador ve el mismo formulario de antes. */
    const { result } = renderHook(
      () => ({
        form: useForm({ name: 'Ibup', price: '12.50', note: '' }, constraints, strings, [
          { field: 'name' } as unknown as RejectedField,
        ]),
        avisos: useNoticeHost().notifications,
      }),
      { wrapper },
    )

    expect(result.current.avisos).toHaveLength(1)
    expect(result.current.avisos[0]?.description).toContain('name')
  })

  it('y el que sí tiene control no genera ningún aviso', () => {
    /* **La otra mitad, y la que decide si esto es un respaldo o un estorbo.** Un
       aviso acá sería decir dos veces lo que el campo ya dice. */
    const { result } = renderHook(
      () => ({
        form: useForm({ name: 'Ibup', price: '12.50', note: '' }, constraints, strings, [
          { field: 'name', message: 'Ya existe uno con ese nombre.' },
        ]),
        avisos: useNoticeHost().notifications,
      }),
      { wrapper },
    )

    expect(result.current.form.errorOf('name')).toBe('Ya existe uno con ese nombre.')
    expect(result.current.avisos).toEqual([])
  })
})
