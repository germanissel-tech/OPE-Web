/**
 * **El simulado del hola mundo**, que entiende la consulta.
 *
 * Prism sirve el contrato tal cual —y valida que el pedido lo cumpla—, pero en
 * modo estático **responde el ejemplo mire lo que mire**: con `?search=zzz`
 * devuelve los mismos artículos. Con eso el ejemplo del esqueleto no puede
 * mostrar ni el filtro ni los dos vacíos, que son justo lo que `CU-24` existe
 * para probar.
 *
 * Esto es lo mínimo que hace falta para que el ejemplo demuestre:
 *
 * - **Los datos salen del contrato**, no de acá. Se lee el ejemplo de
 *   `contracts/demo.yaml`, así que no hay una segunda lista que se desincronice.
 * - **Filtra, pagina y arma el sobre** como el contrato dice, con su
 *   `requestId` y su `X-Request-Id`.
 * - **No valida el pedido.** Eso lo sigue haciendo Prism, en
 *   `npm run simulado:contrato`.
 *
 * Se borra al clonar, junto con el contrato y `src/features/`.
 */

import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * **La raíz se calcula acá, y no se importa de `packages/`.**
 *
 * Importaba `ROOT` de las comprobaciones del paquete —que es `process.cwd()` y
 * nada más—, y esa línea **dejaba al clon sin backend**: este archivo se copia,
 * `packages/` se borra en el paso 2 del ritual, y `npm run simulado` moría con
 * `ERR_MODULE_NOT_FOUND`. Lo encontró correr el quickstart a mano.
 *
 * Salía del propio archivo, además, que es más correcto: el contrato está al
 * lado de este script, no en el directorio desde donde alguien lo llamó.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * **El puerto se puede mover, y por una razón concreta.**
 *
 * Clavado, dos simulados no conviven — y con uno viejo escuchando, lo que
 * responde no es lo que se está probando. Ya pasó en este repositorio: una
 * prueba de idempotencia dio verde contra un simulado de otra sesión, y no
 * probaba nada.
 *
 * Por omisión sigue siendo el 4010, que es lo que dice `config.json`.
 */
const PORT = Number(process.env.PORT ?? 4010)
const CONTRACT = join(ROOT, 'contracts', 'demo.yaml')

/**
 * Los artículos del ejemplo del contrato.
 *
 * Se leen con una expresión y no con un analizador de YAML **a propósito**: es
 * un simulado de ejemplo y no vale sumarle una dependencia. Si el ejemplo
 * cambia de forma, esto falla al arrancar y se ve enseguida.
 */
function articlesFromContract() {
  const yaml = readFileSync(CONTRACT, 'utf8')
  const items = [
    ...yaml.matchAll(/- id: (\d+)\n\s+name: (.+)\n\s+price: '(.+)'\n\s+active: (true|false)/g),
  ]

  if (items.length === 0) {
    throw new Error(`No encontré artículos de ejemplo en ${CONTRACT}. ¿Cambió su forma?`)
  }

  return items.map(([, id, name, price, active]) => ({
    id: Number(id),
    name: name.trim(),
    price,
    active: active === 'true',
  }))
}

/* Se copia porque el alta lo modifica: el simulado tiene que poder mostrar que
   lo creado aparece en la grilla sin recargar la página. */
const ARTICLES = articlesFromContract()
const REQUEST_ID = '01JBQ2X8N4K3M7P9R2T5V8W1Y'

/**
 * **La versión de cada artículo** (`CU-29`).
 *
 * Un número que sube con cada escritura, servido como `ETag`. Arranca en 1 y no
 * se persiste: el simulado se reinicia y todo vuelve a la versión inicial, que
 * es lo que corresponde a un simulado.
 *
 * **Que exista acá y no en el artículo** es a propósito: el testigo no es un
 * campo del recurso —no viaja en el cuerpo, no se muestra, no se edita—, es
 * cómo el servidor identifica en qué estado estaba. Ponerlo adentro invitaría a
 * mandarlo en el `PUT`, que es justo lo que el encabezado existe para evitar.
 */
const VERSIONS = new Map()
const versionOf = (id) => VERSIONS.get(id) ?? 1
const etagOf = (id) => `"${versionOf(id)}"`
const bumpVersion = (id) => VERSIONS.set(id, versionOf(id) + 1)

