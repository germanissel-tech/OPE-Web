import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { cuarzoBuild } from '../build/index.mjs'

/**
 * **Qué compilación es ésta** (`CU-35`).
 *
 * Se prueba porque **una versión mal armada no rompe nada**: la aplicación
 * arranca, el tablero recibe eventos, y el defecto sólo aparece el día que
 * alguien pregunta de qué build vino un error y la respuesta no distingue dos
 * despliegues.
 */

/**
 * Lo que el complemento le devuelve a Vite, para el comando que se le pida.
 *
 * Se pasa por `unknown`: el tipo del gancho de Vite admite varias formas y acá
 * se usa la de función, que es la que el complemento implementa.
 */
const idOf = (command: 'build' | 'serve'): string => {
  const config = cuarzoBuild().config as unknown as (
    config: unknown,
    env: { command: string },
  ) => { define: { __CUARZO_BUILD__: string } }

  return JSON.parse(config({}, { command }).define.__CUARZO_BUILD__)
}

describe('lo que identifica una compilación', () => {
  it('lleva el commit, que es lo que distingue dos despliegues', () => {
    /* La versión sola no alcanza: nadie sube el número de una aplicación
       privada, y cuatro despliegues seguidos dirían lo mismo. */
    const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim()

    expect(idOf('build')).toContain(commit)
  })

  it('y la versión, que es la que se lee', () => {
    expect(idOf('build')).toMatch(/^\d+\.\d+\.\d+\+/)
  })

  it('en desarrollo no se hornea el commit', () => {
    /* Cambia a cada rato, y recompilar por eso sería ruido: alcanza con saber
       que es el de trabajo. */
    expect(idOf('serve')).toMatch(/\+dev$/)
  })
})
