import { defineAction, type MessageConstraints } from '@ope/core'
import {
  CONSTRAINTS,
  type CredentialIssued,
  type CredentialKind,
  type OpeClient,
} from '../../../api/ope/client'
import { opeOperation } from '../../../api/ope/operations'
import { merchantsStrings } from '../strings'
import { merchantLog } from './merchant-log'
import { oneMerchant } from './merchants'

/**
 * Lo que el contrato le exige a una rotación (`CU-38`, capa 1, emitida):
 * `graceSeconds` entero desde cero. **El máximo no está acá** a propósito: lo
 * fija la configuración de la plataforma, y el `422 rotation-grace-too-long`
 * lo dice en el campo cuando importa.
 */
export const rotationConstraints: MessageConstraints = CONSTRAINTS.CredentialRotation

export type RotationInput = {
  readonly merchantId: string
  readonly kind: CredentialKind
  readonly graceSeconds: number
}

const rotation = (
  id: 'rotateIngestKey' | 'rotatePlatformKey' | 'rotatePlatformSecret',
  call: keyof Pick<OpeClient, 'rotateIngestKey' | 'rotatePlatformKey' | 'rotatePlatformSecret'>,
) =>
  opeOperation(
    id,
    (ope, input: RotationInput): Promise<CredentialIssued> =>
      ope[call](input.merchantId, { graceSeconds: input.graceSeconds }),
  )

/**
 * Rotar **una** credencial de un merchant, de cualquiera de las tres clases.
 *
 * **Una acción y tres operaciones**, y `run` elige por `kind`: el formulario es
 * uno, lo que exige es lo mismo para las tres (`credentials:rotate`, del módulo
 * del contrato), y lo que vuelve tiene la misma forma. Tres acciones serían
 * tres pantallas, o una con tres puertas.
 *
 * **Lo que vuelve lleva el valor una sola vez** (`ADR-031` del backend): la
 * pantalla lo muestra, y el aviso **nunca** (`OW-8`).
 */
export const rotateCredential = defineAction({
  id: 'merchant.rotate',

  operations: {
    ingest: rotation('rotateIngestKey', 'rotateIngestKey'),
    platform: rotation('rotatePlatformKey', 'rotatePlatformKey'),
    signing: rotation('rotatePlatformSecret', 'rotatePlatformSecret'),
  },

  run: (input: RotationInput, ops) => ops[input.kind].run(input),

  announces: (issued, input) => ({
    title: merchantsStrings.rotated(issued.kind),
    description: input.merchantId,
  }),

  /* La ficha muestra el `issuedAt` nuevo y el registro la rotación; la grilla
     no muestra credenciales. */
  invalidates: (input) => [oneMerchant(input.merchantId), merchantLog(input.merchantId)],
})
