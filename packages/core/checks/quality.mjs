/**
 * Lo **mecanizable** del estándar de `TAN-6`.
 *
 * No verifica «SOLID»: eso no se mecaniza, y prometerlo sería el mismo defecto
 * que originó la decisión — `CU-36` decía tener una comprobación que nunca se
 * escribió. Acá están las reglas que **sí** pueden fallar solas, y nada más.
 *
 * **No se dice cuántas son.** El número escrito envejece con la primera regla
 * que se agregue, y un encabezado que miente sobre su propio archivo es
 * exactamente lo que esto vino a evitar: decía ocho cuando ya eran trece.
 *
 * **Pocas reglas y sin falsos positivos, a propósito.** Una comprobación que
 * marca de más enseña a saltear su salida, y ahí se pierden también las que
 * importan. Si una regla empieza a marcar cosas legítimas, se saca — no se le
 * agregan excepciones hasta que no signifique nada.
 *
 * Lo que esto **no** ve queda para el revisor de contexto limpio: si una
 * abstracción es la correcta, si un nombre miente, si la responsabilidad está
 * bien partida.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apps, config, ROOT } from './context.mjs'

/**
 * **La capa de composición**, exenta de las reglas 1 y 6 (`CU-36`).
 *
 * Son cuatro archivos y no uno porque desde `CU-42` el cableado se publica: el
 * paquete **arma** y la aplicación **elige**. Cada uno tiene su razón escrita
 * abajo, y **la lista no se amplía para que una comprobación pase** — si algo
 * más necesitara entrar, lo que hay que revisar es el diseño.
 */
const COMPOSITION_ROOT = config.compositionLayer

const failures = []
/**
 * **Después de la compuerta, acumular una falla no hace nada**: el código de
 * salida ya se decidió. Pasó tres veces en este archivo, y las tres la falla se
 * imprimió y la comprobación aprobó igual — que es la peor combinación posible,
 * porque se ve el problema y el verde dice que no lo hay.
 */
let gateClosed = false
const closeGate = () => {
  gateClosed = true
}

const fail = (rule, where, detail) => {
  if (gateClosed) {
    throw new Error(
      `Se llamó a fail() con "${rule}" después de la compuerta: esa falla no cambiaría el código de salida. Movela arriba.`,
    )
  }
  failures.push({ rule, where, detail })
}

function filesIn(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) filesIn(path, out)
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$|\.test-d\.ts$/.test(name)) out.push(path)
  }
  return out
}

/** El código sin comentarios: se juzga lo que se ejecuta, no lo que se explica. */
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')

/**
 * **Lo generado no se revisa**: se regenera.
 *
 * Los tipos del contrato salen de `openapi-typescript` (`CU-14`) y traen las
 * descripciones del backend adentro de comentarios. Marcarlas sería pedir que
 * alguien edite un archivo que dice «no editar», y la corrección duraría hasta
 * la próxima generación.
 *
 * Se reconoce por su encabezado y **se dice cuántos se saltearon**: una
 * comprobación que descarta en silencio enseña a no leer sus aprobados.
 */
const isGenerated = (file) => readFileSync(file, 'utf8').slice(0, 200).includes('auto-generated')

const todos = [
  ...apps.flatMap((app) => filesIn(join(ROOT, ...app.split('/'), 'src'))),
  ...filesIn(join(ROOT, 'packages')),
]
const generated = todos.filter(isGenerated)
const checked = todos.filter((file) => !generated.includes(file))

