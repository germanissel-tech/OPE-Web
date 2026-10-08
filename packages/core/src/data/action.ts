import { Failure } from '../base/failure'
import type { ServiceKey } from './service'

/**
 * **Una acción es lo que ejecuta un botón** (`CU-37`).
 *
 * Declara tres cosas y ninguna es cómo se dibuja:
 *
 * | | |
 * |---|---|
 * | **Qué operaciones invoca** | De ahí sale la capacidad que exige, y **sólo ésas tiene a mano** |
 * | **Qué queda viejo** cuando sale bien | El marco invalida eso, y nada más (`CU-25`) |
 * | **Si repite sin duplicar** | El contrato lo declara por operación (`x-idempotency`): OPE repite por cuerpo idéntico, sin clave (`CU-34`) |
 *
 * Lo demás lo pone el marco: el aviso, la invalidación, los campos que vuelven
 * rechazados, y **que no se reintente nunca**.
 */

/**
 * Una operación del contrato, con su identificador.
 *
 * El `id` es el `operationId` **tal como lo escribió el backend**, y no un
 * nombre nuestro: de él sale la capacidad, y una copia con otro nombre sería
 * la desincronización que `CU-37` existe para cerrar.
 */
export type Operation<Input, Output> = {
  readonly id: string
  /**
   * Las `x-required-capabilities` de **esta** operación, salidas del contrato.
   *
   * No se escriben: llegan en el módulo que el backend emite por consumidor
   * (`TAN-7`, `contracts/ope/capabilities`). Una copia a mano es la
   * desincronización que `CU-37` existe para cerrar — el panel ofreciendo un
   * botón que la API rechaza.
   */
  readonly capabilities: readonly string[]
  /**
   * Si el contrato la declara idempotente (`CU-34`).
   *
   * En OPE la repetición es **por cuerpo idéntico** (`x-idempotency`): no hay
   * clave que la puerta ponga, y el mismo pedido dos veces responde lo mismo.
   * Sale del contrato, igual que las capacidades: escribirlo a mano sería una
   * tercera fuente —el contrato, los tipos, y una casilla— y la que se olvida
   * es siempre la casilla.
   */
  readonly idempotent: boolean
  /**
   * Si el contrato le exige el testigo del recurso (`CU-29`).
   *
   * **Sale del contrato, igual que los otros dos**: se genera mirando si la
   * operación declara `If-Match`.
   *
   * A diferencia de la clave, **el testigo no lo pone la puerta**: lo trae la
   * pantalla, porque es quien leyó el registro. Por eso viaja en la entrada y no
   * por el canal de la clave — dos datos con orígenes distintos que compartan
   * camino terminan confundiéndose.
   *
   * Lo que la puerta hace con esto es lo otro: saber que un rechazo por versión
   * vieja **es reintentable con un testigo nuevo**, que es de lo que depende que
   * el caso sin cruce se guarde sin molestar a nadie.
   */
  readonly versioned: boolean
  /**
   * Contra qué sistema habla, **por su clave y no por el objeto**.
   *
   * Es lo que permite declarar una acción en el módulo: el servicio sólo existe
   * después de la sesión, así que la operación lo **nombra** y la puerta lo
   * resuelve al ejecutar (`CU-36`).
   */
  readonly serviceId: string
  /**
   * Lo que hace, con el servicio ya resuelto.
   *
   * **Ni el servicio ni la clave los pone quien declara la acción**: los dos los
   * pone la puerta (`CU-34`, `CU-36`). Quien la declara escribe qué llamada es.
   */
  readonly run: (service: unknown, input: Input, idempotencyKey?: string) => Promise<Output>
}

export function operation<Service, Input, Output>(
  id: string,
  /** Contra cuál habla. La misma clave con la que la raíz lo registró. */
  service: ServiceKey<Service>,
  /**
   * Lo que el contrato le exige. Se genera; no se escribe (`CU-37`, `CU-34`).
   *
   * `idempotent` y `versioned` se omiten cuando el contrato no los declara:
   * OPE no tiene testigo (`If-Match`) todavía, y obligar a escribir
   * `versioned: false` treinta veces es la casilla que se copia sin mirar.
   */
  requires: {
    readonly capabilities: readonly string[]
    readonly idempotent?: boolean
    readonly versioned?: boolean
  },
  run: (service: Service, input: Input, idempotencyKey?: string) => Promise<Output>,
): Operation<Input, Output> {
  return {
    id,
    serviceId: service.id,
    capabilities: requires.capabilities,
    idempotent: requires.idempotent ?? false,
    versioned: requires.versioned ?? false,
    /* La costura del tipo: lo que la puerta resuelve por esta clave es el
       `Service` por construcción, porque se registró con ella. Es la misma que
       `useService` y `route()` (`CU-44`). */
    run: (resolved, input, key) => run(resolved as Service, input, key),
  }
}

/** Lo que una acción declara tener a mano. */
export type Operations = Readonly<Record<string, Operation<never, unknown>>>

/**
 * Las mismas operaciones **ya resueltas**, que es lo que `run` recibe.
 *
 * Sin el servicio y sin la clave: los dos los puso la puerta antes de llamar.
 * Por eso quien declara una acción escribe `ops.create.run(input)` y nada más.
 */
