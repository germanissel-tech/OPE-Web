# Cómo se levanta, y cómo se clona · El esqueleto

## Antes de empezar

Nada de red interna, VPN ni credenciales. **Es requisito, no comodidad** (`CU-17`, `TAN-2`).

| | qué es |
|---|---|
| Node y npm | Lo de siempre |
| **Prism** en `:4010` | El simulado, sirviendo **el contrato de verdad** de `las-animas/backend` |
| `config.json` | El de desarrollo. Si falta un valor, **no arranca y dice cuál** |

La sesión usa **la implementación falsa**, que por `CU-17` es el modo de desarrollo. El proveedor de
identidad local de `TAN-2` entra en un segundo tramo, y no hace falta para nada de esto.

## Levantar

```bash
npm install
npm run dev
```

**Qué tiene que pasar**: arranca, resuelve la sesión contra la falsa, y dibuja el marco — marca,
navegación filtrada por capacidad, y la barra de usuario con su nombre y su salida.

## Las dos pantallas de ejemplo

Están para **ejercitar el esqueleto de punta a punta**, y **viajan en el clon** como ejemplo del que
se copia la primera pantalla propia.

| se prueba | cómo |
|---|---|
| Los cuatro estados | La grilla, contra un catálogo del simulado |
| Los dos vacíos | Sin registros, y con un filtro que no da resultados. **Dicen cosas distintas** |
| El error con su identificador | Bajando Prism. El filtro y las acciones **siguen usables** |
| Navegación tipada | De la grilla al formulario. Cambiar el parámetro en el código **no compila** |
| La puerta de acciones | Un alta: aviso flotante, y **la grilla se refresca sola** |
| Los errores de campo | Un alta que el simulado rechaza: van **a los campos**, no a un cartel |
| Que el marco sobreviva | Una pantalla que revienta se reemplaza sola |

## Las comprobaciones

```bash
npm test
```

| | qué verifica |
|---|---|
| `decisiones.mjs` | El índice y que **toda cita resuelva**. Ya existe |
| `limites.mjs` | **La dirección de las importaciones** (`CU-15`). Si una pantalla importa de `api/`, falla |
| `artefacto.mjs` | Que **la falsa no esté en `dist/`** (`CU-36`) |
| `clon.mjs` | **Que el clon arranque.** Es la que verifica la promesa |

## El ritual de clonar

**Ya no se hace a mano.** Los pasos 1 a 3 los ejecuta el mismo código que los prueba:

```bash
npm run nueva-aplicacion -- --en ../las-animas/admin
```

Sale de `tests/clone.mjs`, que los hacía contra un taller temporal para verificarlos. **Son el mismo
camino a propósito**: una herramienta que cree aplicaciones por un lado y una prueba que verifique el
ritual por otro se despegan el día que alguien toca una sola — y el síntoma aparece en el
repositorio de otro.

El nombre sale de la ruta, con la regla de `00-proyectos.md`: `tandilia/las-animas/admin` da
`las-animas-admin`.

Lo que el comando **no** hace, porque no puede: `git init` y el repositorio remoto —la API de
Bitbucket da `401`, se crea por el navegador—, apuntar `config.json`, y el paso 6.

**Los pasos, que es lo que la herramienta ejecuta y la prueba verifica:**

1. Copiar el repositorio, con otro nombre.
2. **Borrar lo que es de cuarzo y no de la aplicación nueva**: `packages/`, `specs/` y `docs/`, y
   dejar `.specify/feature.json` sin apuntar a nada.

   > Sigue siendo **un paso** —sacar lo que no es tuyo—, y por eso no dispara la cláusula de
   > `CU-21`. Las tres cosas se van por la misma razón: `docs/` son **las decisiones de cuarzo**, y
   > al clon le llegan **adentro del paquete**, no como documentos propios. Si viajaran, la
   > aplicación nueva reclamaría las `CU-n` como suyas y `decisiones.mjs` las leería así.
3. Sacar la sección de espacios de trabajo del `package.json`, y agregar `@cuarzo/core` y
   `@cuarzo/session` como dependencias.
4. Apuntar `config.json` al backend de la aplicación nueva.
5. `npm install` y `npm run dev`.

**Qué tiene que pasar**: arranca, y **las dos pantallas de ejemplo funcionan**, resolviendo los dos
paquetes desde el registro en vez de la carpeta de al lado.

**Las dos pantallas de ejemplo no se borran acá.** Son el *hola mundo*: hacen que el clon arranque
mostrando algo que anda, y que la primera pantalla propia se copie de un ejemplo en vez de
escribirse de cero.

**Se borran en el paso 6**, cuando la aplicación ya tiene las suyas:

6. Borrar `src/features/home/` y `src/features/catalog/`, y sacarlas del `manifest.ts`.

Ese paso **es del ritual y no un olvido**, y por eso está numerado: un clon que las deje puestas
tiene dos pantallas de mentira en su menú, y uno que las borre el primer día se queda sin ejemplo
justo cuando más sirve.

**`tests/clone.mjs` hace exactamente estos cinco pasos**, con `npm pack` en lugar del registro. Si
el ritual cambia y la prueba no, la prueba falla — que es la idea.