for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const code = stripComments(readFileSync(file, 'utf8'))
  const isCompositionRoot = COMPOSITION_ROOT.includes(shortPath)

  /**
   * **1 · Estado mutable de módulo, fuera de la raíz de composición.**
   *
   * Una `let` de módulo hace imposible tener dos instancias, obliga a limpiar
   * entre pruebas, y sobre todo **esconde la dependencia**: quien la usa no la
   * declara en ninguna firma. Es la D de SOLID, y es la que más caro sale.
   */
  if (!isCompositionRoot) {
    for (const m of code.matchAll(/^(?:export\s+)?let\s+(\w+)/gm)) {
      fail('Estado mutable de módulo (TAN-6, regla 1)', shortPath, `let ${m[1]}`)
    }
  }

  /**
   * **2 · Construir algo con ciclo de vida adentro de un render.**
   *
   * Se recrea en cada dibujo, y con él se pierde todo lo que colgaba: el
   * historial, el caché, la conexión. El síntoma aparece lejos de la causa.
   */
  for (const m of code.matchAll(/\b(createBrowserRouter|createHashRouter|new QueryClient)\b/g)) {
    const before = code.slice(0, m.index)
    const insideComponent = /function\s+[A-Z]\w*\s*\([^)]*\)\s*\{(?:[^{}]|\{[^{}]*\})*$/.test(
      before,
    )
    if (insideComponent) {
      fail('Recurso con ciclo de vida creado en un render (TAN-6, regla 2)', shortPath, m[1])
    }
  }

  /**
   * **3 · Un `as` hacia un tipo que agrega campos.**
   *
   * Afirmar que existe algo que no existe compila, y devuelve `undefined` en
   * producción.
   *
   * **Sólo cuenta si el destino es una intersección declarada en este mismo
   * archivo** —`type X = Y & { ... }`—, que es la forma que tiene el campo
   * fantasma. Un `as Record<string, unknown>` después de un guard **estrecha**,
   * no agrega, y es legítimo.
   */
  /**
   * Las intersecciones declaradas en este archivo.
   *
   * Se toma **el cuerpo entero de la declaración** —hasta la que sigue— en vez
   * de buscar el `=` del cuerpo: un genérico puede traer un valor por omisión,
   * y ahí el primer `=` es el del genérico y no el del tipo. Con eso se escapaba
   * justamente `Screen`, que es la única intersección con campo fantasma que hubo.
   */
  const declarations = [
    ...code.matchAll(
      /^(?:export[ ]+)?(?:type|interface|function|const|let|class|enum)[ ]+([A-Za-z0-9_$]+)/gm,
    ),
  ]
  const intersections = new Set()
  for (const [n, declaration] of declarations.entries()) {
    if (!/^(?:export[ ]+)?type[ ]/.test(declaration[0])) continue
    const from = declaration.index
    const to = declarations[n + 1]?.index ?? code.length
    if (code.slice(from, to).includes('&')) intersections.add(declaration[1])
  }
  for (const m of code.matchAll(/\bas\s+(\w+)\s*(?:<[^>]*>)?/g)) {
    if (intersections.has(m[1])) {
      fail('Conversión que afirma campos inexistentes (TAN-6, regla 3)', shortPath, `as ${m[1]}`)
    }
  }
}

/**
 * **6 · Sólo la raíz de composición nombra implementaciones concretas.**
 *
 * Es la garantía que `CU-36` **decía tener y no tenía**: *«un `import` de una
 * implementación concreta fuera de la raíz falla»*. La decisión escribió su
 * propio modo de falla en la línea siguiente —*un patrón que depende de que
 * todos lo respeten dura hasta el primer apuro*— y duró hasta el primer apuro.
 *
 * La lista es **corta y explícita**, no una heurística: son las cosas que
 * eligen un proveedor, un ruteador o un servicio. Fuera de la raíz, cualquiera
 * de ellas significa que alguien decidió por su cuenta contra qué habla.
 */
const CONCRETE = [
  'createFakeSession',
  'createBrowserRouter',
  'createHashRouter',
  'configureSession',
]

for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  if (COMPOSITION_ROOT.includes(shortPath)) continue
  const code = stripComments(readFileSync(file, 'utf8'))

  /* Se mira el `import`, no el uso: lo que define quién conoce una
     implementación es quién la trae. */
  for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from|await\s+import\([^)]*\)/g)) {
    const named = m[1] ?? ''
    for (const symbol of CONCRETE) {
      if (new RegExp(`(?<![A-Za-z0-9_])${symbol}(?![A-Za-z0-9_])`).test(named)) {
        fail(
          'Implementación concreta importada fuera de la raíz (CU-36, TAN-6 regla 6)',
          shortPath,
          symbol,
        )
      }
    }
  }
}

/**
 * **7 · Un comentario que narra historia.**
 *
 * Un comentario explica **el código que está, no el que estuvo**. Uno que cuenta
 * un cambio le hace creer a quien lo lee que hay algo que buscar, y a un agente
 * le da contexto de algo que ya no existe.
 *
 * La razón de un diseño sí va, **dicha en presente**: «se arma una vez porque un
 * ruteador reconstruido recrea el historial» explica; «antes se rehacía en cada
 * dibujo» narra.
 *
 * Las marcas son giros que **sólo tienen sentido mirando hacia atrás**. No se
 * mira «ahora» ni «ya», que en presente son legítimos.
 */
const NARRATIVE = [
  /\bantes (?:se|era|eran|hab|depend|est|lo |la |el |esto|no )/i,
  /\bversi[oó]n anterior\b/i,
  /\bac[aá] hab[ií]a\b/i,
  /\bse borr[oó]\b|\bse borraron\b/i,
  /\bya no (?:est[aá]|existe|hace falta)/i,
  /\bprimera corrida\b/i,
  /\bya pas[oó]\b/i,
  /\bsol[ií]a\b/i,
]

