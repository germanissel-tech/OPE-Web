import { Alert, Button, Field, Value } from '@granito/ui'
import { type ReactNode, useEffect, useState } from 'react'
import { useStrings } from '../base/use-strings'

/**
 * **Un valor que se muestra una sola vez, y en ningún otro lado** (`OW-8`).
 *
 * Lo que el servidor entrega en la respuesta que lo acuña y nunca más: la
 * pantalla que lo pidió lo dibuja mientras está montada, con un botón para
 * copiarlo, y **lo olvida al desmontar**. Nada de acá lo guarda, lo registra ni
 * lo emite: no hay estado fuera del componente, no hay telemetría, y lo único
 * que sale es lo que el operador copia al portapapeles por su propia mano.
 *
 * Granito no tiene una pieza para esto; se compone con las suyas —un `Alert`
 * con la advertencia, y por valor un `Field` con `Value` y `Button`— sin un
 * estilo propio. La propuesta a granito está en `OW-8`; cuando exista, esto se
 * reemplaza.
 *
 * **Copiar puede fallar** (sin portapapeles, contexto inseguro) y entonces se
 * dice: el valor sigue a la vista y se puede seleccionar. Fingir que copió es
 * mandar al operador a pegar nada.
 */
export type SecretOnceProps = {
  /** La advertencia, dicha por la aplicación: qué es esto y por qué no vuelve. */
  readonly warning: ReactNode
  readonly secrets: readonly { readonly label: string; readonly value: string }[]
}

export function SecretOnce({ warning, secrets }: SecretOnceProps) {
  const strings = useStrings()

  return (
    <>
      <Alert severity="warning" title={strings.copyOnceTitle}>
        {warning}
      </Alert>
      {secrets.map((secret) => (
        <Field key={secret.label} label={secret.label} size="fill">
          {() => (
            <>
              <Value>
                <code>{secret.value}</code>
              </Value>
              <CopyButton value={secret.value} />
            </>
          )}
        </Field>
      ))}
    </>
  )
}

type Copied = 'idle' | 'copied' | 'failed'

/** Cuánto dura «copiado» antes de volver a «copiar»: lo que lleva leerlo. */
const SAID_MS = 2500

function CopyButton({ value }: { readonly value: string }) {
  const strings = useStrings()
  const [state, setState] = useState<Copied>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), SAID_MS)
    return () => clearTimeout(timer)
  }, [state])

  const copy = async () => {
    const clipboard = globalThis.navigator?.clipboard
    if (!clipboard) {
      setState('failed')
      return
    }
    try {
      await clipboard.writeText(value)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <>
      <Button type="button" onClick={() => void copy()}>
        {strings.copy}
      </Button>
      <span role="status">
        {state === 'copied' ? strings.copied : state === 'failed' ? strings.copyFailed : ''}
      </span>
    </>
  )
}
