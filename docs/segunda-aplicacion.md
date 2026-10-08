# Cómo nace la segunda aplicación

`apps/portal` —el portal del merchant— nace **copiando `apps/console` dentro del mismo
repositorio**, no clonando entre repositorios (`OW-1`). Lo que las dos comparten ya está en
`packages/` y les llega por workspace; lo que se copia es lo que legítimamente diverge: las
pantallas, los servicios, la configuración y la compilación (principio V).

## Qué se copia

```
apps/console/                    →  apps/portal/
├── index.html                       título y lang
├── package.json                     name: @ope/portal
├── tsconfig.json                    igual
├── vite.config.ts                   puerto y reenvío propios
├── public/config.json               systems y umbral propios
└── src/
    ├── app/                         la raíz de composición: se copia y se adapta
    ├── api/ope/                     el servicio contra OPE: se copia, y cambia de consumidor
    ├── features/home/               el hola mundo: se copia o se borra
    ├── features/merchants/          NO se copia: es de la consola
    ├── components/ · lib/           vacías, con su README
    └── testing/                     igual
```

## Qué se renombra

| dónde | de | a |
|---|---|---|
| `package.json` | `@ope/console` | `@ope/portal` |
| `index.html` | `OPE-Console` | `OPE-Portal` |
| `src/app/manifest.ts` | `name: 'OPE-Console'` | `name: 'OPE-Portal'` |
| `src/app/chrome.ts` | `currentMerchant` | lo que el portal tenga en la cabeza; un merchant que entra ya está en su merchant |
| `vite.config.ts` | `server.port: 5173` | otro puerto, para correr las dos a la vez |

## Qué adaptador de sesión elige

**Lo elige el portal en su `main.tsx`**, y la puerta no se entera (principio VI, `OW-2`). El portal
no entra con la credencial opaca de un operador: entra como merchant, y con qué mecanismo lo dice
su contrato cuando exista. Si es OIDC, el adaptador recibe `issuer` y `clientId` tipados como suyos
y `@ope/session/keycloak` vuelve a tener entrada en `package.json`; si es otra credencial escrita,
el bearer sirve con otro `identify`. La vista de ingreso del núcleo se dibuja sola cuando el
adaptador tiene `signIn`.

## Qué cambia en el servicio

`src/api/ope/` se copia, y cambia **el consumidor**: el portal pide su propio módulo de capacidades
—`CONSUMER: 'portal'`, en `contracts/ope/capabilities.portal.*`— cuando `contract-sync` lo emita, y
`opeOperation` se tipa contra ese módulo. Las operaciones `admin` no le compilan, que es el punto.

## Qué entra en la raíz

```json
"ope": { "apps": ["apps/console", "apps/portal"] }
```

Sin ese renglón, **ninguna comprobación revisa la aplicación nueva**, y `context.mjs` falla al
encontrar una carpeta bajo `apps/` que nadie declaró. `compositionLayer` gana los dos archivos de
composición del portal (`main.tsx`, `dev-session.ts`).

Y `vitest.config.ts` ya recorre `apps/*`: las pruebas del portal corren con `npm test` sin tocar
nada.

## Lo que no se copia nunca

- **`features/merchants/`**: es de la consola. Las dos aplicaciones no comparten pantallas; comparten
  `packages/`.
- **`contracts/ope/`**: es del repositorio, no de una aplicación. Las dos lo leen desde `api/`.
- **La sesión de desarrollo con sus papeles**: el portal escribe la suya, con los claims que su
  adaptador va a traer.
