import { defineAction, type MessageConstraints } from '@ope/core'
import type { MerchantCreate } from '../../../api/ope/client'
import { opeOperation } from '../../../api/ope/operations'
import { merchantsStrings } from '../strings'
import { allMerchants } from './merchants'

/**
 * Lo que el contrato le exige al alta (`CU-38`, capa 1), **escrito a mano y
 * con la cita**: `MerchantCreate` en `contracts/ope/openapi.yaml` — `origins`
 * de 1 a 20 orígenes de hasta 255 caracteres, `signature` booleano. El hola
 * mundo toma **un** origen; la capa 2 (`invalid-origin`, la forma del origen)
 * y la 3 (`origin-already-registered`, otro merchant) las contesta el servidor
 * con `errors[]` al campo.
 *
 * Sin generador: el de cuarzo leía `demo.yaml` con expresiones regulares y se
 * retiró con el simulado. Cuando el backend emita las restricciones con el
 * módulo del contrato (040), esto se reemplaza por lo emitido.
 */
export const merchantConstraints: MessageConstraints = {
  required: ['origin'],
  fields: {
    origin: { type: 'string', minLength: 1, maxLength: 255, pattern: '^https?://[^/\\s]+$' },
  },
}

/**
 * El alta de un merchant — **y el ejemplo de cómo se escribe una acción**.
 *
 * Una acción es lo que ejecuta un botón: declara qué hace y qué queda viejo
 * después. El aviso, la invalidación, los mensajes que vuelven a los campos y
 * el no reintentar **los pone el marco** (`CU-25`).
 *
 * **Se declara en el módulo**, como una pantalla o una funcionalidad: es una
 * declaración y no tiene estado. El servicio contra el que habla se **nombra**;
 * quién lo cumple lo resuelve la puerta al ejecutar (`CU-36`).
 */
export const createMerchant = defineAction({
  id: 'merchant.create',

  /* El nombre es el del contrato, y de él salen las capacidades que exige
     (`merchants:write`) — por eso no se escriben en ningún otro lado. */
  operations: {
    create: opeOperation('createMerchant', (ope, body: MerchantCreate) => ope.createMerchant(body)),
  },

  run: (input: MerchantCreate, ops) => ops.create.run(input),

  /* El título es **qué pasó**; la descripción, **con qué referirse a eso**. Las
     credenciales viajan en la respuesta **una sola vez** y no van al aviso: un
     aviso se va solo, y un secreto en un aviso es un secreto en pantalla. */
  announces: (created) => ({
    title: merchantsStrings.merchantCreated,
    description: merchantsStrings.merchantCreatedDetail(created.merchant.merchantId),
  }),

  invalidates: () => [allMerchants],
})
