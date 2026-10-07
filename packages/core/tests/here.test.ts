import { describe, expect, it } from 'vitest'
import { buildUrl } from '../src/base/go-to'
import { hereFrom, paramsFrom } from '../src/base/here'
import { defineScreen } from '../src/base/registry'

/**
 * **Escribir una URL y volver a leerla tienen que dar lo mismo** (`CU-47`).
 *
 * `buildUrl` codifica los parámetros y `paramsFrom` los lee. Si sólo uno de los
 * dos traduce, los dos lados dejan de hablar el mismo idioma — y como la
 * identidad de un escalón es **pantalla más parámetros**, un identificador con
 * un espacio deja de compararse consigo mismo.
 *
 * Lo que se rompía no se veía: abrir el mismo artículo apilaba un duplicado
 * —`AB%2012` contra `AB 12`—, la dirección no cambiaba, y había que cerrar dos
 * veces para salir de una pantalla.
 */

const Nada = () => null

const ficha = defineScreen({
  id: 'article',
  title: 'Ficha',
  path: '/catalog/:id',
  component: Nada,
})

describe('ida y vuelta de un parámetro', () => {
  it.each([
    ['7', 'el caso normal'],
    ['AB 12', 'con un espacio'],
    ['a/b', 'con una barra'],
    ['30%', 'con un porcentaje'],
    ['ñandú', 'con acentos'],
    ['a+b', 'con un más, que en una consulta sería un espacio'],
  ])('«%s» vuelve igual: %s', (id) => {
    const url = buildUrl(ficha, { id })

    expect(paramsFrom(ficha.path, url)).toEqual({ id })
  })

  it('y el escalón que sale de la URL trae el valor legible', () => {
    /* Es lo que compara `isSame`: con el valor codificado, el mismo artículo
       parecería dos artículos distintos. */
    const here = hereFrom([ficha], buildUrl(ficha, { id: 'AB 12' }))

    expect(here?.entry).toEqual({ screen: 'article', params: { id: 'AB 12' } })
  })
})

describe('un valor que no se puede decodificar', () => {
  it('vuelve crudo en vez de tumbar la aplicación', () => {
    /* Un `%` suelto lo puede pegar cualquiera en la barra. `decodeURIComponent`
       lanza, y sin la guarda eso revienta al dibujar. Devolverlo crudo hace que
       la pantalla diga que no encontró el recurso — que es lo cierto. */
    expect(paramsFrom('/catalog/:id', '/catalog/100%')).toEqual({ id: '100%' })
  })
})