export type Resolved<Ops extends Operations> = {
  readonly [Name in keyof Ops]: Ops[Name] extends Operation<infer Input, infer Output>
    ? { readonly run: (input: Input) => Promise<Output> }
    : never
}

/**
 * Lo que se invalida al salir bien.
 *
 * Se declara **al lado de la acción y no en otro archivo**, para que se lea
 * junto: el riesgo asumido es declarar de menos, y el síntoma es una pantalla
 * que muestra lo de antes **a veces** (`CU-25`).
 */
export type Invalidation = readonly unknown[]

/**
 * Lo que un aviso de éxito dice.
 *
 * **El título es lo que pasó; la descripción, con qué referirse a eso después.**
 * Sin descripción, granito dibuja sólo la franja del tono — el cuerpo del aviso
 * es lo que la descripción llena.
 */
export type Announcement = {
  readonly title: string
  readonly description?: string
}

export type ActionSpec<Input, Output, Ops extends Operations> = {
  /** Con qué se la nombra. Aparece en el registro y en lo que se anota. */
  readonly id: string
  /**
   * Las que invoca, y **las únicas que recibe**.
   *
   * Llamar a una que no declaró es imposible porque no la tiene: no hace falta
   * una comprobación que lo vigile (`CU-37`).
   */
  readonly operations: Ops
  readonly run: (input: Input, operations: Resolved<Ops>) => Promise<Output>
  readonly invalidates?: (input: Input, output: Output) => readonly Invalidation[]
  /**
   * **Qué anuncia cuando sale bien.**
   *
   * Lo declara la acción porque nadie más sabe qué pasó. **El del error no**, y
   * eso tampoco es un olvido: quién escribe cada texto, y por qué, está en
   * `CU-25`.
   *
   * Es una función para poder nombrar lo que pasó: «Se creó Ibuprofeno 400 mg»
   * y no «Se creó un artículo».
   *
   * Un texto pelado es el título. **Con `description` se llena el cuerpo del
   * aviso**, que es donde va el comprobante que el operador puede necesitar
   * —un número de recibo, un código— igual que el `requestId` en el del error.
   */
  readonly announces?: (output: Output, input: Input) => string | Announcement
}

export type Action<Input, Output, Ops extends Operations = Operations> = ActionSpec<
  Input,
  Output,
  Ops
> & {
  /**
   * Los `operationId` que invoca. De acá sale la capacidad exigida (`CU-37`).
   *
   * **La unión, no la principal**: una acción que empieza y no puede terminar
   * deja el sistema a medias, que es lo que `CU-34` existe para evitar.
   */
  readonly operationIds: readonly string[]
  /**
   * Lo que la sesión tiene que habilitar para que esta acción se pueda ofrecer.
   *
   * **La unión de las capacidades de sus operaciones, no la de la principal**: una
   * acción que empieza y no puede terminar deja el sistema a medias, que es lo
   * que `CU-34` existe para evitar.
   */
  readonly requires: readonly string[]
  /**
   * Si alguna de sus operaciones exige clave (`CU-34`).
   *
   * **Cualquiera alcanza**: si una acción escribe en dos lugares y el segundo
   * pide clave, el intento entero es un intento.
   */
  readonly idempotent: boolean
}

/**
 * Declara una acción.
 *
 * **Escribe en un solo lugar.** Compone lecturas de donde haga falta, pero no
 * hay transacción que abarque dos backends (`CU-22`): si la segunda escritura
 * falla, la primera ya ocurrió, y una pantalla no puede hacerse cargo de la
 * mitad que quedó hecha.
 */
export function defineAction<Input, Output, Ops extends Operations>(
  spec: ActionSpec<Input, Output, Ops>,
): Action<Input, Output, Ops> {
  const operationIds = Object.values(spec.operations).map((each) => each.id)

  if (operationIds.length === 0) {
    throw new Failure(
      'declaration.actionWithoutOperations',
      `La acción "${spec.id}" no declara ninguna operación, así que no hay de dónde sacar qué capacidad exige.`,
    )
  }

  const repeated = operationIds.filter((id, at) => operationIds.indexOf(id) !== at)
  if (repeated.length > 0) {
    throw new Failure(
      'declaration.duplicateOperation',
      `La acción "${spec.id}" declara dos veces la operación "${repeated[0]}".`,
    )
  }

  const requires = [...new Set(Object.values(spec.operations).flatMap((each) => each.capabilities))]

  if (requires.length === 0) {
    throw new Failure(
      'declaration.actionWithoutOperations',
      `Ninguna operación de "${spec.id}" exige una capacidad, así que su botón se dibujaría para cualquiera.`,
    )
  }

  const idempotent = Object.values(spec.operations).some((each) => each.idempotent)

  return { ...spec, operationIds, requires, idempotent }
}

/**
 * Si la sesión habilita una acción.
 *
 * **Por capacidad no se muestra; por estado se deshabilita** (`CU-3`, `CU-37`). Esto
 * decide lo primero: lo que un permiso no habilita **no se dibuja**, y no queda
 * un botón gris permanente que nunca se va a poder usar.
 */
export function isEnabled(
  /* Se pide lo que se usa y no la acción entera: así una prueba puede pasarle
     un objeto de un campo, y no hay varianza que pelear. */
  action: { readonly requires: readonly string[] },
  capabilities: ReadonlySet<string>,
): boolean {
  return action.requires.every((capability) => capabilities.has(capability))
}
