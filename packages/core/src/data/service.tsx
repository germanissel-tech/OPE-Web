import { createContext, type ReactNode, useContext } from 'react'
import { Failure } from '../base/failure'

/**
 * **Los servicios los arma la raíz, y una funcionalidad los recibe** (`CU-36`).
 *
 * El problema concreto que resuelve: la capa de datos de una funcionalidad
 * necesita el servicio, pero **no puede importarlo de `app/`** —`CU-15` fija la
 * dirección `lib` → `features` → `app` y nunca al revés— y **no puede armarlo
 * ella** porque `authorize` sólo existe en el arranque, después de la sesión.
 *
 * Entonces el servicio se registra con una **clave que lleva su tipo**, y la
 * clave vive en `api/`, que es lo único que las dos puntas pueden importar.
 *
 * ```ts
 * // api/demo/client.ts
 * export const demoService = defineService<DemoClient>('demo')
 *
 * // app/main.tsx — la raíz, que es donde existe authorize
 * provide: ({ config, authorize, children }) => (
 *   <ServicesProvider services={[demoService(createDemoClient(config.systems.demo, authorize))]}>
 *     {children}
 *   </ServicesProvider>
 * )
 *
 * // features/catalog/data/articles.ts
 * const demo = useService(demoService)   // ← DemoClient, sin conversiones
 * ```
 */

/** Un servicio registrado. Lo que devuelve una clave al recibir su valor. */
export type Registration = {
  readonly id: string
  readonly value: unknown
}

/**
 * La clave de un servicio.
 *
 * **Es invocable**, y por la misma razón que un desenlace (`CU-44`): es la
 * única forma de que el tipo del servicio viaje sin inventar un campo que no
 * existe al correr.
 */
export type ServiceKey<T> = ((value: T) => Registration) & { readonly id: string }

/** Declara un servicio. Se escribe al lado de su implementación, en `api/<sistema>/`. */
export function defineService<T>(id: string): ServiceKey<T> {
  const register = (value: T): Registration => ({ id, value })
  /* `id` y no `name`: el `name` de una función es de sólo lectura, y asignarlo
     revienta al construir la clave. Además es el nombre que ya usan las
     pantallas, los desenlaces y las preferencias. */
  return Object.assign(register, { id })
}

const ServicesContext = createContext<ReadonlyMap<string, unknown> | null>(null)

export function ServicesProvider({
  services,
  children,
}: {
  readonly services: readonly Registration[]
  readonly children: ReactNode
}) {
  const registry = new Map(services.map((each) => [each.id, each.value]))
  return <ServicesContext.Provider value={registry}>{children}</ServicesContext.Provider>
}

/**
 * Todos los servicios registrados, sin resolver ninguno.
 *
 * **Lo usa la puerta de acciones y nadie más.** Una acción se declara en el
 * módulo —como una pantalla o una funcionalidad— así que no puede pedir el suyo
 * con un hook; declara **contra cuál habla**, y la puerta lo resuelve al
 * ejecutar. Con esto es **una sola lectura de contexto** y no una por operación,
 * que además no se podría: la cantidad de operaciones la decide cada acción.
 */
export function useServices(): ReadonlyMap<string, unknown> {
  const registry = useContext(ServicesContext)
  if (!registry) {
    throw new Failure(
      'wiring.outsideProvider',
      'useAction() fuera de ServicesProvider. Los servicios los arma la raíz de composición.',
    )
  }
  return registry
}

/**
 * El servicio de un sistema, **con su tipo**.
 *
 * **Sólo lo llama `features/<x>/data/`** (`CU-15`), y lo verifica `ope-check`.
 * Una pantalla nunca ve un servicio: le pide los datos a su capa de datos, que
 * es la que sabe contra qué sistema hablar.
 */
export function useService<T>(key: ServiceKey<T>): T {
  const registry = useContext(ServicesContext)
  if (!registry) {
    throw new Failure(
      'wiring.outsideProvider',
      'useService() fuera de ServicesProvider. Los servicios los arma la raíz de composición.',
    )
  }

  if (!registry.has(key.id)) {
    throw new Failure(
      'wiring.outsideProvider',
      `Nadie registró el servicio "${key.id}". Se registra en la raíz, con su clave.`,
    )
  }

  /* Lo registrado pasó por `key(value)`, que lo tipó: acá es un `T` por
     construcción. Es la misma costura que `route()` (`CU-44`). */
  return registry.get(key.id) as T
}
