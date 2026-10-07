# Contrato · la superficie pública de `@cuarzo/session`

Esto es **todo** lo que el módulo expone. Lo que no está acá, no sale.

La regla que gobierna el contrato: **nada de lo que se exporta permite obtener un token.** No es una
convención — es lo que hace que «una pantalla no puede obtener un token» sea una verdad del tipo
(CU-10).

## Lo que se exporta

### Arrancar

```ts
configureSession(config: SessionConfig): void
```

Se llama **una vez, antes de dibujar nada**. Si falta un valor obligatorio, **tira** — la aplicación
no arranca y dice por qué (CU-17).

### Autorizar un pedido

```ts
authorize(request: Request): Promise<Request>
```

**La pieza central.** Recibe un pedido y devuelve el mismo pedido, autorizado. Quien la llama no
sabe si adentro hay un *bearer*, una cookie o mTLS.

Si mañana el proveedor cambia de mecanismo, **no se mueve una sola pantalla**. Y CU-22 entra por
acá sin cambiar la forma: el pedido ya dice a qué sistema va.

> **No existe `getToken()`, y es a propósito.** Si existiera, cada lugar que la llamara estaría
> suponiendo que la autenticación es un *bearer* — una suposición sobre el proveedor, justo la que
> este módulo existe para no tener.

### Leer el estado

```ts
useSession(): SessionState        // el estado y sus datos, sin el token
useCapabilities(): Capabilities   // lo que devolvió la traducción de la aplicación
```

### Salir

```ts
signOut(): Promise<void>
```

Termina la sesión del realm, o sea **la de todas las aplicaciones** (CU-12).

### Para las pruebas y para desarrollo

```ts
createFakeSession(options): SessionPort
```

La segunda implementación. Existe por CU-10 —una interfaz no demuestra nada si nunca se ejerce
contra otra cosa— y por CU-17 **es además el modo de desarrollo**, así que se ejerce todos los días.

Permite forzar los casos que en producción casi no ocurren: que la renovación falle, que el
navegador bloquee la ventana, que se cierre sin entrar, que venza el plazo, y **que vuelva otro
sujeto**.

## Lo que NO se exporta, y por qué

| | |
|---|---|
| El token, en cualquier forma | Ver arriba. Es la razón de ser del contrato |
| El cliente de `oidc-client-ts` | Filtrarlo ataría a las aplicaciones a la biblioteca que elegimos |
| El nombre del proveedor | Ni en un tipo, ni en una constante, ni en un comentario. **Lo verifica una prueba** |
| Las capacidades interpretadas | El módulo las transporta y no las lee (principio III) |

## Lo que la aplicación tiene que poner

```ts
toCapabilities(claims: Claims): Capabilities
```

**Obligatoria.** Traduce lo que el token trae a lo que esta aplicación permite.

Vive del lado de la aplicación porque el módulo no puede conocer `ctacte-panel` ni
`receipts:write`. Y ahí está la única forma propia del proveedor —`resource_access.<client>.roles`,
porque OIDC estándar no tiene claim de roles—, así que **la costura cae del lado correcto sin que
haya que forzarla**.

Si devuelve vacío, el estado es `unauthorized`, y ese estado **no redirige al proveedor**.
