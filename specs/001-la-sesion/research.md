# Fase 0 · Lo que hubo que averiguar

Las cuatro incógnitas que el plan no podía contestar leyendo las decisiones. Cada una con lo que se
eligió, por qué, y qué se descartó.

## 1 · Con qué se habla OIDC

**Elegido**: `oidc-client-ts`.

**Por qué**: cubre punto por punto lo decidido. PKCE de fábrica. `automaticSilentRenew`, que renueva
a partir del evento `accessTokenExpiring` **un minuto antes** de que el token venza — que es CU-8
sin escribir nada. `signinPopup` para el reingreso sin descargar la página, que es CU-9.
`signinSilent` para la comprobación que también detecta la salida ajena de CU-12.

**Descartado `keycloak-js`**: es del proveedor. CU-10 existe para que el proveedor se pueda cambiar,
y su cliente ataría el módulo justo donde no queremos — aunque quedara adentro.

**Descartado escribirlo a mano**: `state`, `nonce`, el verificador de PKCE y la validación del token
son cuatro cosas que hay que acertar, y equivocarse en cualquiera es un agujero silencioso.

**Descartado `react-oidc-context`**: es el envoltorio de React de los mismos autores, y nuestra
puerta ya es la superficie de React. Envolver un envoltorio agrega una capa que después hay que
explicar.

## 2 · Cómo se sabe que volvió otra persona

**Elegido**: comparar el **sujeto** del token —el claim `sub`— antes y después del reingreso.

**Por qué**: es el único identificador que el proveedor garantiza estable e irrepetible dentro del
realm. El nombre de usuario y el correo pueden cambiar.

**Qué pasa si cambió**: no se continúa. Es una sesión nueva y la pantalla se recarga, porque lo que
está cargado lo tecleó otra persona (spec, escenario 7).

## 3 · Cómo vuelve el resultado de la ventana

**Elegido**: la ventana emergente aterriza en una ruta de callback **de la misma aplicación**, y
avisa a quien la abrió. `oidc-client-ts` lo resuelve con `signinPopupCallback`.

**Por qué es seguro acá**: es el mismo origen. No hay que aflojar nada ni aceptar mensajes de
terceros.

**El detalle que hay que acertar**: al vencer el plazo de dos minutos, **se deja de escuchar**. Un
reingreso que llegue tarde no puede revivir una pantalla ya descartada (spec, escenario 8).

## 4 · Cómo se sabe que entró y no tiene acceso

**Elegido**: la aplicación entrega al módulo una **función de traducción** que recibe los claims y
devuelve las capacidades. El módulo no la interpreta: si devuelve vacío, el estado es
«sin acceso a esta aplicación».

**Por qué**: por el principio III, el módulo no puede conocer `ctacte-panel` ni ninguna capacidad. Y
resulta que ahí está la única forma propia de Keycloak —`resource_access.<client>.roles`, porque
OIDC estándar no tiene claim de roles—, así que **la costura cae del lado correcto sin esfuerzo**.

**Lo que el módulo sí hace**: garantizar que ese estado **no redirige al proveedor**. Hacerlo sería
un bucle infinito, y es el único lugar donde el módulo tiene que ser terco.

---

## 5 · Con qué se ejercita el protocolo

**Elegido**: el Keycloak local de la plataforma (`TAN-2`).

**Por qué hizo falta preguntárselo**: la implementación falsa reemplaza **nuestro adaptador**, no al
proveedor. Con ella no se ejecuta una línea de OIDC, así que el cableado del protocolo —lo más
riesgoso del módulo— quedaría sin ejercer hasta que hubiera VPN.

**Por qué el mismo producto y no uno más liviano**: un proveedor OIDC chico arranca más rápido, pero
no es el que corre en producción, y lo que funciona contra uno puede no funcionar contra el otro.

**Por qué no es de cuarzo**: el mismo realm lo tienen que usar los backends para validar. Un realm
por repositorio diverge, y el síntoma es que el frontend entra y la API lo rechaza con las dos
partes convencidas de estar bien.

**Descartado interceptar los pedidos**: OIDC usa redirecciones de página completa e iframes, y eso no
se intercepta.

---

## Lo que sigue sin resolverse, y no bloquea

**Que el proveedor de producción se comporte bien en una ventana emergente.** Con OIDC estándar y el
mismo sitio es rutina, pero es una afirmación. Contra el local (`TAN-2`) se puede **experimentar**, y
eso baja bastante el riesgo — pero su realm puede estar configurado distinto, así que la respuesta
autoritativa espera a la VPN.

**El plazo que el realm le da a un ingreso en curso.** Los dos minutos tienen que quedar por debajo.
Está en las preguntas anotadas en `estado.md`.

Ninguna de las dos impide escribir el módulo: la primera se ejerce contra la falsa y la segunda es
un número configurable.
