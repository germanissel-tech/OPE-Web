/**
 * **La prueba de que `CU-23` se cumple: el parámetro equivocado no compila.**
 *
 * No necesita corredor de pruebas. La verifica `tsc --noEmit`, que ya corre:
 * cada `@ts-expect-error` **falla si el error que espera no ocurre** —TypeScript
 * lo reporta como directiva sin usar—, así que este archivo pasa a rojo tanto
 * si el tipado se afloja como si alguien lo rompe.
 *
 * Es la garantía más fuerte de las cinco de la constitución: **no compila**, no
 * «lo agarra una prueba».
 */

import { closes, defineFlow, finishes, opens } from '../src/base/flow'
import { outcome } from '../src/base/outcome'
import { defineService } from '../src/data/service'
import {
  type ContractModule,
  defineAction,
  defineScreen,
  type GridStates,
  type NavigationPort,
  type OperationRequirement,
  operation,
  type ResultProps,
  type Screen,
  type UserMenuEntry,
} from '../src/index'

/* El puerto se **recibe**; no hay un `goTo` de módulo que importar (`CU-36`). */
declare const navigation: NavigationPort

const Nada = () => null

const screens = {
  catalog: defineScreen({ id: 'catalog', title: 'Catálogo', path: '/catalog', component: Nada }),
  companyDetail: defineScreen({
    id: 'companyDetail',
    title: 'Ficha',
    path: '/companies/:id',
    component: Nada,
  }),
  line: defineScreen({
    id: 'line',
    title: 'Renglón',
    path: '/companies/:id/lines/:lineId',
    component: Nada,
  }),
}

/* Lo que TIENE que compilar. */
navigation.goTo(screens.catalog)
navigation.goTo(screens.companyDetail, { id: '1' })
navigation.goTo(screens.line, { id: '1', lineId: '7' })

/* Y lo que NO. Cada uno de estos es CU-23 sosteniéndose. */

// @ts-expect-error — el parámetro se llama `id`, no `di`
navigation.goTo(screens.companyDetail, { di: '1' })

// @ts-expect-error — a esta pantalla le falta un parámetro
navigation.goTo(screens.line, { id: '1' })

// @ts-expect-error — esta pantalla no existe en el registro
navigation.goTo(screens.companyDetai, { id: '1' })

// @ts-expect-error — una ruta con parámetros no se navega sin ellos
navigation.goTo(screens.companyDetail)

// @ts-expect-error — un parámetro no es un número
navigation.goTo(screens.companyDetail, { id: 1 })

/**
 * **Una entrada del menú de usuario hace algo** (`CU-27`).
 *
 * Puede abrir una pantalla, ejecutar algo, o las dos — eso no está limitado.
 * Lo único que no compila es la entrada muerta: un renglón que no hace nada es
 * indistinguible de uno que dejó de funcionar.
 */
const entries: UserMenuEntry[] = [
  { id: 'about', label: 'Acerca', screen: screens.catalog },
  { id: 'help', label: 'Ayuda', onSelect: () => {} },
  { id: 'both', label: 'Avisar y abrir', screen: screens.catalog, onSelect: () => {} },
]
void entries

// @ts-expect-error — una entrada que no abre ni ejecuta nada es un renglón muerto
const dead: UserMenuEntry = { id: 'dead', label: 'No hace nada' }
void dead

/**
 * **Las formas de ruta que el marco no sabe tipar no compilan al declararse**
 * (`CU-41`).
 *
 * Es la mitad que faltaba. Antes, «esta ruta no tiene parámetros» y «no entendí
 * esta ruta» eran el mismo tipo, así que un comodín pasaba: `goTo` no pedía
 * nada y el `*` viajaba literal en la URL, sin fallar en ningún lado.
 */

/* Lo que TIENE que compilar. */
defineScreen({ id: 'ok1', title: 'Estática', path: '/catalog', component: Nada })
defineScreen({
  id: 'ok2',
  title: 'Con uno',
  path: '/companies/:id',
  component: Nada,
})
defineScreen({
  id: 'ok3',
  title: 'Con dos',
  path: '/companies/:id/lines/:lineId',
  component: Nada,
})

