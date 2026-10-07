/**
 * **Los contextos de trabajo, y cuánto vive cada uno** (`CU-26`).
 *
 * Hay cuatro cosas que se llaman «contexto» y tienen vidas distintas. Meterlas
 * en un solo lugar es lo que las rompe:
 *
 * | | qué es | dónde vive | quién lo resuelve |
 * |---|---|---|---|
 * | De la pantalla | Qué registro se está viendo | **En la URL** | El ruteador (`CU-23`) |
 * | Del operador | Tema, globos de ayuda | En la máquina | Las preferencias (`CU-11`) |
 * | **De trabajo, estable** | La sucursal con la que se opera | **En la máquina** | **Acá** |
 * | **De trabajo, efímero** | A quién se está atendiendo | **Por pestaña** | **Acá** |
 *
 * Las dos primeras ya tenían dueño. Esto es para las otras dos, y **la
 * diferencia entre ellas es de vida, no de forma**: por eso es un solo mecanismo
 * con dos duraciones y no dos mecanismos parecidos que se copien mutuamente.
 *
 * ## Por qué la URL sola no alcanza
 *
 * Es la respuesta que sale primero, y `CU-26` la descarta: estos dos **no son de
 * ninguna pantalla**, cruzan todas. Ponerlos en la URL obligaría a arrastrarlos
 * por cada ruta y a que cada pantalla se acuerde.
 *
 * ## Las dos reglas
 *
 * **Cómo se estampa con el sujeto** (`CU-26` dice por qué): no se guarda
 * adentro del valor, **es parte de la clave**. Así otro sujeto lee otro lugar, y
 * no queda una comparación que alguien pueda olvidarse de hacer.
 *
 * **Y la otra regla tampoco depende de que alguien la recuerde**: el valor es un
 * `string`, así que no hay dónde poner el nombre, el saldo ni la condición de
 * nadie. Lo demás se vuelve a pedir, y por `CU-14` ya está cacheado.
 */

/**
 * Cuánto vive un contexto de trabajo.
 *
 * | | aguanta | por qué |
 * |---|---|---|
 * | `machine` | Cerrar el navegador | Casi nunca cambia, y volver a elegirla cada día es fricción |
 * | `tab` | Sólo esa pestaña | Dos pestañas atienden a dos personas distintas sin pisarse, y mañana no se arranca parado sobre la de ayer |
 */
export type ContextLife = 'machine' | 'tab'

/** Un contexto de trabajo declarado. Lo que hay que tener para leerlo. */
export type WorkContext = {
  readonly id: string
  readonly life: ContextLife
}

/**
 * Declara un contexto de trabajo. Se escribe en el módulo, como una pantalla.
 *
 * ```ts
 * export const currentBranch = defineWorkContext('branch', 'machine')
 * export const currentCustomer = defineWorkContext('customer', 'tab')
 * ```
 */
export function defineWorkContext(id: string, life: ContextLife): WorkContext {
  return { id, life }
}

const PREFIX = 'cuarzo.context'

/* `sessionStorage` es por pestaña y `localStorage` por máquina: la diferencia de
   vida ya está en la plataforma, y no hay que sostenerla con un vencimiento
   nuestro que alguien tenga que recordar limpiar. */
const storageFor = (life: ContextLife) =>
  life === 'tab' ? globalThis.sessionStorage : globalThis.localStorage

/**
 * El identificador guardado, o nada.
 *
 * **Sin sujeto no hay nada que leer**: lo guardado siempre pertenece a alguien,
 * y sin saber a quién no se puede decir que sea de quien está.
 */
export function readContext(context: WorkContext, subject: string | undefined): string | undefined {
  if (!subject) return undefined
  try {
    return storageFor(context.life).getItem(`${PREFIX}.${subject}.${context.id}`) ?? undefined
  } catch {
    /* Un almacenamiento bloqueado no puede impedir que se trabaje: el contexto
       se vuelve a elegir, que es molesto y no es una falla. */
    return undefined
  }
}

/** Lo guarda, o lo borra si se pasa `undefined`. */
export function writeContext(
  context: WorkContext,
  subject: string | undefined,
  id: string | undefined,
): void {
  if (!subject) return
  const key = `${PREFIX}.${subject}.${context.id}`
  try {
    if (id === undefined) storageFor(context.life).removeItem(key)
    else storageFor(context.life).setItem(key, id)
  } catch {
    /* Lo mismo: vale para esta sesión y no se persiste. */
  }
}
