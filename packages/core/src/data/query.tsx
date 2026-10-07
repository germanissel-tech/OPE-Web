import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * **La caché de datos, armada por la raíz de composición** (`CU-14`, `CU-36`).
 *
 * La documentación de TanStack muestra un `QueryClient` como constante de
 * módulo. Acá no puede serlo: **tiene estado y ciclo de vida** —una caché, unos
 * temporizadores, unos suscriptos—, y `CU-36` reserva el módulo configurado una
 * vez para funciones sin estado. Se arma una vez, al arrancar, y se recibe.
 *
 * No es teórico: un `QueryClient` de módulo sobrevive a `signOut()`, así que la caché
 * de una sesión quedaría viva para la siguiente. `CU-9` pide exactamente lo
 * contrario — que de la sesión anterior no quede nada en memoria.
 */

/**
 * Lo que se decide una vez y vale para toda la aplicación.
 *
 * Cada valor tiene su razón; ninguno es el que venía puesto.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * **Una consulta que falla, falla. No se queda esperando la red.**
         *
         * Por omisión TanStack **pausa** la consulta cuando cree que no hay
         * red, y la deja pendiente para siempre: la pantalla gira sin espera,
         * sin error y sin salida, que es el modo de falla que `CU-9` nombra
         * para la sesión y vale igual acá.
         *
         * Y la detección no sirve para lo que hacemos: `navigator.onLine` dice
         * que hay red, no que el servidor de la farmacia esté levantado. Con un
         * backend en la misma LAN, «sin red» y «el servidor está caído» se ven
         * igual desde el navegador, y sólo uno de los dos se arregla esperando.
         */
        networkMode: 'always',
        /**
         * **Se reintenta una lectura, y sólo si tiene sentido** (`CU-9`).
         *
         * Un `4xx` no mejora reintentando: el pedido está mal, o la sesión no
         * habilita. Insistir sólo demora el error que el operador necesita ver.
         */
        retry: (failureCount, error) => failureCount < 2 && !isClientError(error),
        /**
         * Los catálogos cambian poco y **un formulario de alta abre pidiendo
         * varios a la vez** (`CU-14`). Un minuto es la diferencia entre abrir
         * con una llamada o con cinco.
         */
        staleTime: 60_000,
        /**
         * **No se revalida al volver a la ventana.**
         *
         * Un operador de mostrador cambia de ventana todo el tiempo, y cada
         * vuelta dispararía una tanda de pedidos que no pidió. Lo que tiene que
         * estar fresco se invalida cuando algo lo cambia, que es lo que declara
         * cada acción (`CU-37`).
         */
        refetchOnWindowFocus: false,
      },
      mutations: {
        /** Lo mismo: una escritura que no se pudo mandar tiene que decirlo. */
        networkMode: 'always',
        /**
         * **Una escritura no se reintenta nunca** (`CU-9`, `CU-34`).
         *
         * Reintentar sola es cómo se emite dos veces la misma factura. Lo que
         * hace seguro reintentar es la clave de idempotencia, y esa la pone
         * quien declara la acción — no una política por omisión.
         */
        retry: false,
      },
    },
  })
}

/** Un `4xx`: el pedido está mal o no está habilitado. Insistir no lo arregla. */
function isClientError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' && status >= 400 && status < 500
}

export function QueryProvider({
  client,
  children,
}: {
  readonly client: QueryClient
  readonly children: ReactNode
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