// @ts-expect-error — un comodín no tiene nombre, así que no hay qué tipar
defineScreen({ id: 'no1', title: 'Comodín', path: '/files/*', component: Nada })

// @ts-expect-error — un parámetro opcional se leería como `string | undefined`
defineScreen({ id: 'no2', title: 'Opcional', path: '/reports/:year?', component: Nada })

// @ts-expect-error — dos parámetros en un segmento producen una clave inventada
defineScreen({ id: 'no3', title: 'Dos en uno', path: '/files/:name.:ext', component: Nada })

// @ts-expect-error — un parámetro sin nombre no declara nada
defineScreen({ id: 'no4', title: 'Sin nombre', path: '/companies/:', component: Nada })

/**
 * **Una pantalla no se puede armar a mano** (`CU-23`).
 *
 * La marca que le pone `defineScreen` es un símbolo que no se exporta, así que
 * nadie de afuera puede escribirla. Sin esto, un objeto literal salteaba la
 * comprobación de la forma de la ruta — que es lo único que la sostiene.
 */
// @ts-expect-error — le falta la marca, y no hay forma de ponerla desde acá
const handMade: Screen<'/x'> = { id: 'x', title: 'X', path: '/x', component: Nada }
void handMade

/**
 * **La raíz de un flujo no puede tener parámetros** (`CU-47`).
 *
 * La regla estaba en la pantalla —`inMenu`— y se mudó al flujo con el menú:
 * lo que se ofrece ahora es un recorrido, y se entra por su raíz. Sin esto, un
 * flujo con raíz `/companies/:id` no tendría con qué armar su enlace, y se
 * descartaría en silencio.
 */

// @ts-expect-error — no hay con qué completar `/companies/:id` como entrada
defineFlow({ id: 'f1', root: screens.companyDetail, steps: [] })

/* Sin parámetros, cualquiera sirve de raíz. */
defineFlow({ id: 'f2', root: screens.catalog, steps: [] })
defineScreen({ id: 'm4', title: 'Puesta', path: '/shown', component: Nada })
defineScreen({ id: 'm5', title: 'Quitada', path: '/hidden', component: Nada })

/**
 * **Una acción sólo tiene a mano las operaciones que declaró** (`CU-37`).
 *
 * Es lo que hace que «llamar a una operación no declarada» no necesite una
 * comprobación que lo vigile: no está.
 */
const sistema = defineService<{ readonly ping: () => string }>('fake')

const crear = operation(
  'createArticle',
  sistema,
  { capabilities: ['catalog:write'] },
  async (_service, body: { name: string }) => body,
)

defineAction({
  id: 'ok',
  operations: { crear },
  run: (input: { name: string }, ops) => ops.crear.run(input),
})

defineAction({
  id: 'no',
  operations: { crear },
  // @ts-expect-error — `borrar` no está declarada, así que no la tiene
  run: (input: { name: string }, ops) => ops.borrar.run(input),
})

/**
 * **Una exigencia se escribe contra el vocabulario del módulo, y un typo no
 * compila** (`TAN-7`, `CU-37`).
 *
 * El núcleo no sabe qué es `catalog:read`: sabe que `Capability` es lo que el
 * módulo del consumidor lista. Acá el vocabulario es de mentira; el de verdad
 * se prueba al lado de `api/ope/` en cada aplicación, con su módulo.
 */
type Vocabulary = 'catalog:read' | 'catalog:write'

const exige: OperationRequirement<Vocabulary> = {
  capabilities: ['catalog:read'],
  idempotent: false,
}
void exige

const conTypo: OperationRequirement<Vocabulary> = {
  // @ts-expect-error — `catalog:reed` no está en el vocabulario
  capabilities: ['catalog:reed'],
  idempotent: false,
}
void conTypo

/* Y el módulo entero tiene una forma, que es lo que `conformity` espera encontrar. */
const modulo = {
  CONTRACT: { version: '1.0.0', sha256: 'abc' },
  CONSUMER: 'admin',
  CAPABILITIES: ['catalog:read', 'catalog:write'],
  OPERATIONS: { listArticles: { capabilities: ['catalog:read'], idempotent: false } },
} as const

