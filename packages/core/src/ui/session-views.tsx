import { Alert, AppShell, Block, Brand, Button, Dialog, Page, Region, Spinner } from '@granito/ui'
import { type ReactNode, useEffect, useState } from 'react'
import type { SessionViewContext, SessionViews } from '../base/session-views'
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
 * sesión es idéntico en todas**: si cada una lo escribiera, divergirían, y
 * eso es lo que `CU-20` existe para evitar.
 *
 * **Los estados que no dejan ver la aplicación se dibujan adentro del shell**
 * de granito, con la marca y la barra, como cualquier pantalla (`GR-12`,
 * `GR-35`): el shell no le exige nada a lo que hospeda (`GR-52`), y una
 * pantalla de ingreso suelta en el documento, sin marco, es la clase de
 * «no falla, se ve mal» que `GR-52` nombra. Sin navegación: no hay a dónde ir
 * hasta que haya sesión.
 */

/** El marco mínimo: la marca, la barra con el título que publica la página, y nada más. */
function Framed({ appName, children }: { appName: string; children: ReactNode }) {
  return <AppShell brand={<Brand label={appName} />}>{children}</AppShell>
}

/** Un aviso como pantalla entera: una página con su título y una región. */
function Notice({
  appName,
  title,
  children,
}: {
  appName: string
  title: string
  children: ReactNode
}) {
  return (
    <Framed appName={appName}>
      <Page title={title}>
        <Region>
          <Block>{children}</Block>
        </Region>
      </Page>
    </Framed>
  )
}

/**
 * Las siete por omisión. Una aplicación **reemplaza las que quiera** sin tocar
 * esto: abierto a extender, cerrado a modificar.
 */
export const defaultSessionViews: SessionViews = {
  resolving: ({ appName, waitThresholdMs }) => (
    <Framed appName={appName}>
      <Resolving thresholdMs={waitThresholdMs} />
    </Framed>
  ),

  /* Con entrada, la vista de ingreso; sin ella, el aviso de siempre: el
     adaptador entra solo y lo único que hay que decir es que todavía no hay
     sesión. */
  anonymous: ({ appName, strings, signIn }) =>
    signIn ? (
      <Framed appName={appName}>
        <SignIn signIn={signIn} strings={strings} />
      </Framed>
    ) : (
      <Notice appName={appName} title={strings.noSession}>
        <Alert severity="info" title={strings.noSession}>
          {strings.noSessionDetail}
        </Alert>
      </Notice>
    ),

  active: ({ application }) => application,

  /* Entró y no tiene ninguna capacidad acá. **No redirige**: es la única
     prohibición dura de la máquina, y la razón está en `001`. */
  unauthorized: ({ appName, strings }) => (
    <Notice appName={appName} title={strings.unauthorized}>
      <Alert severity="warning" title={strings.unauthorized}>
        {strings.unauthorizedDetail}
      </Alert>
    </Notice>
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
  ended: ({ appName, endReason, strings }) => (
    <Notice appName={appName} title={strings.sessionEnded}>
      <Alert
        severity="info"
        title={strings.sessionEnded}
        actions={<Button onClick={() => window.location.reload()}>{strings.reload}</Button>}
      >
        {endedDetail(endReason, strings)}
      </Alert>
    </Notice>
  ),
}

function endedDetail(reason: SessionViewContext['endReason'], strings: Strings): string {
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
