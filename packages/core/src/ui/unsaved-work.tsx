import { Dialog } from '@granito/ui'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { useBlocker } from 'react-router'
import { Failure } from '../base/failure'
import { useStrings } from '../base/use-strings'

/**
 * **Salir con trabajo sin guardar avisa antes de descartarlo** (`CU-47`).
 *
 * Lo exige `GR-73`: *«abortar está bien; abortar en silencio, no»*.
 *
 * ## La pantalla dice un booleano, y nada más
 *
 * No sabe qué es abandonar, ni quién pregunta, ni con qué diálogo. Sólo si
 * tiene algo escrito. **Olvidarse es una línea que falta, no una lógica mal
 * hecha** — y eso es lo que separa esta forma de una donde cada pantalla se
 * arma su propia confirmación y la que se olvida descarta en silencio.
 *
 * ## Un solo bloqueo, arriba
 *
 * El ruteador ofrece uno por aplicación, y ponerlo en el marco es lo que
 * permite que la pantalla no lo toque. Las pantallas publican su estado; el
 * marco decide.
 *
 * ## Qué cubre, y qué no
 *
 * Cubre **cerrar, los dos abandonos, y el botón «atrás»**. Qué no cubre —cerrar
 * la pestaña y recargar— y por qué, está en la decisión.
 */

type UnsavedWorkPort = {
  readonly report: (dirty: boolean) => void
}

const UnsavedWorkContext = createContext<UnsavedWorkPort | null>(null)

/**
 * Lo que la pantalla escribe.
 *
 * **Se limpia sola al desmontarse**: con la bandera puesta, la navegación
 * siguiente preguntaría por un trabajo inexistente, y un aviso de más enseña a
 * ignorar el aviso.
 */
export function useUnsavedWork(dirty: boolean): void {
  const port = useContext(UnsavedWorkContext)
  if (!port) {
    throw new Failure(
      'wiring.outsideProvider',
      'useUnsavedWork() fuera de UnsavedWorkProvider. Lo provee la raíz de composición.',
    )
  }

  const { report } = port

  useEffect(() => {
    report(dirty)
    return () => report(false)
  }, [dirty, report])
}

export function UnsavedWorkProvider({ children }: { readonly children: ReactNode }) {
  const [dirty, setDirty] = useState(false)
  const strings = useStrings()

  /**
   * **Se pregunta sólo si hay algo que perder y el destino es otro.**
   *
   * Sin lo segundo, cambiar el filtro de una grilla —que reemplaza la entrada
   * con la misma ruta— dispararía el aviso.
   */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  return (
    <UnsavedWorkContext.Provider value={{ report: setDirty }}>
      {children}
      <Dialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title={strings.unsavedTitle}
        description={strings.unsavedDescription}
        confirmLabel={strings.unsavedConfirm}
        cancelLabel={strings.unsavedCancel}
        onConfirm={() => blocker.proceed?.()}
      />
    </UnsavedWorkContext.Provider>
  )
}
