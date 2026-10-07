import { describe, expect, it } from 'vitest'
import { clashBetween, mergedOnto } from '../src/data/conflict'

/**
 * **Lo que decide si esto es una protección o un estorbo** (`CU-29`).
 *
 * El orden de estas pruebas no es casual: **el caso vacío va primero**, porque
 * es el frecuente. Empezar por el caso llamativo —el choque— es cómo se
 * construye algo que interrumpe todos los días.
 */

const cargado = { nombre: 'Amoxicilina 500 mg', precio: '2450.00', activo: true }

describe('cuando no hay conflicto real', () => {
  it('campos distintos no se cruzan: se guarda y nadie se entera', () => {
    /* El operador cambió el precio; otro cambió el nombre. Ninguno pisó al
       otro, así que preguntar sería inventar un problema. */
    const choque = clashBetween(
      cargado,
      { ...cargado, precio: '2600.00' },
      { ...cargado, nombre: 'Amoxicilina 750 mg' },
    )

    expect(choque).toEqual([])
  })

  it('el otro no tocó nada: sólo cambió la versión', () => {
    /* Pasa: el testigo sube por una escritura que no cambió lo que se ve —una
       marca de auditoría, un campo que la pantalla no trae—. Rechazar acá sería
       lo peor de los dos mundos. */
    const choque = clashBetween(cargado, { ...cargado, precio: '2600.00' }, cargado)

    expect(choque).toEqual([])
  })

  it('el operador no cambió nada, aunque el otro sí', () => {
    /* Abrió, no tocó, guardó. Lo que el otro haya hecho se conserva. */
    const choque = clashBetween(cargado, cargado, { ...cargado, precio: '9999.00' })

    expect(choque).toEqual([])
  })

  it('los dos escribieron lo mismo, y coincidieron', () => {
    /* **Es igualdad de valor y no de intención**: los dos pusieron el mismo
       precio, así que no hay nada que decidir. Comparar contra lo cargado y no
       entre sí es lo que da esto gratis. */
    const choque = clashBetween(
      cargado,
      { ...cargado, precio: '2600.00' },
      { ...cargado, precio: '2600.00' },
    )

    expect(choque).toEqual([])
  })
})

describe('cuando sí se cruzan', () => {
  it('devuelve el campo, con lo que había y lo que hay', () => {
    const choque = clashBetween(
      cargado,
      { ...cargado, precio: '2600.00' },
      { ...cargado, precio: '3100.00' },
    )

    expect(choque).toEqual([{ field: 'precio', whenOpened: '2450.00', now: '3100.00' }])
  })

  it('y sólo ése, aunque el otro haya cambiado más', () => {
    /* **Es la diferencia con un comparador general.** El nombre cambió en el
       servidor y no entra: el operador no lo tocó, así que no tiene nada que
       decidir sobre él. */
    const choque = clashBetween(
      cargado,
      { ...cargado, precio: '2600.00' },
      { ...cargado, precio: '3100.00', nombre: 'Otro nombre', activo: false },
    )

    expect(choque.map((each) => each.field)).toEqual(['precio'])
  })

  it('varios, si varios se cruzan', () => {
    /* Ojo con el `activo`: los dos tienen que llegar a valores **distintos**.
       Escribí esta prueba con los dos poniendo `false` y falló con razón —
       coincidir no es chocar. */
    const choque = clashBetween(
      cargado,
      { ...cargado, precio: '2600.00', activo: false, nombre: 'Amoxi 500' },
      { ...cargado, precio: '3100.00', nombre: 'Amoxicilina 500' },
    )

    expect(choque.map((each) => each.field).sort()).toEqual(['nombre', 'precio'])
  })
})

describe('lo que el operador tiene en pantalla', () => {
  it('no se toca: entra como dato y sale igual', () => {
    /* `CU-9` y `CU-29` con las mismas palabras: perder trabajo cargado a mano en
       el momento exacto en que la persona creyó que había terminado es la peor
       experiencia posible. Acá se comprueba que ni siquiera se lee para
       modificarlo. */
    const enPantalla = { ...cargado, precio: '2600.00' }
    const copia = { ...enPantalla }

    clashBetween(cargado, enPantalla, { ...cargado, precio: '3100.00' })

    expect(enPantalla).toEqual(copia)
  })
})

describe('lo que se compara es lo que se puede tocar', () => {
  /**
   * **Un campo que el formulario edita y la comparación no mira es invisible**
   * (`CU-29`).
   *
   * Lo agarró el punto de control: el operador y el otro tocaron campos
   * distintos, no salió cartel —correcto— y el cambio ajeno igual desapareció.
   * El campo que el otro había tocado no estaba en la referencia.
   *
   * **El cálculo no tiene la culpa**, y estas dos pruebas lo fijan: la fusión
   * conserva lo que sólo está en la relectura, y la comparación no puede
   * inventar un campo que nadie le declaró. Lo que falla es quien declara de
   * menos — por eso la regla es que **entra todo lo que el formulario puede
   * tocar**: si un campo se puede editar, se puede pisar.
   */
  it('un campo sin declarar no produce choque: es invisible', () => {
    const declarados = { nombre: 'Amoxicilina', precio: '2450.00' }

    /* El otro cambió el stock, que nadie declaró. */
    const choque = clashBetween(declarados, declarados, { ...declarados, stock: '99' })

    expect(choque).toEqual([])
  })

  it('pero la fusión no lo pierde: lo que sólo está en la relectura, sobrevive', () => {
    /* Ésta es la parte que **no** estaba rota. La fusión arranca de lo del
       servidor, así que un campo ajeno que la referencia no menciona pasa
       intacto. El defecto era de la pantalla, que al rearmar el cuerpo lo tomaba
       del formulario en vez de tomarlo de acá. */
    const declarados = { nombre: 'Amoxicilina', precio: '2450.00' }

    const fusionado = mergedOnto({ ...declarados, stock: '99' }, declarados, declarados)

    expect(fusionado.stock).toBe('99')
  })

  it('y declarado, además avisa cuando se cruza', () => {
    const conStock = { nombre: 'Amoxicilina', precio: '2450.00', stock: '10' }

    /* El otro lo cambió y el operador no: se guarda callado, con el valor ajeno. */
    expect(clashBetween(conStock, conStock, { ...conStock, stock: '99' })).toEqual([])

    /* Los dos lo cambiaron: ahora sí hay algo que decidir. */
    expect(
      clashBetween(conStock, { ...conStock, stock: '5' }, { ...conStock, stock: '99' }),
    ).toEqual([{ field: 'stock', whenOpened: '10', now: '99' }])
  })
})