/* `extra` para los encabezados que dependen de la respuesta —hoy el `ETag`—,
   que los fijos no pueden expresar. */
const send = (response, status, body, extra = {}) => {
  response.writeHead(status, {
    'content-type': 'application/json',
    'x-request-id': REQUEST_ID,
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    /* **Los métodos hay que declararlos.** `GET` y `POST` son «simples» y el
       navegador los deja pasar sin preguntar; `PUT` no, así que sin esto el
       preflight lo rechaza y la pantalla ve «no se pudo llegar al servidor».
       Lo encontró el punto de control: con `curl` andaba, porque `curl` no hace
       preflight. */
    'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
    'access-control-expose-headers': 'x-request-id, etag',
    ...extra,
  })
  response.end(JSON.stringify(body))
}

const fail = (response, status, code, message) =>
  send(response, status, { error: { code, message, requestId: REQUEST_ID } })

/**
 * Los intentos ya atendidos, por clave de idempotencia (`CU-34`).
 *
 * **Guarda el cuerpo además de la respuesta**, porque las dos cosas que el
 * contrato pide dependen de compararlo: misma clave y mismo cuerpo devuelve lo
 * de la primera vez; misma clave y otro cuerpo es `409`.
 *
 * En memoria y sin vencimiento: es el simulado del ejemplo, y se reinicia con
 * él.
 */
const ATTEMPTS = new Map()

/** Dos decimales, como el `pattern` que el contrato declara para los precios. */
const DECIMAL = /^[0-9]+[.][0-9]{2}$/

/**
 * **La forma de un artículo, campo por campo** (`CU-5`).
 *
 * La usan el alta **y la edición**, y que esté en un solo lugar no es prolijidad.
 * Escrita dos veces, alcanza con que una de las dos se quede corta para que
 * editar un campo que esa mitad no mira conteste «se guardó», suba la versión y
 * no cambie nada.
 *
 * Devuelve los valores ya normalizados junto con lo que está mal, para que quien
 * la llama no vuelva a leer el cuerpo por su cuenta.
 */
function articleFrom(parsed) {
  const name = typeof parsed.name === 'string' ? parsed.name.trim() : ''
  const price = typeof parsed.price === 'string' ? parsed.price.trim() : ''
  const discounted = typeof parsed.discountedPrice === 'string' ? parsed.discountedPrice.trim() : ''
  const stock = parsed.stock

  /* **Van todos juntos**: contestar de a uno obliga al operador a mandar tres
     veces para enterarse de las tres. */
  const wrong = []
  if (!name) wrong.push({ field: 'name', code: 'REQUIRED', message: 'El nombre es obligatorio.' })
  if (name.length > 100) {
    wrong.push({ field: 'name', code: 'TOO_LONG', message: 'No puede pasar de 100 caracteres.' })
  }
  if (!DECIMAL.test(price)) {
    wrong.push({ field: 'price', code: 'BAD_FORMAT', message: 'Va con dos decimales.' })
  }
  if (discounted !== '' && !DECIMAL.test(discounted)) {
    wrong.push({ field: 'discountedPrice', code: 'BAD_FORMAT', message: 'Va con dos decimales.' })
  }
  /* El rango, que el contrato declara igual que el patrón. */
  if (stock !== undefined && (!Number.isInteger(stock) || stock < 0 || stock > 99999)) {
    wrong.push({ field: 'stock', code: 'OUT_OF_RANGE', message: 'Va entre 0 y 99999.' })
  }

  return { name, price, discounted, stock, wrong }
}

const invalid = (response, fields) =>
  send(response, 422, {
    error: {
      code: 'VALIDATION_FAILED',
      message: 'Hay campos con problemas.',
      requestId: REQUEST_ID,
      fields,
    },
  })

/**
 * La invariante de schema. **El servidor la evalúa igual**, aunque el panel la
 * haya adelantado: la validación local no reemplaza a ésta.
 */
const discountAbovePrice = (price, discounted) =>
  discounted !== '' && Number(discounted) > Number(price)

const rejectDiscount = (response) =>
  send(response, 422, {
    error: {
      code: 'DISCOUNT_ABOVE_PRICE',
      message: 'El precio con descuento no puede superar al de lista.',
      requestId: REQUEST_ID,
      fields: [
        {
          field: 'discountedPrice',
          code: 'DISCOUNT_ABOVE_PRICE',
          message: 'No puede superar al precio de lista.',
        },
      ],
    },
  })

