import { describe, expect, it } from 'vitest'
import { failedWith, RequestFailed, unwrap } from '../src/data/envelope'

const conEncabezado = (id: string) =>
  new Response(null, { headers: { 'X-Request-Id': id }, status: 200 })

describe('el sobre', () => {
  it('devuelve los datos y conserva el identificador del pedido', () => {
    const page = unwrap<{ id: number }[]>({
      data: { data: [{ id: 3 }], meta: { requestId: '01JBQ', page: 1, totalPages: 4 } },
      response: conEncabezado('otro'),
    })

    expect(page.data).toEqual([{ id: 3 }])
    expect(page.meta.requestId).toBe('01JBQ')
    expect(page.meta.totalPages).toBe(4)
  })

  it('cae al encabezado cuando el cuerpo no trae el identificador', () => {
    /* El contrato manda `X-Request-Id` en toda respuesta, incluidas las que un
       intermediario corta antes de que el servidor arme un cuerpo — que son
       justo las más difíciles de diagnosticar. */
    const page = unwrap<number[]>({
      data: { data: [1], meta: {} },
      response: conEncabezado('01DESDE-EL-HEADER'),
    })

    expect(page.meta.requestId).toBe('01DESDE-EL-HEADER')
  })

  it('convierte el error del servidor en algo con código, no en un texto', () => {
    /* `CU-14`: se ramifica por `code`, nunca por `message`, que es castellano
       para una persona y puede cambiar sin ser un cambio de contrato. */
    let caught: unknown
    try {
      unwrap({
        error: {
          error: {
            code: 'CATALOG_ENTRY_DUPLICATE',
            message: 'Ya existe un banco con ese nombre',
            requestId: '01JBQ',
          },
        },
        response: new Response(null, { status: 409 }),
      })
    } catch (error) {
      caught = error
    }

    expect(failedWith(caught, 'CATALOG_ENTRY_DUPLICATE')).toBe(true)
    expect((caught as RequestFailed).status).toBe(409)
    expect((caught as RequestFailed).requestId).toBe('01JBQ')
  })

  it('lleva los campos rechazados, para marcarlos', () => {
    let caught: unknown
    try {
      unwrap({
        error: {
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Falta el nombre',
            requestId: '01JBQ',
            fields: [{ field: 'name', code: 'REQUIRED', message: 'Es obligatorio' }],
          },
        },
        response: new Response(null, { status: 422 }),
      })
    } catch (error) {
      caught = error
    }

    expect((caught as RequestFailed).fields[0]?.field).toBe('name')
  })

  it('no deja pasar una respuesta sin sobre', () => {
    /* Sin esto, un backend que responda el arreglo pelado daría `undefined` en
       la grilla y el defecto aparecería lejos de acá. */
    expect(() => unwrap({ data: [1, 2, 3], response: conEncabezado('01JBQ') })).toThrow(
      RequestFailed,
    )
  })
})

describe('el testigo del recurso', () => {
  const conTestigo = (etag: string) =>
    new Response(null, { headers: { 'X-Request-Id': '01JBQ', ETag: etag }, status: 200 })

  it('llega a meta, tal cual vino', () => {
    /* **Opaco**: no se interpreta ni se normaliza. Las comillas son parte del
       valor que el servidor emitió, y es lo que hay que devolverle. */
    const page = unwrap<{ id: number }>({
      data: { data: { id: 3 }, meta: { requestId: '01JBQ' } },
      response: conTestigo('"7"'),
    })

    expect(page.meta.version).toBe('"7"')
  })

  it('y si no vino, la clave no está', () => {
    /* No es lo mismo «no hay testigo» que «se consultó y no está». Una lista no
       lo trae porque no le corresponde: con `version: undefined` el sobre diría
       que sí le corresponde y falta, que es otra cosa. */
    const page = unwrap<number[]>({
      data: { data: [1, 2, 3], meta: { requestId: '01JBQ' } },
      response: conEncabezado('01JBQ'),
    })

    expect('version' in page.meta).toBe(false)
  })

  it('el cuerpo no lo pisa: sale del encabezado o no sale', () => {
    /* Al revés que el identificador del pedido, que admite que el cuerpo lo diga
       mejor. El testigo no tiene cuerpo donde decirse — es del transporte. */
    const page = unwrap<{ id: number }>({
      data: { data: { id: 3 }, meta: { requestId: '01JBQ', version: '"mentira"' } },
      response: conTestigo('"7"'),
    })

    expect(page.meta.version).toBe('"7"')
  })

  it('y sin encabezado tampoco: lo del cuerpo no se hereda', () => {
    /**
     * **La mitad que faltaba.** La otra prueba sólo cubría el caso con
     * encabezado, donde el orden del `...` alcanza para pisar — y el orden sólo
     * decide cuando los dos están.
     *
     * Sin encabezado no había con qué pisar y el `version` del cuerpo pasaba
     * entero. Un servidor que lo repita en el sobre le daría a la pantalla un
     * testigo que el transporte nunca confirmó, y ése es el que saldría como
     * `If-Match`: la garantía decía una cosa y lo verificado era otra.
     */
    const page = unwrap<{ id: number }>({
      data: { data: { id: 3 }, meta: { requestId: '01JBQ', version: '"mentira"' } },
      response: conEncabezado('01JBQ'),
    })

    expect('version' in page.meta).toBe(false)
  })
})