/**
 * **Los archivos que esta regla mira, y por qué son más que los del resto.**
 *
 * Un comentario que narra historia envejece igual en un guion que en una
 * pantalla, así que entran también los `.mjs` de `tests/` y de las propias
 * comprobaciones — que es donde más se escribe «antes esto era así».
 *
 * `filesIn` sólo junta `.ts` y `.tsx`, y `tests/` es todo `.mjs`: nombrarla sin
 * esto dejaba la regla declarando que miraba una carpeta de la que **no leía un
 * solo archivo**.
 */
const scripts = ['tests', 'packages/core/checks']
  .map((dir) => join(ROOT, ...dir.split('/')))
  .filter((dir) => existsSync(dir))
  .flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => name.endsWith('.mjs'))
      .map((name) => join(dir, name)),
  )

for (const file of [...checked, ...filesIn(join(ROOT, 'tests')), ...scripts]) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  /* sin sujeto: este archivo **contiene** los patrones que busca, así que
     mirarse a sí mismo es encontrarlos siempre. La ruta se saca de `import.meta`
     y no se escribe, porque escrita se quedó vieja al mudar la carpeta y la
     exención dejó de coincidir sin que nada lo dijera. */
  if (file === fileURLToPath(import.meta.url)) continue
  const text = readFileSync(file, 'utf8')

  for (const comment of text.matchAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->/g)) {
    for (const pattern of NARRATIVE) {
      const found = comment[0].match(pattern)
      if (found) {
        fail('Un comentario narra historia (TAN-6, regla 7)', shortPath, `«…${found[0]}…»`)
      }
    }
  }
}

/**
 * **5 · Un comentario que repite el texto de una decisión.**
 *
 * Una cita resuelve o no; **una paráfrasis no tiene contra qué compararse**.
 * Copiar el texto de una decisión al código crea una segunda fuente que nada
 * vigila: se corrige la decisión y el comentario queda diciendo lo viejo.
 *

 * El umbral es **la oración completa**, y no menos: con fragmentos cortos
 * marcaría cualquier vocabulario compartido, y una regla que marca de más
 * enseña a saltear la salida.
 */
const DECISION_DOCS = config.decisionDocs

