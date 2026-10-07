import { Alert } from '@granito/ui'
import { IncompleteConfig } from '../base/config'
import { useStrings } from '../base/use-strings'

/**
 * Lo que se ve cuando **no hay configuración**.
 *
 * Lo pone la aplicación y no el marco porque **el mensaje depende de qué
 * configuración espera esta aplicación**, y el marco no la conoce.
 *
 * Usa granito igual que todo lo demás: granito no necesita nuestra
 * configuración para funcionar, y sus estilos ya se importaron al arrancar.
 */
export function CannotStart({ error }: { error: unknown }) {
  /* Acá el catálogo cae siempre en los de por omisión, y es correcto: si no se
     pudo leer la configuración tampoco hay manifiesto del cual sacar textos. */
  const strings = useStrings()

  if (!(error instanceof IncompleteConfig)) {
    return (
      <Alert severity="error" title={strings.cannotStart}>
        {String(error)}
      </Alert>
    )
  }

  return (
    <Alert severity="error" title={strings.cannotStart}>
      {strings.missingConfig}
      <ul>
        {error.missing.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {strings.missingConfigWhy}
    </Alert>
  )
}
