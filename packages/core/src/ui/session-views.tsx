import { Alert, Button, Dialog, Spinner } from '@granito/ui'
import { useEffect, useState } from 'react'
import type { SessionViews } from '../base/session-views'
import type { Strings } from '../base/strings'
import { useStrings } from '../base/use-strings'
import { SignIn } from './sign-in'

/**
 * **Qué se ve en cada uno de los siete estados de sesión** (`001`), como
 * **estrategia por estado** y no como un `switch` (`CU-42`).
 *
 * `Record<SessionStatus, …>` **obliga a que estén los siete**: agregar un estado
 * a la unión no compila hasta que alguien decida qué se ve.
 *
 * Se prefiere al `switch` porque un `default` **falla abierto**: un estado
 * nuevo cae ahí y dibuja la aplicación entera. Uno pensado para bloquear algo
 * terminaría mostrando todo.
 *
 * Vive en el paquete y no en cada aplicación porque **el camino de falla de la
 * sesión es idéntico en las cuatro**: si cada una lo escribiera, divergirían, y
 * eso es lo que `CU-20` existe para evitar.
 */

/**
 * Las siete por omisión. Una aplicación **reemplaza las que quiera** sin tocar
 * esto: abierto a extender, cerrado a modificar.
 */
export const defaultSessionViews: SessionViews = {
  resolving: ({ waitThresholdMs }) => <Resolving thresholdMs={waitThresholdMs} />,

  /* Con entrada, la vista de ingreso; sin ella, el aviso de siempre: el
     adaptador entra solo y lo único que hay que decir es que todavía no hay
     sesión. */
  anonymous: ({ strings, signIn }) =>
    signIn ? (
      <SignIn signIn={signIn} strings={strings} />
    ) : (
      <Alert severity="info" title={strings.noSession}>
        {strings.noSessionDetail}
      </Alert>
    ),

  active: ({ application }) => application,

  /* Entró y no tiene ninguna capacidad acá. **No redirige**: es la única
     prohibición dura de la máquina, y la razón está en `001`. */
  unauthorized: ({ strings }) => (
    <Alert severity="warning" title={strings.unauthorized}>
      {strings.unauthorizedDetail}
    </Alert>
  ),

  /* `expiring` y `waiting` se dibujan ENCIMA de la aplicación, no en lugar de
     ella: lo cargado sigue ahí, detrás del velo. */
  expiring: ({ application, reenter }) => (
    <>
      {application}
      <ReenterDialog waiting={false} onReenter={reenter} />
    </>
  ),

  waiting: ({ application, reenter }) => (
    <>
      {application}
      <ReenterDialog waiting onReenter={reenter} />
    </>
  ),

  /* Recargar es volver al ingreso: `ended` es terminal, y la credencial no
     sobrevive a la recarga, así que lo que sigue es `anonymous`. */
  ended: ({ endReason, strings }) => (
    <Alert
      severity="info"
      title={strings.sessionEnded}
      actions={<Button onClick={() => window.location.reload()}>{strings.reload}</Button>}
    >
      {endedDetail(endReason, strings)}
    </Alert>
  ),
}

function endedDetail(reason: string | undefined, strings: Strings): string {
  if (reason === 'other-subject') return strings.sessionEndedOtherSubject
  /* El backend dejó de reconocer la credencial en vuelo: se dice, porque el
     operador no apretó nada y una sesión que termina sola sin explicación se
     lee como una falla nuestra. */
  if (reason === 'token-rejected') return strings.sessionEndedTokenRejected
  return strings.sessionEndedDetail
}

/**
 * Nada hasta el umbral, y un indicador después.
 *
 * Sin la segunda mitad, una resolución que no vuelve —proveedor caído, red
 * cortada— deja la pantalla en blanco sin espera, sin error y sin salida.
 */
function Resolving({ thresholdMs }: { thresholdMs: number }) {
  const [visible, setVisible] = useState(false)
  const strings = useStrings()

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), thresholdMs)
    return () => clearTimeout(timer)
  }, [thresholdMs])

  if (!visible) return null
  return <Spinner label={strings.resolvingSession} showLabel />
}

function ReenterDialog({ waiting, onReenter }: { waiting: boolean; onReenter: () => void }) {
  const strings = useStrings()

  return (
    <Dialog
      open
      title={strings.reenterTitle}
      description={waiting ? strings.reenterWaitingDetail : strings.reenterFailedDetail}
      onClose={() => {}}
      actions={
        <Button onClick={onReenter} disabled={waiting}>
          {waiting ? strings.waiting : strings.reenter}
        </Button>
      }
    />
  )
}

/** Lo que se ve cuando la ruta existe y la sesión no la habilita — `CU-3`. */
export function Forbidden() {
  const strings = useStrings()

  return (
    <Alert severity="warning" title={strings.forbidden}>
      {strings.forbiddenDetail}
    </Alert>
  )
}