/** Oraciones de una decisión, ya limpias de markdown y suficientemente largas. */
function sentencesOf(text) {
  return new Set(
    text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*`_>|#-]/g, '')
      .split(/(?<=[.:])\s+|\n\n/)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length >= 45),
  )
}

const decisionSentences = new Set()
for (const doc of DECISION_DOCS) {
  const path = join(ROOT, doc)
  if (!existsSync(path)) continue
  for (const s of sentencesOf(readFileSync(path, 'utf8'))) decisionSentences.add(s)
}

for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const text = readFileSync(file, 'utf8')
  const comments = [...text.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0])

  for (const comment of comments) {
    for (const sentence of sentencesOf(comment.replace(/^\s*\*/gm, ''))) {
      if (decisionSentences.has(sentence)) {
        fail(
          'Un comentario repite el texto de una decisión (TAN-6, regla 5)',
          shortPath,
          `«${sentence.slice(0, 70)}…»`,
        )
      }
    }
  }
}

/* La regla 12 de cuarzo —la palabra «cliente» en un comentario— no está: era la
   convención de cuenta corriente de Tandilia, y en OPE esa palabra no está
   ocupada (`docs/origen.md`). La numeración de las demás se conserva para que
   las citas a `TAN-6, regla n` sigan resolviendo. */

/**
 * **4 · Una comprobación que se va sin decir nada cuando no encuentra qué
 * revisar.**
 *
 * Pasó tres veces en un día: la de granito cuando no está al lado, la de la
 * puerta al renombrar una carpeta, y la del artefacto sin compilación.
 *
 * **La ausencia legítima existe** —todavía no se compiló, el repo hermano no
 * está al lado— y por eso no se prohíbe salir: se exige **decirlo**. La forma
 * es la que ya se usa en todo el repositorio, un renglón que empieza con `--`:
 *
 * ```
 * --     no hay dist/ todavía: la falsa no se verificó
 * ```
 *
 * Con eso, quien lee la salida sabe qué **no** se revisó, que es lo único que
 * distingue un aprobado de un silencio.
 *
 * **La otra forma declarada es un comentario `sin sujeto:`**, para el salto que
 * no deja nada sin revisar: un bucle probando extensiones de archivo se saltea
 * candidatos, no sujetos, y ahí no hay nada que informar. Se pide igual que se
 * escriba, por lo mismo que la primera — la salida existe, pero hay que
 * nombrarla.
 *
 * Sin ninguna de las dos, **falla**. Y falla en vez de avisar porque un aviso
 * permanente se vuelve parte del paisaje, que es el daño que esta regla vino a
 * impedir: estuvo seis corridas seguidas señalando seis ausencias que **sí**
 * estaban declaradas, y por eso nadie lo leyó.
 *
 * Las tres formas de irse son `process.exit(0)`, `return` y `continue`. La
 * tercera es la que se escapaba, y es la que tuvo la de las capas del paquete.
 */
const WATCHED = ['tests', 'packages/core/checks']

/** Irse por una ausencia: la condición, y cómo se sale. */
const LEAVES = /!existsSync\([^)]*\)([\s\S]{0,200}?)(process\.exit\(0\)|continue|return)/g

/** Las dos formas de declararla: el renglón que se imprime, o el comentario. */
const SAYS = /['`]\s*--\s|sin sujeto:|\bfail\(/

const degradaciones = []
for (const dir of WATCHED) {
  const full = join(ROOT, ...dir.split('/'))
  if (!existsSync(full)) {
    console.log(`  --     no está ${dir}/: no se revisó ninguna comprobación de ahí`)
    continue
  }

  for (const name of readdirSync(full)) {
    if (!name.endsWith('.mjs') || name === 'quality.mjs') continue
    /* **Sin quitar comentarios**, al revés que el resto: acá el comentario es
       una de las dos formas de declarar, así que sacarlo sería borrar la mitad
       de lo que se busca. */
    const code = readFileSync(join(full, name), 'utf8')

    for (const salida of code.matchAll(LEAVES)) {
      /* **La ventana mira para los dos lados.** La razón se escribe arriba del
         `if`, que es donde se lee, y no metida entre la condición y la salida. */
      const desde = Math.max(0, salida.index - 300)
      if (SAYS.test(code.slice(desde, salida.index + salida[0].length))) continue

      degradaciones.push(`${dir}/${name}`)
      break
    }
  }
}

/**
 * **8 · Una pantalla registrada se llama `…Screen`.**
 *
 * `Welcome` puede ser cualquier cosa; `WelcomeScreen` dice qué es y cómo se usa.
 * Sufijo y no prefijo porque se lee en el JSX y ordena por dominio, que es lo
 * que hace falta cuando una funcionalidad tiene seis pantallas.
 *
 * Se mira **lo que `defineScreen` recibe como `component`**, que es el único
 * lugar donde «pantalla» está definido sin ambigüedad. Los demás sufijos
 * —`…Provider`, `…Dialog`— no se mecanizan sin falsos positivos y quedan para
 * la revisión de `TAN-6`.
 */
for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const code = stripComments(readFileSync(file, 'utf8'))

  for (const match of code.matchAll(/\bcomponent:\s*([A-Za-z0-9_$]+)/g)) {
    const name = match[1]
    /* Un tipo, no un componente: `ComponentType` aparece en las firmas. */
    if (name === 'ComponentType') continue
    if (!name.endsWith('Screen')) {
      fail('Una pantalla registrada no se llama …Screen', shortPath, name)
    }
  }
}

/**
 * **9 · Ninguna preferencia se conoce por nombre fuera de su archivo.**
 *
 * Una preferencia es un archivo de `base/preferences/`, y el resto del núcleo
 * trabaja contra el tipo `Preference` sin saber cuáles hay. Eso es lo que hace
 * que agregar una cueste un archivo y no seis (`CU-27`).
 *
 * Sin esto, cablear una por nombre **no falla**: anda igual, y el costo recién
 * se ve cuando alguien agrega la siguiente.
 */

/** Dónde vive cada preferencia. Nadie más del núcleo las importa. */
const PREFERENCES_DIR = 'packages/core/src/base/preferences/'

/**
 * Los dos que pueden importarlas, y por qué:
 *
 * - **`index.ts`**, porque la superficie pública tiene que exportarlas: una
 *   aplicación las declara en su manifiesto.
 * - **`frame.tsx`**, porque los globos no se aplican al documento como el tema
 *   sino que son una prop del `AppShell` de granito, así que alguien tiene que
 *   leerlos. Es una prop, no una decisión.
 *
 * **La lista no se amplía para que la comprobación pase.** Si algo más
 * necesitara entrar, lo que hay que revisar es el diseño.
 */
const MAY_IMPORT_PREFERENCES = ['packages/core/src/index.ts', 'packages/core/src/ui/frame.tsx']

for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const code = stripComments(readFileSync(file, 'utf8'))
  const isPreference = shortPath.startsWith(PREFERENCES_DIR)

  if (!isPreference && !MAY_IMPORT_PREFERENCES.includes(shortPath)) {
    for (const m of code.matchAll(/from '[^']*base\/preferences\/([a-z-]+)'/g)) {
      fail('Una preferencia importada por nombre fuera de su archivo', shortPath, m[1])
    }
  }
}

