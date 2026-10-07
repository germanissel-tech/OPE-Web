import { describe, expect, it } from 'vitest'
import { successNotice } from '../src/data/notice'

/**
 * **El aviso de una acción que salió bien** (`CU-25`).
 *
 * Se prueba acá y no mirando la pantalla porque lo que se rompe es invisible:
 * un aviso sin descripción se dibuja igual —sólo que reducido a la franja del
 * tono—, y una duración equivocada no falla, sólo se va antes de tiempo.
 */
describe('el aviso de éxito', () => {
  it('toma un texto pelado como título', () => {
    expect(successNotice('El artículo se creó', 'Listo')).toEqual({
      tone: 'success',
      title: 'El artículo se creó',
      description: undefined,
      duration: 4000,
    })
  })

  it('lleva la descripción al cuerpo, que es lo que granito dibuja debajo', () => {
    /* Sin esto el aviso queda siendo sólo la franja del tono: el cuerpo de un
       aviso de granito es lo que la descripción llena. */
    const notice = successNotice(
      { title: 'El artículo se creó', description: 'Código 7 · Ibuprofeno 400 mg' },
      'Listo',
    )

    expect(notice.description).toBe('Código 7 · Ibuprofeno 400 mg')
  })

  it('dura más cuando hay descripción, porque hay más para leer', () => {
    const short = successNotice('El artículo se creó', 'Listo')
    const long = successNotice({ title: 'El artículo se creó', description: 'Código 7' }, 'Listo')

    expect(long.duration).toBeGreaterThan(short.duration ?? 0)
  })

  it('usa el texto del marco cuando la acción no anuncia nada', () => {
    /* Una acción sin `announces` sigue avisando: lo que no puede pasar es que
       una operación termine en silencio. */
    expect(successNotice(undefined, 'Listo').title).toBe('Listo')
  })

  it('siempre se va sola, porque un éxito no deja nada que copiar', () => {
    /* La contraparte está en la puerta: el aviso de error va **sin** duración,
       porque lleva el `requestId` y el operador necesita poder anotarlo. */
    for (const announced of ['Se creó', { title: 'Se creó', description: 'Código 7' }]) {
      expect(successNotice(announced, 'Listo').duration).toBeGreaterThan(0)
    }
  })
})
