// @vitest-environment jsdom
import { createApplication } from '@ope/core'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createManifest } from './manifest'

/**
 * **La consola arranca con lo que declara** (`CU-47`, `CU-23`).
 *
 * El arranque verifica que las pantallas, los flujos, el menú y los desenlaces
 * cierren —que cada raíz de funcionalidad sea raíz de un flujo, que cada
 * desenlace tenga paso—, y si no cierran tira antes de dibujar nada. Las
 * pruebas de cada pantalla montan un flujo propio, así que **ninguna veía el de
 * verdad**: una funcionalidad cuya raíz no arrancaba ningún flujo pasaba todas
 * las pruebas y dejaba la consola en blanco. Lo encontró la feature 008 al
 * abrirla en el navegador.
 */
describe('la aplicación de la consola', () => {
  it('se arma con su manifiesto real sin que el arranque la rechace', () => {
    const manifest = createManifest({ systems: { ope: '/api' }, waitThresholdMs: 60000 })
    expect(() =>
      createApplication(manifest, ({ children }: { readonly children: ReactNode }) => (
        <>{children}</>
      )),
    ).not.toThrow()
  })
})