/** El nombre es único, también al editar — salvo consigo mismo. */
const nameTaken = (name, exceptId) =>
  ARTICLES.some((each) => each.id !== exceptId && each.name.toLowerCase() === name.toLowerCase())

const server = createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    send(response, 204, null)
    return
  }

  const url = new URL(request.url, `http://localhost:${PORT}`)

  const detail = url.pathname.match(/^\/articles\/(\d+)$/)
  if (detail && request.method === 'GET') {
    const article = ARTICLES.find((each) => each.id === Number(detail[1]))
    if (!article) {
      fail(response, 404, 'NOT_FOUND', 'No se encontró el artículo.')
      return
    }
    /* **El testigo sale de acá y de ningún otro lado**: editar exige haber
       leído, y ésta es la lectura. Por eso la edición no puede ser un diálogo
       que se abre sin haber pedido nada (`GR-42`). */
    send(
      response,
      200,
      { data: article, meta: { requestId: REQUEST_ID } },
      { etag: etagOf(article.id) },
    )
    return
  }

  if (url.pathname === '/articles' && request.method === 'GET') {
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
    const page = Number(url.searchParams.get('page') ?? 1)
    const size = Number(url.searchParams.get('size') ?? 20)

    /* Parcial e insensible a mayúsculas, que es lo que el contrato promete. */
    const matched = search
      ? ARTICLES.filter((each) => each.name.toLowerCase().includes(search))
      : ARTICLES

    const from = (page - 1) * size
    send(response, 200, {
      data: matched.slice(from, from + size),
      meta: {
        requestId: REQUEST_ID,
        page,
        size,
        totalItems: matched.length,
        totalPages: Math.max(1, Math.ceil(matched.length / size)),
      },
    })
    return
  }

  /**
   * **La edición, que es donde el testigo sirve para algo** (`CU-29`).
   *
   * Tres respuestas y las tres importan: sin `If-Match` es `422` —nunca se
   * aplica un cambio a ciegas—, con uno viejo es `412` **sin aplicar nada**, y
   * con el correcto se guarda y **la versión sube**, que es lo que hace que el
   * segundo intento del otro operador choque.
   */
  if (detail && request.method === 'PUT') {
    const id = Number(detail[1])
    const article = ARTICLES.find((each) => each.id === id)
    if (!article) {
      fail(response, 404, 'NOT_FOUND', 'No se encontró el artículo.')
      return
    }

    const sent = request.headers['if-match']
    if (!sent) {
      /* **Código propio y sin campos** (`TAN-9`). Un encabezado que falta es un
         defecto de quien llama, no algo que el operador pueda corregir: puesto
         en `fields`, el formulario busca un control que no existe y el rechazo
         no se ve en ningún lado. Y `428` es el código que HTTP tiene para esto
         —«el pedido tiene que ser condicional»—, así que no se confunde con un
         formulario mal llenado. */
      fail(
        response,
        428,
        'PRECONDITION_REQUIRED',
        'Esta operación exige el testigo de la versión (If-Match).',
      )
      return
    }

    if (sent !== etagOf(id)) {
      /* **Con el testigo actual en la respuesta**: el cliente lo necesita para
         poder reintentar sin volver a leer, que es lo que permite que el caso
         sin cruce se guarde sin molestar a nadie. */
      send(
        response,
        412,
        {
          error: {
            code: 'STALE_VERSION',
            message: 'El registro cambió mientras lo editabas. Volvé a abrirlo.',
            requestId: REQUEST_ID,
          },
        },
        { etag: etagOf(id) },
      )
      return
    }

    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      let parsed
      try {
        parsed = JSON.parse(body || '{}')
      } catch {
        fail(response, 422, 'VALIDATION_FAILED', 'El cuerpo no es JSON.')
        return
      }

      const { name, price, discounted, stock, wrong } = articleFrom(parsed)
      if (wrong.length > 0) {
        invalid(response, wrong)
        return
      }
      if (discountAbovePrice(price, discounted)) {
        rejectDiscount(response)
        return
      }
      if (nameTaken(name, id)) {
        fail(response, 409, 'CATALOG_ENTRY_DUPLICATE', 'Ya existe un artículo con ese nombre.')
        return
      }

      /* **Los cuatro campos, no los dos llamativos.** Aplicar dos y subir la
         versión igual es lo peor de los dos mundos: la pantalla dice «El artículo
         se guardó», el testigo cambia, y el registro queda como estaba. */
      article.name = name
      article.price = price
      if (discounted === '') delete article.discountedPrice
      else article.discountedPrice = discounted
      if (stock === undefined) delete article.stock
      else article.stock = stock
      if (typeof parsed.active === 'boolean') article.active = parsed.active

      bumpVersion(id)
      send(response, 200, { data: article, meta: { requestId: REQUEST_ID } }, { etag: etagOf(id) })
    })
    return
  }

  if (url.pathname === '/articles' && request.method === 'POST') {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      let parsed
      try {
        parsed = JSON.parse(body || '{}')
      } catch {
        fail(response, 422, 'VALIDATION_FAILED', 'El cuerpo no es JSON.')
        return
      }

      /* El contrato la declara requerida, así que su ausencia es un defecto de
         quien llama y no un error del operador. */
      const key = request.headers['idempotency-key']
      if (!key) {
        fail(response, 422, 'VALIDATION_FAILED', 'Falta la cabecera Idempotency-Key.')
        return
      }

      const before = ATTEMPTS.get(key)
      if (before) {
        if (before.body !== body) {
          fail(response, 409, 'IDEMPOTENCY_KEY_REUSE', 'Esa clave ya se usó con otro cuerpo.')
          return
        }
        /* El mismo intento otra vez: **se devuelve lo de antes y no se crea
           nada**. Es exactamente lo que la clave existe para lograr. */
        send(response, 201, before.result)
        return
      }

      const { name, price, discounted, stock, wrong } = articleFrom(parsed)
      if (wrong.length > 0) {
        invalid(response, wrong)
        return
      }
      if (discountAbovePrice(price, discounted)) {
        rejectDiscount(response)
        return
      }
      if (nameTaken(name, undefined)) {
        fail(response, 409, 'CATALOG_ENTRY_DUPLICATE', 'Ya existe un artículo con ese nombre.')
        return
      }

      const created = {
        id: Math.max(0, ...ARTICLES.map((each) => each.id)) + 1,
        name,
        price,
        ...(discounted === '' ? {} : { discountedPrice: discounted }),
        ...(stock === undefined ? {} : { stock }),
        active: parsed.active !== false,
      }
      ARTICLES.push(created)

      const result = { data: created, meta: { requestId: REQUEST_ID } }
      ATTEMPTS.set(key, { body, result })
      send(response, 201, result)
    })
    return
  }

  /* Las dos caras del mismo interruptor. Comparten forma porque comparten
     regla: se contesta y no se aplica cuando ya está como se pide. */
  const switching = url.pathname.match(/^[/]articles[/]([0-9]+)[/](de)?activation$/)
  if (switching && request.method === 'POST') {
    const article = ARTICLES.find((each) => each.id === Number(switching[1]))
    const wanted = switching[2] === undefined

    if (!article) {
      fail(response, 404, 'NOT_FOUND', 'No hay un artículo con ese identificador.')
      return
    }

    if (article.active === wanted) {
      fail(
        response,
        409,
        wanted ? 'ARTICLE_ALREADY_ACTIVE' : 'ARTICLE_ALREADY_INACTIVE',
        wanted ? 'Ya está en circulación.' : 'Ya está fuera de circulación.',
      )
      return
    }

    article.active = wanted
    /* **También sube la versión.** Sin esto el testigo no cubre todas las
       escrituras: una edición con el testigo previo a la desactivación pasa el
       control y se aplica, y el rechazo no llega nunca para el único campo que la
       pantalla manda sin poder editar. */
    bumpVersion(article.id)
    send(
      response,
      200,
      { data: article, meta: { requestId: REQUEST_ID } },
      { etag: etagOf(article.id) },
    )
    return
  }

  fail(response, 404, 'NOT_FOUND', 'Esa ruta no está en el contrato del ejemplo.')
})

server.listen(PORT, () => {
  console.log('')
  console.log(`  El simulado del ejemplo, en http://localhost:${PORT}`)
  console.log(`  ${ARTICLES.length} artículos, leídos de contracts/demo.yaml`)
  console.log(
    '  Filtra, pagina y arma el sobre. NO valida el pedido — eso es `npm run simulado:contrato`.',
  )
  console.log('')
})