/**
 * **10 · Ningún texto de interfaz suelto en el marco.**
 *
 * Lo que cuarzo publica se dibuja en las cuatro aplicaciones, así que una frase
 * escrita adentro de un componente **no se puede cambiar sin reemplazar la
 * pieza entera**. Van todas al catálogo de `base/strings.ts`, que una
 * aplicación reemplaza por partes desde su manifiesto (`CU-43`).
 *
 * Se mira `ui/` y `app/`, que es lo que dibuja. `base/` queda afuera porque ahí
 * vive el catálogo.
 *
 * **Los `throw` no cuentan.** Los lee un desarrollador, no un operador: son la
 * otra mitad de la decisión, y meterlos al catálogo los haría competir por
 * redacción con lo que sí es interfaz.
 */
/**
 * Dónde no puede haber un texto suelto.
 *
 * En el marco, `ui/` y `app/` — lo que dibuja. `base/` queda afuera porque ahí
 * vive el catálogo.
 *
 * Y en la aplicación, `features/` y `app/`: cada funcionalidad tiene el suyo en
 * `features/<x>/strings.ts`, y la aplicación el de `app/strings.ts`.
 */
const DRAWS = ['packages/core/src/ui/', 'packages/core/src/app/', 'src/features/', 'src/app/']

/**
 * Lo que no es interfaz aunque lo parezca.
 *
 * El catálogo, obviamente. Y `dev-session.ts`, que tiene **claims de mentira**:
 * «Ana Operadora» es un dato, no algo que alguien redacte.
 */
const NOT_INTERFACE = /(^|\/)(strings\.ts|dev-session\.ts)$/

/**
 * Los diagnósticos, que **los lee un desarrollador y no un operador**.
 *
 * Un `new Failure(...)` y la razón de un campo de configuración: la segunda
 * aparece cuando la aplicación no arranca porque falta algo, y quien la ve
 * está mirando un `config.json`, no atendiendo un mostrador.
 */
const DIAGNOSTIC = /(new [A-Za-z]+|because)\((?:[^()]|\([^()]*\))*\)/g

/** Empieza en mayúscula —o en signo de apertura— y tiene más de una palabra. */
const PROSE = /^[A-ZÁÉÍÓÚÑ¿¡].*[ ]/

/**
 * El texto escrito entre etiquetas, que no lleva comillas.
 *
 * **Sin esto la regla no agarra el caso que la motivó**: «Nuevo artículo» llegó
 * a estar escrito tres veces, y las tres eran hijos de un `<Button>`. Mirar
 * sólo lo entrecomillado dejaba pasar la forma más común de escribir un rótulo.
 *
 * Sólo en `.tsx`, y descartando lo que traiga `(`, `)`, `=` o `:`: eso es un
 * genérico de TypeScript. Y el `>` no puede venir de una flecha: en `=> Promise<`
 * el `>` es de la flecha. **Es su límite**: un rótulo con dos puntos se le escapa.
 */
const JSX_TEXT = /(?<![=-])>\s*([A-ZÁÉÍÓÚÑ¿¡][^<>{}()=:]*?)\s*</g

