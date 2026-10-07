# Fase 1 · Cómo se levanta y cómo se comprueba

**Todo esto corre sin VPN.** Pero hay **dos modos**, y confundirlos deja sin ejercer justo la parte
más riesgosa.

## Modo rápido · contra la implementación falsa

```bash
npm install
npm run dev          # la aplicación base, con la sesión falsa
```

Y en otra terminal, si hace falta pedir datos:

```bash
# desde ../las-animas/backend
npm run spec:mock    # Prism en :4010, servido del contrato
```

Una aplicación entera andando: entra, dibuja el marco, pide datos al simulado y muestra los cuatro
estados. Es el modo para trabajar en **pantallas**.

**Lo que este modo NO ejercita**: nada de OIDC. Ni redirección, ni PKCE, ni iframe, ni ventana
emergente — `oidc-client-ts` ni se ejecuta. Ejercita **nuestra máquina de estados**, no el
protocolo.

## Modo completo · contra el proveedor local

```bash
npm run dev:oidc     # apunta al Keycloak local de la plataforma
```

**El contenedor y su realm no son de cuarzo**: son de la plataforma —`TAN-2`— porque el mismo realm
lo tienen que usar los backends para validar. Si cada repositorio tuviera el suyo, divergen y el
síntoma es que el frontend entra y la API lo rechaza.

Es el modo para trabajar en **la sesión**. Más lento de levantar, y el único que ejercita el
cableado del protocolo, que es donde uno se equivoca.

## Lo que hay que ver que pasa

Cada uno se puede forzar desde la falsa. Los seis primeros son el camino de falla, que es **el que
casi nunca se ejerce solo** y por eso es el que se pudre.

| se fuerza | tiene que pasar |
|---|---|
| Arrancar sin sesión | Va al proveedor y **vuelve a la pantalla que se pedía**, no a la de inicio |
| Recargar | Se rehace la comprobación. Por debajo del umbral, **no se ve nada** |
| El token por vencer | Se renueva solo. Ningún pedido en curso falla y el operador no se entera |
| La renovación falla | Aparece el diálogo con su botón. **Lo cargado sigue en pantalla** |
| Vuelve el mismo sujeto | Se cierra el bloqueo y se sigue **donde se estaba** |
| **Vuelve otro sujeto** | **No se continúa.** Se recarga |
| Se cierra la ventana sin entrar | Vuelve el aviso con su botón. **No se queda esperando** |
| Pasan dos minutos | Se descarta **primero**, después se avisa, y se recarga |
| El navegador bloquea la ventana | Se cae a redirección, avisando, y se pierde lo cargado |
| Un reingreso llega tarde | **No revive nada** |
| Claims sin ninguna capacidad | Pantalla de «no tenés acceso». **No redirige** — si redirige, es un bucle |
| Se cierra sesión | Termina, y hay que volver a entrar |
| `401` en una lectura | Se renueva y **la lectura se repite sola** |
| `401` en una escritura | Se renueva y **la escritura NO se repite**. Vuelve el botón |

## Las cuatro pruebas que sostienen la especificación

```bash
npm test
```

**1 · Que nada afuera nombre al proveedor.** Recorre todo menos `packages/session/src/proveedor/` y
falla si aparece un `import`, una URL, la forma de un claim o la palabra en un comentario.

**2 · Que la sesión corra contra la falsa.** La misma batería, con las dos implementaciones. Es la
que importa: **una interfaz no demuestra nada si nunca se ejerce contra otra cosa** — la lección de
granito, donde mover un valor a la configuración no probaba nada hasta que alguien verificó que
cambiarlo cambiaba la salida.

**3 · Que el camino de falla se ejerza.** Los seis casos de arriba, forzados.

**4 · Que corra contra el proveedor local.** Es **distinta de la 2**: la falsa demuestra que la
costura existe; ésta demuestra que **el protocolo está bien cableado**. Sin ella, las tres primeras
pueden estar todas en verde con `oidc-client-ts` mal configurado.

## Lo que sigue mirando una persona

Que por debajo del umbral **no aparezca ningún indicador** — ninguna prueba automática juzga bien un
parpadeo. Y los textos del diálogo y de la pantalla de «no tenés acceso».

## Lo que este quickstart NO comprueba

**Nada contra el proveedor de producción.** El local (`TAN-2`) permite **experimentar** con los dos
supuestos que esperan a la VPN —que el proveedor se porte bien en una ventana emergente, y el plazo
de un ingreso en curso— pero su realm puede estar configurado distinto del de verdad. Convierte «no
sabemos» en «anda, falta confirmar allá», que no es lo mismo que saberlo. Las dos están anotadas en
`estado.md`, con las demás que esperan a la VPN.

Vale decirlo derecho: esto comprueba que el módulo hace lo que la especificación dice, **no** que el
proveedor haga lo que suponemos.
