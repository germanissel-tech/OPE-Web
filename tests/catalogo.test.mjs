import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { ROOT } from '../packages/core/checks/context.mjs'

/**
 * **Lo que el catálogo tiene que seguir cumpliendo** (`TAN-8`, `PED-14`).
 *
 * El generador ya falla solo ante lo que no puede pasar —una identidad
 * repetida, una relación local que no resuelve, una fuente que rinde menos de
 * lo que tiene—. Esto fija lo otro: **las propiedades del artefacto que otro
 * repositorio va a consumir**, y que se romperían sin que el generador se
 * entere.
 */

const catalogo = () => JSON.parse(readFileSync(join(ROOT, 'catalogo.json'), 'utf8'))
const manifiesto = () => JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

const correr = (args) =>
  spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', shell: false })

describe('el catálogo se reproduce', () => {
  it('lo emitido coincide con la documentación de hoy', () => {
    /* Si esto falla, el artefacto y la prosa se despegaron — y el artefacto es
       lo que otro repositorio lee. */
    const { status, stdout } = correr(['tests/catalogo.mjs', '--verificar'])

    expect(stdout).toContain('está al día')
    expect(status).toBe(0)
  })
})

describe('los pedidos históricos', () => {
  const pedidos = () => catalogo().entidades.filter((e) => e.tipo === 'pedido')

  it('no se pierde ninguno de los catorce', () => {
    /* El protocolo cambió de lugar, no de historia: lo pedido en su momento se
       sigue pudiendo leer. */
    expect(pedidos()).toHaveLength(14)
  })

  it('y todos quedan marcados como legado', () => {
    /* Sin la marca, quien componga el índice mezclaría «lo que hay» con «lo que
       hubo», y contestaría con un pedido cerrado hace meses. */
    expect(pedidos().every((p) => p.origen === 'legado')).toBe(true)
  })

  it('el catálogo declara que no espera pedidos nuevos ahí', () => {
    /* Es la diferencia entre una fuente vacía y una fuente cerrada: la primera
       invita a escribir, la segunda no. */
    expect(catalogo().vigencia.pedido.espera_nuevos).toBe(false)
  })

  it('y dice cuál es la fuente vigente, y qué hacer si el mismo id está en las dos', () => {
    /* Este emisor no puede mirar los sobres centrales sin volver a acoplarse a
       Tandilia, así que la regla para no duplicar **se declara** en vez de
       resolverse acá. */
    const { pedido } = catalogo().vigencia

    expect(pedido.fuente_vigente).toContain('tandilia/pedidos/cuarzo/')
    expect(pedido.al_componer).toContain('prevalece el central')
  })
})

describe('lo que PED-14 fijó y no se puede perder', () => {
  it('cada clase de relación declara su cobertura', () => {
    /* «parcial» no es una excusa: es el dato. Sin él, quien lea el índice cree
       que la ausencia de una arista significa que no existe. */
    const clases = Object.values(catalogo().clases_de_relacion)

    expect(clases.length).toBeGreaterThan(0)
    expect(clases.every((c) => ['completa', 'parcial', 'desconocida'].includes(c.cobertura))).toBe(
      true,
    )
  })

  it('una referencia a otro repositorio viaja con repositorio e identificador', () => {
    /* `CU-19` depende de `TAN-1`. Un emisor que sólo busque `CU-n` pierde esa
       arista sin que nada falle. */
    const fuera = catalogo()
      .entidades.flatMap((e) => e.relaciones)
      .filter((r) => r.hacia.repositorio && r.hacia.repositorio !== 'cuarzo')

    expect(fuera.length).toBeGreaterThan(0)
    expect(fuera.every((r) => typeof r.hacia.id === 'string')).toBe(true)
  })

  it('ninguna fuente se localiza por un ancla derivada del título', () => {
    /* Un ancla se mueve al corregir una coma del encabezado. La fuente se
       resuelve por documento más identificador semántico. */
    const fuentes = catalogo().entidades.map((e) => e.fuente)

    expect(fuentes.every((f) => typeof f.documento === 'string')).toBe(true)
    expect(fuentes.some((f) => JSON.stringify(f).includes('#'))).toBe(false)
  })

  it('el catálogo dice cómo se lo nombra desde afuera', () => {
    /* Con `repositorio` e `id` sueltos, quien compone tendría que inventar cómo
       se juntan — y dos composiciones darían dos claves para la misma cosa. */
    expect(catalogo().identidad_federada).toBe('repositorio#id')
  })

  it('las identidades inestables se declaran como tales', () => {
    /* La deuda no se cita por número —su propia regla— y los principios sí se
       citan aunque corran el mismo riesgo. Decir «estable» de cualquiera de las
       dos haría que el índice acepte citas que un día apuntan a otra cosa. */
    const { deuda, principio } = catalogo().identidad

    expect(deuda.estable).toBe(false)
    expect(principio.estable).toBe(false)
    expect(deuda.porque).toBeTruthy()
    expect(principio.porque).toBeTruthy()
  })
})

describe('los comandos que el repositorio publica', () => {
  /**
   * **Un comando roto es peor que uno que no existe**: se publica, alguien lo
   * corre, y falla por una razón que no tiene nada que ver con lo que estaba
   * haciendo. Y no lo agarra nadie: un guion que nombra un archivo inexistente
   * sólo falla cuando alguien lo corre.
   *
   * No se corren —`dev` no termina y `clon` tarda minutos—: se verifica que el
   * archivo que invocan esté ahí, que es exactamente lo que faltaba.
   */
  const archivosQueInvoca = (comando) =>
    [...comando.matchAll(/node\s+([\w./-]+\.mjs)/g)].map((m) => m[1])

  it('todo guion de node apunta a un archivo que existe', () => {
    const faltantes = []

    for (const [nombre, comando] of Object.entries(manifiesto().scripts)) {
      for (const archivo of archivosQueInvoca(comando)) {
        if (!existsSync(join(ROOT, archivo))) faltantes.push(`${nombre} → ${archivo}`)
      }
    }

    expect(faltantes).toEqual([])
  })

  it('y hay al menos uno para verificar, para que esta prueba tenga sujeto', () => {
    /* Una comprobación que aprueba sin encontrar qué revisar enseña a no leer
       sus aprobados (`TAN-6`, regla 4). */
    const cuantos = Object.values(manifiesto().scripts).flatMap(archivosQueInvoca).length

    expect(cuantos).toBeGreaterThan(0)
  })
})