for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  if (!DRAWS.some((dir) => shortPath.startsWith(dir))) continue
  if (NOT_INTERFACE.test(shortPath)) continue

  const code = stripComments(readFileSync(file, 'utf8')).replace(DIAGNOSTIC, ' ')

  const loose = [
    ...[...code.matchAll(/'([^']*)'/g)].map((m) => m[1]),
    ...[...code.matchAll(/"([^"]*)"/g)].map((m) => m[1]),
    /* Y las plantillas, que si no son la puerta de atrás: mover un texto al
       catálogo y dejar el resto en una interpolación lo deja igual de suelto.
       Se mira lo escrito ENTRE las interpolaciones. */
    ...[...code.matchAll(/`([^`]*)`/g)].flatMap((m) => m[1].split(/\$\{[^}]*\}/)),
  ].filter((text) => PROSE.test(text))

  if (shortPath.endsWith('.tsx')) {
    for (const m of code.matchAll(JSX_TEXT)) {
      /* Una sola palabra entre etiquetas también es un rótulo: «Guardar» es
         tan interfaz como «Nuevo artículo». Acá no va el filtro de `PROSE`,
         que existe para no marcar identificadores entrecomillados. */
      if (m[1].trim().length > 0) loose.push(m[1].trim())
    }
  }

  for (const text of loose) {
    fail('Un texto de interfaz suelto, fuera del catálogo (CU-43)', shortPath, text)
  }
}

/**
 * **11 · El núcleo no tira un error sin decir de qué clase es.**
 *
 * `throw new Error(texto)` obliga a **leer el mensaje** para distinguir una
 * falla de otra, y un mensaje se reescribe cuando queda poco claro: ahí se
 * rompe en silencio todo lo que dependía de su texto — empezando por las
 * pruebas (`CU-45`).
 *
 * Se mira sólo `packages/`, que es lo que se publica y hereda cada aplicación.
 * Una aplicación tira lo suyo como quiera: sus fallas no las trata nadie más.
 */
for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  if (!shortPath.startsWith('packages/core/src/')) continue
  if (shortPath.endsWith('base/failure.ts')) continue

  const code = stripComments(readFileSync(file, 'utf8'))
  if (code.includes('throw new Error(')) {
    fail('Un error del núcleo sin clase (CU-45)', shortPath, 'throw new Error(')
  }
}
console.log('')
/**
 * **13 · Un campo del sobre del registro que suena a dato de una persona.**
 *
 * `CU-35` garantizaba que no hubiera dónde poner uno. Al dejar que una
 * aplicación extienda el sobre, **la garantía bajó** de «no hay dónde» a «hay un
 * solo lugar, declarado y vigilado». Esto es la parte vigilada.
 *
 * **Y es heurística, que es lo primero que hay que decir.** Ningún sistema de
 * tipos distingue un identificador de un nombre: los dos son un `string`. Lo que
 * esto agarra es el descuido —llamarle `nombre` al campo donde se puso un
 * nombre— y no a quien quiera esconderlo. Sirve porque el descuido es el caso
 * común, y porque la lista se lee.
 *
 * Se mira el manifiesto, que es donde el sobre se declara y **el único lugar**
 * donde puede crecer.
 */
const PERSONAL =
  /^(nombre|name|apellido|email|mail|telefono|phone|direccion|address|documento|dni|cuit|saldo|balance|razonSocial|fullName)$/i

for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const code = stripComments(readFileSync(file, 'utf8'))

  /* El bloque `envelope: { … }` del manifiesto, y sólo ése. */
  const declared = code.match(/envelope:\s*\{([^}]*)\}/)
  if (!declared) continue

  for (const [, field] of declared[1].matchAll(/(\w+)\s*:/g)) {
    if (PERSONAL.test(field)) {
      fail(
        'Un campo del sobre del registro suena a dato de una persona (TAN-6, regla 13)',
        shortPath,
        `"${field}" — el registro lleva identificadores, no datos (CU-35). Si es un identificador, nombralo como tal.`,
      )
    }
  }
}

/**
 * **8b · Los tres nombres de una pantalla coinciden** (`CU-15`).
 *
 * `id: 'article'`, el componente `ArticleScreen`, y el archivo
 * `article-screen.tsx`. Sin esto, buscar por el nombre que uno recuerda no
 * encuentra el archivo — y pasó: `id: 'catalogForm'` vivía adentro de
 * `article-screen.tsx`, con el componente `ArticleScreen` y el título «Ficha
 * del artículo».
 *
 * Se mira la declaración entera, no sólo el `component`, porque **el que se
 * despega es el `id`**: es el único de los tres que no se ve al leer el
 * archivo desde afuera.
 */
for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const code = stripComments(readFileSync(file, 'utf8'))

  for (const match of code.matchAll(
    /id:\s*'([A-Za-z0-9_$]+)',[^}]*?component:\s*([A-Za-z0-9_$]+)/g,
  )) {
    const [, id, component] = match
    if (component === 'ComponentType') continue

    const expected = `${id.charAt(0).toUpperCase()}${id.slice(1)}Screen`
    if (component !== expected) {
      fail(
        'El id y el componente de una pantalla no coinciden (CU-15)',
        shortPath,
        `id: '${id}' con ${component} — se esperaba ${expected}`,
      )
      continue
    }

    /* Y el archivo, que es el tercero. `articleScreen` vive en
       `article-screen.tsx`. */
    const asKebab = id.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    if (!shortPath.endsWith(`/${asKebab}-screen.tsx`)) {
      fail(
        'El archivo de una pantalla no se llama como ella (CU-15)',
        shortPath,
        `id: '${id}' — se esperaba ${asKebab}-screen.tsx`,
      )
    }
  }
}

/**
 * **La puerta trata el rechazo por versión vieja** (`CU-29`).
 *
 * Ésta es la comprobación que faltaba, y la que dejó a `CU-29` declarada y vacía
 * durante meses: la decisión decía «vive en la puerta de las acciones, no en
 * cada formulario» y **ahí no vivía nada**. La puerta trataba el `401`, el `403`
 * y el `409`; el conflicto no lo conocía.
 *
 * Quien la leyó construyó creyendo que estaba protegido, y lo descubrió el
 * agente de la primera aplicación al preguntar cómo se cumplía.
 *
 * Se mira que la puerta **nombre las dos piezas**: el código del contrato sobre
 * el que se ramifica, y el cálculo del choque. Con una sola no alcanza — con el
 * código y sin el cálculo se reconocería el rechazo y no se sabría qué hacer, y
 * al revés no se llegaría nunca.
 *
 * **Y va arriba de la compuerta**, que es donde una falla todavía cambia el
 * código de salida. Estaba abajo: al fallar tiraba el error del guardia en vez
 * de reportar la regla, y con él se perdían el bloque de fallas y los renglones
 * que seguían. El renglón se guarda y se imprime abajo, con los demás.
 */
const GATE = join(ROOT, 'packages', 'core', 'src', 'data', 'use-action.ts')

let laPuerta = '  ok     la puerta trata el rechazo por versión vieja, y sabe qué comparar'

if (!existsSync(GATE)) {
  /* Un clon no tiene `packages/`: la puerta le llega adentro del paquete, ya
     verificada allá. Se dice, en vez de aprobar en silencio. */
  laPuerta = '  --     sin packages/: que la puerta trate el conflicto se verifica en cuarzo'
} else {
  /* En OPE el tipo de problema es un slug y hoy ningún backend lo emite: la
     ruta queda **dormida con su constante**, no borrada. Lo que se verifica es
     que la constante siga nombrando el slug y que el cálculo del choque siga
     ahí: borrar cualquiera de los dos «porque no se usa» es lo que esto impide. */
  const falta = ["const STALE = 'stale-version'", 'clashBetween'].filter(
    (each) => !readFileSync(GATE, 'utf8').includes(each),
  )

  if (falta.length > 0) {
    fail(
      'La puerta no trata el rechazo por versión vieja (CU-29)',
      'packages/core/src/data/use-action.ts',
      `falta ${falta.join(' y ')}`,
    )
  }
}

/**
 * **Una relectura no se hace con `refetch()`** (`CU-29`, `CU-9`).
 *
 * Dos defectos de una vez, y los dos con los puntos de control en verde:
 *
 * - **`refetch()` no rechaza.** Devuelve el error adentro del resultado y deja
 *   los datos viejos en su lugar, así que la puerta creía haber releído,
 *   comparaba el registro contra sí mismo, no encontraba cruce y reintentaba
 *   **con el mismo testigo que el servidor acababa de rechazar**. Un bucle de
 *   escrituras, y la rama de «no se puede comparar» inalcanzable.
 * - **Y le pone el error a la consulta de la pantalla**, que pasa al estado de
 *   falla y desmonta el formulario **con lo tecleado adentro** (`CU-9`).
 *
 * Se relee con una lectura suelta: propaga el error, y no la mira nadie más.
 */
/**
 * **Y la referencia con que se compara se congela al abrir** (`CU-29`).
 *
 * Es el defecto más caro que encontró la revisión de `004`, y el que ninguna
 * prueba veía: la referencia y el testigo salían de la consulta viva, que se
 * mueve sola. Con ellos corridos, guardar después del diálogo de conflicto **le
 * borra el cambio al otro con un testigo válido, sin rechazo y sin diálogo**.
 *
 * Se mira **la variable que `loaded:` nombra**, y que esa misma variable salga
 * de `useLoadedOnce`. Que el archivo mencione el nombre en algún lado no alcanza:
 * con eso, sacar la llamada y dejar el `import` aprueba igual — y lo dijo la
 * mutación, no el razonamiento.
 */
let comparan = 0

for (const file of checked) {
  const shortPath = relative(ROOT, file).split(sep).join('/')
  const code = stripComments(readFileSync(file, 'utf8'))

  if (/reread\s*:[\s\S]{0,600}?refetch\s*\(/.test(code)) {
    fail(
      'Una relectura de conflicto usa refetch() (CU-29, CU-9)',
      shortPath,
      'refetch() no rechaza y le pone el error a la consulta de la pantalla: releé con una lectura suelta',
    )
  }

  if (!/concurrency:\s*\{/.test(code)) continue
  comparan += 1

  const declarado = code.match(/loaded:\s*([A-Za-z_$][\w$]*)/)
  const raiz = declarado?.[1]

  if (!raiz || !new RegExp(`\\b${raiz}\\s*=\\s*useLoadedOnce\\s*\\(`).test(code)) {
    fail(
      'Una pantalla compara contra una referencia que se mueve (CU-29)',
      shortPath,
      `${raiz ? `"${raiz}" no sale de useLoadedOnce` : 'loaded: no nombra una variable'} — leída de la consulta viva, guardar después del conflicto pisa al otro sin avisar`,
    )
  }
}

/**
 * **El contrato del ejemplo cumple `TAN-9`.**
 *
 * La regla —qué puede viajar en `fields`— es de plataforma y está escrita una
 * sola vez, allá. Acá se comprueba sobre el molde que copian las cuatro
 * aplicaciones: todo `field:` que el simulado emite tiene que ser una propiedad
 * declarada en algún esquema del contrato.
 *
 * Es la mitad estática de `CU-49`. La otra es el respaldo de `useForm`, que
 * atrapa en tiempo de ejecución lo que ningún contrato nuestro puede impedir.
 */
/** El contrato del ejemplo vive con la aplicación que lo consume: `apps/<x>/contracts/`. */
const CONTRACTS = apps
  .map((app) => join(ROOT, ...app.split('/'), 'contracts'))
  .filter((dir) => existsSync(dir))
const MOCK = join(ROOT, 'tests', 'mock.mjs')

let losCampos = '  --     sin simulado ni contrato: qué puede ir en fields se verifica donde estén'

if (existsSync(MOCK) && CONTRACTS.length > 0) {
  const yaml = CONTRACTS.flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => /\.ya?ml$/.test(name))
      .map((name) => readFileSync(join(dir, name), 'utf8')),
  ).join('\n')

  /* Las propiedades de los esquemas, por sangría: lo que cuelga de un
     `properties:` un nivel más adentro, hasta que la sangría vuelve. */
  const propiedades = new Set()
  let dentro = -1

  for (const linea of yaml.split('\n')) {
    const sangria = linea.search(/\S/)
    if (sangria === -1) continue

    if (dentro >= 0 && sangria <= dentro) dentro = -1
    if (/^\s*properties:\s*$/.test(linea)) {
      dentro = sangria
      continue
    }

    const clave = linea.match(/^\s*([A-Za-z][\w]*):/)
    if (dentro >= 0 && clave && sangria === dentro + 2) propiedades.add(clave[1])
  }

  const ajenos = [...readFileSync(MOCK, 'utf8').matchAll(/field:\s*'([^']+)'/g)]
    .map((each) => each[1])
    .filter((name) => !propiedades.has(name))

  if (propiedades.size === 0) {
    fail(
      'No se pudo leer ninguna propiedad del contrato (TAN-9)',
      'contracts/',
      'sin propiedades que comparar, esta comprobación aprobaría cualquier cosa',
    )
  } else if (ajenos.length > 0) {
    fail(
      'El simulado manda en fields algo que no es un campo del cuerpo (TAN-9)',
      'tests/mock.mjs',
      `"${[...new Set(ajenos)].join('", "')}" — el formulario busca un control con ese nombre, no lo encuentra, y el rechazo desaparece: dale código propio y sacalo de fields`,
    )
  }

  losCampos = `  ok     ${propiedades.size} propiedades del contrato, y el simulado no manda en fields nada que no sea una`
}

const laComparacion =
  comparan === 0
    ? '  --     ninguna pantalla declara una comparación: no hay referencia que congelar'
    : `  ok     ${comparan} pantallas comparan, y congelan contra qué`

for (const d of degradaciones) {
  fail(
    'Se va sin decir nada cuando no encuentra qué revisar (TAN-6, regla 4)',
    d,
    'imprimí un renglón `--` diciendo qué no se revisó, o escribí `sin sujeto:` si no deja nada sin revisar',
  )
}

/* Desde acá el código de salida ya está decidido, y el guardia de `fail` lo
   vuelve explícito en vez de dejarlo librado a que nadie agregue nada abajo. */
closeGate()

if (failures.length > 0) {
  for (const f of failures) {
    console.log(`  FALLA  ${f.rule}`)
    console.log(`         ${f.where}  —  ${f.detail}`)
  }
  console.log('')
  console.log('EL ESTÁNDAR DE TAN-6 NO SE CUMPLE')
  console.log('')
  process.exit(1)
}

console.log(`  ok     ${checked.length} archivos, sin estado mutable de módulo fuera de la raíz`)
console.log('  ok     nada con ciclo de vida se construye en un render')
console.log('  ok     ninguna conversión afirma un tipo compuesto')
console.log('  ok     ningún comentario repite el texto de una decisión')
console.log('  ok     ningún comentario narra historia: el código que está, no el que estuvo')
console.log(laPuerta)
console.log('  ok     ninguna relectura de conflicto usa refetch()')
console.log(laComparacion)
console.log(losCampos)
console.log('  ok     sólo la raíz de composición nombra implementaciones concretas')
console.log('  ok     toda pantalla registrada se llama …Screen')
console.log('  ok     el id, el componente y el archivo de cada pantalla coinciden')
console.log('  ok     ninguna preferencia cableada por nombre fuera de su archivo')
console.log('  ok     ningún texto de interfaz suelto: todos salen del catálogo')
console.log('  ok     ningún error del núcleo sin clase')
console.log('  ok     ningún campo del sobre del registro suena a dato de una persona')
if (generated.length > 0) {
  console.log(`  --     ${generated.length} generados, sin revisar: se regeneran, no se corrigen`)
}
console.log('')
console.log('LO MECANIZABLE DE TAN-6 SE CUMPLE')
console.log('')
