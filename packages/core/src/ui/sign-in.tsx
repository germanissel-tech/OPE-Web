import { Alert, Block, Button, Field, Page, Region, TextInput } from '@granito/ui'
import { type FormEvent, useState } from 'react'
import type { SessionViewContext } from '../base/session-views'
import type { Strings } from '../base/strings'

/**
 * **La vista de ingreso**: lo que se ve en `anonymous` cuando el adaptador
 * tiene entrada.
 *
 * Es la de un operador de OPE con su credencial opaca (`ADR-031` del backend):
 * un campo, un botón, y dos cosas que pueden salir mal —que el backend la
 * rechace, o que no haya backend—. Las dos se dicen con el texto del marco
 * (`strings`), porque no hubo pedido que traiga uno del servidor.
 *
 * **No sabe qué hace `signIn` con lo tecleado**, y es el punto: entrega la
 * credencial y recibe un desenlace sin credencial adentro (`CU-10`). La vista
 * no la guarda, no la muestra y no la vuelve a pedir: después de entrar, el
 * estado cambia y esto deja de dibujarse.
 *
 * Compuesta con granito y sin un estilo propio: `Page`, `Field`, `TextInput` de
 * tipo `password` y `Button`.
 */
export type SignInProps = {
  readonly signIn: NonNullable<SessionViewContext['signIn']>
  /**
   * Llegan por acá y no con `useStrings()` por la misma razón que en las siete
   * vistas: esto se llama desde una, durante el dibujo de otro componente.
   */
  readonly strings: Strings
}

type Failure = 'rejected' | 'unreachable' | undefined

export function SignIn({ signIn, strings }: SignInProps) {
  const [credential, setCredential] = useState('')
  const [failure, setFailure] = useState<Failure>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFailure(undefined)

    const outcome = await signIn(credential)
    setSubmitting(false)

    /* Con `ok` no hay nada que hacer acá: el estado de la sesión cambió y la
       vista que sigue es la aplicación. */
    if (!outcome.ok) {
      setFailure(outcome.reason)
      /* Lo rechazado no se deja puesto: lo que el operador vuelve a escribir es
         otra credencial, y una vieja que sigue en el campo se reenvía por
         error. */
      setCredential('')
    }
  }

  return (
    <Page title={strings.signInTitle}>
      <Region>
        <Block>
          <form onSubmit={(event) => void submit(event)}>
            <p>{strings.signInDetail}</p>
            {failure ? (
              <Alert
                severity={failure === 'rejected' ? 'warning' : 'error'}
                title={strings.actionFailed}
              >
                {failure === 'rejected' ? strings.signInRejected : strings.serverUnreachable}
              </Alert>
            ) : null}
            <Field label={strings.credentialLabel} size="fill">
              {(props) => (
                <TextInput
                  {...props}
                  type="password"
                  autoComplete="off"
                  value={credential}
                  onChange={(event) => setCredential(event.target.value)}
                />
              )}
            </Field>
            <Button type="submit" tone="primary" disabled={submitting || credential.trim() === ''}>
              {submitting ? strings.waiting : strings.signIn}
            </Button>
          </form>
        </Block>
      </Region>
    </Page>
  )
}
