import { defineAction, type MessageConstraints } from '@ope/core'
import { CONSTRAINTS, type MerchantCreate } from '../../../api/ope/client'
import { opeOperation } from '../../../api/ope/operations'
import { merchantsStrings } from '../strings'
import { allMerchants } from './merchants'

/**
 * **La capa 2 de `CU-38`, a mano y con su cita.** El `x-invariant`
 * `invalid-origin` de `MerchantCreate` dice en prosa que cada origen es
 * `scheme://host[:port]` sin ruta; una regla en prosa no se emite, así que acá
 * está como patrón, y el servidor sigue siendo quien decide: su `422` cae en el
 * mismo renglón.
 */
const ORIGIN_SHAPE = '^https?://[^/\\s]+$'

/**
 * Lo que el contrato le exige al alta (`CU-38`): la capa 1 **emitida** del
 * bundle (`CONSTRAINTS.MerchantCreate`: cuántos orígenes, de qué largo, y que
 * `signature` es obligatorio) más la capa 2 de arriba sobre cada renglón de
 * `origins`. Nada de esto se escribe dos veces: si el backend sube el largo,
 * el formulario lo sabe en el próximo `contract:sync`.
 */
const emitted = CONSTRAINTS.MerchantCreate
export const merchantConstraints: MessageConstraints = {
  required: emitted.required,
  fields: {
    ...emitted.fields,
    origins: {
      ...emitted.fields.origins,
      items: { ...emitted.fields.origins?.items, pattern: ORIGIN_SHAPE },
    },
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
     aviso se va solo, y un secreto en un aviso es un secreto en pantalla
     (`OW-8`). Las muestra la pantalla que las pidió. */
  announces: (created) => ({
    title: merchantsStrings.merchantCreated,
    description: merchantsStrings.merchantCreatedDetail(created.merchant.merchantId),
  }),

  invalidates: () => [allMerchants],
})
