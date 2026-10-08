import { describe, expect, it } from 'vitest'
import type { Article } from '../../../api/demo/client'
import { catalogStrings } from '../strings'
import { toggleArticleActive } from './toggle-active'

/**
 * **La primera prueba de una funcionalidad, y el ejemplo de dónde va** (`CU-15`).
 *
 * Al lado de lo que prueba, no en una carpeta aparte: **una funcionalidad tiene
 * que poder borrarse entera**, y con las pruebas en otro lado se borra la mitad.
 * Lo verifica `ope-check`.
 *
 * Lo que se prueba acá es **la regla de la acción, no la llamada**: hacia qué
 * lado va el interruptor y qué se anuncia. Lo que la operación le manda al
 * servidor ya lo cubre el contrato.
 */

const article = (active: boolean): Article => ({
  id: 7,
  name: 'Ibuprofeno 400 mg',
  price: '1890.50',
  active,
})

/** El doble mínimo: registra a cuál se llamó, sin ejercitar la red. */
function operations() {
  const called: string[] = []
  const run = (name: string) => (id: number) => {
    called.push(`${name}:${id}`)
    return Promise.resolve({ data: article(name === 'activate') })
  }

  return {
    called,
    ops: {
      activate: { run: run('activate') },
      deactivate: { run: run('deactivate') },
    },
  }
}

describe('el interruptor de un artículo', () => {
  it('desactiva el que está activo', async () => {
    /* La pantalla pasa **el artículo entero** y no decide nada: de acá sale
       hacia qué lado va (`CU-46`). */
    const { called, ops } = operations()

    await toggleArticleActive.run(article(true), ops as never)

    expect(called).toEqual(['deactivate:7'])
  })

  it('y activa el que está inactivo', async () => {
    const { called, ops } = operations()

    await toggleArticleActive.run(article(false), ops as never)

    expect(called).toEqual(['activate:7'])
  })
})

describe('lo que se anuncia', () => {
  /**
   * `announces` recibe **lo que volvió y lo que entró**, y puede devolver un
   * texto pelado o un aviso con descripción. Acá se afirma que devuelve lo
   * segundo, porque un texto solo dejaría el aviso sin decir de cuál fila es.
   */
  const announced = (returned: Article, given: Article) => {
    const envelope = {
      data: returned,
      meta: { requestId: '01J', page: 1, size: 1, totalItems: 1, totalPages: 1 },
    }
    const result = toggleArticleActive.announces?.(envelope, given)
    if (typeof result !== 'object') throw new Error('el aviso tiene que llevar descripción')
    return result
  }

  it('sale de lo que volvió, no de lo que se pidió', () => {
    /* Si el servidor contestó otra cosa, el aviso dice la verdad y no la
       intención — que es la diferencia entre informar y suponer. */
    expect(announced(article(true), article(false)).title).toBe(catalogStrings.articleActivated)
  })

  it('lleva el nombre en la descripción, para que se sepa cuál', () => {
    /* Sin esto el aviso queda reducido a la franja del tono: veinte filas
       iguales y ninguna pista de en cuál se apretó. */
    expect(announced(article(false), article(true)).description).toBe('Ibuprofeno 400 mg')
  })
})