const conForma: ContractModule<typeof modulo.OPERATIONS, Vocabulary> = modulo
void conForma

/* ── Los pasos de un flujo (`CU-47`) ─────────────────────────────────────── */

/**
 * **El destino de un paso es dato, y el compilador lo revisa.**
 *
 * Es lo que se gana al sacar el destino de adentro de un handler: además de
 * poder preguntarle al flujo a dónde lleva un desenlace, **el parámetro
 * equivocado deja de compilar** — la misma garantía que `CU-41` compró para
 * `goTo`, ahora del lado del flujo.
 */

const aFlow = defineFlow({ id: 'catalog', root: screens.catalog, steps: [] })

const chose = outcome<{ id: number }>('catalog.outcomes.articleChosen')
const saved = outcome<{ id: number; code: string }>('catalog.outcomes.articleSaved')
const closed = outcome<Record<never, string>>('catalog.outcomes.articleClosed')

/* Lo que TIENE que compilar. */
opens(chose, screens.companyDetail, ({ id }) => ({ id: String(id) }))
opens(chose, screens.catalog)
finishes(saved)
finishes(saved, screens.companyDetail, ({ id }) => ({ id: String(id) }))
closes(closed)
opens(chose, aFlow)
/* Y diferido, que es la forma que existe para el ciclo: dos flujos que se
   nombran mutuamente no pueden estar los dos declarados antes del otro. Sin
   esto, uno de los dos vale `undefined` al armarse el primero. */
opens(chose, () => aFlow)

/* Y lo que NO. */

// @ts-expect-error — el parámetro se llama `id`, no `di`
opens(chose, screens.companyDetail, ({ id }) => ({ di: String(id) }))

// @ts-expect-error — esta ruta pide parámetros y no se los arma
opens(chose, screens.companyDetail)

// @ts-expect-error — un parámetro de ruta es texto, no número
opens(chose, screens.companyDetail, ({ id }) => ({ id }))

// @ts-expect-error — `code` no es un campo de este desenlace
opens(chose, screens.companyDetail, ({ code }) => ({ id: code }))

// @ts-expect-error — le falta el segundo parámetro de la ruta
finishes(saved, screens.line, ({ id }) => ({ id: String(id) }))

// @ts-expect-error — cerrar no lleva destino
closes(closed, screens.catalog)

// @ts-expect-error — una pantalla que no existe no es un destino
opens(chose, screens.noExiste, () => ({}))

/**
 * **El vacío partido en dos se declara entero, o no compila** (`CU-24`).
 *
 * `empty` y `noMatches` ya eran obligatorios, así que nadie los olvidaba. Lo
 * que se olvidaba era `filtered`, que **es lo único que elige entre los dos**:
 * con omisión, la grilla quedaba diciendo siempre «no hay ninguno todavía» y
 * el segundo vacío no se veía nunca. Verde, y a medias.
 */
// @ts-expect-error — sin `filtered` no hay con qué elegir entre los dos vacíos
const sinFiltroEnLaGrilla: GridStates = {
  empty: { title: 'Todavía no hay artículos' },
  noMatches: { title: 'Ningún filtro coincide' },
}

/* Y así sí, que es lo que fija que el error de arriba sea por lo que dice. */
const conFiltro: GridStates = {
  empty: { title: 'Todavía no hay artículos' },
  noMatches: { title: 'Ningún filtro coincide' },
  filtered: false,
}

void sinFiltroEnLaGrilla
void conFiltro

/* Y lo mismo un renglón más abajo: `Result` tenía su propia omisión, así que
   cerrar sólo la de `GridStates` dejaba el agujero abierto por el otro lado. */
// @ts-expect-error — a `Result` le falta `filtered`
const sinFiltroEnResult: ResultProps<number[]> = {
  query: { data: [], error: undefined, isPending: false, isFetching: false, refetch: () => {} },
  empty: { title: 'Todavía no hay artículos' },
  noMatches: { title: 'Ningún filtro coincide' },
  children: () => null,
}

void sinFiltroEnResult
