# Cuarzo

**Cómo se arma una aplicación de frontend de Tandilia.** Las decisiones de arquitectura con su
razón, el esqueleto del que se clona, y el código que tiene que quedar sincronizado entre todas.

Se llama Cuarzo porque es la otra roca del basamento de Tandilia, la que forma las sierras junto
con el granito. Ver `../00-proyectos.md` para la familia de nombres.

## Las tres capas

```
granito     ← cómo se ve y cómo se opera. NO sabe de Tandilia.
   ↓
cuarzo      ← cómo se arma una aplicación de Tandilia. NO sabe de negocio.
   ↓
las-animas/admin · centinela · tigre     ← cada una su dominio y su backend.
```

**Cada capa se define por lo que NO sabe**, que es lo que la mantiene reutilizable.

## Qué hay acá

**Las decisiones**, en [docs/arquitectura.md](docs/arquitectura.md) —y las de sesión, autenticación
y permisos en [docs/seguridad.md](docs/seguridad.md)—, cada una con su porqué. No es una lista de
reglas: una regla sin razón se saltea el día que molesta.

**La aplicación base**: una aplicación que **corre y no sabe de ningún negocio**. Autentica,
navega, filtra por capacidad de los dos lados y trata el camino de falla de la sesión. El criterio
de que está lista es que se pueda levantar — y hoy levanta.

**Y dos paquetes**: [`@cuarzo/core`](packages/core) —el arranque, el shell, el registro de
pantallas, la navegación tipada y las comprobaciones— y [`@cuarzo/session`](packages/session) —la
puerta que autoriza pedidos y **no entrega tokens**—.

**Empezar una aplicación es partir de cuarzo** y agregar tres cosas: las pantallas, los servicios
que hablan con su backend, y las reglas de su negocio. Nada más — lo visual, la navegación y los
transversales ya están.

**Y el clon lleva sus propias instrucciones**: `CLAUDE.md` y la constitución viajan copiados, y
**las comprobaciones y las decisiones llegan adentro del paquete** —así una aplicación verifica sus
citas contra las decisiones de la versión que usa, no contra las de hoy—. En Tandilia construye un
agente, y un agente arranca cada sesión en frío: si las reglas no viajan con el esqueleto, alguien
tiene que acordarse de contárselas.

## Qué NO hay acá

**Nada que sepa de un negocio.** Qué es una liquidación, una receta o un punto de fidelización es
de cada aplicación.

**Nada de diseño.** Colores, tipografía, componentes, cómo se ve un importe: eso es granito, y
duplicarlo acá sería tener dos fuentes que se contradicen.

**Nada de un backend en particular.** Cada aplicación habla con el suyo y los contratos son
distintos. Lo que se comparte es **la forma de pedir** —quién cachea, qué se cancela, qué muestra
la pantalla mientras espera—, nunca qué se pide.

## Se comparte de dos formas, y no son lo mismo

**Por biblioteca**, lo que tiene que quedar sincronizado para siempre: la sesión, los permisos, el
manejo de errores. Si estuviera copiado, arreglar un defecto sería arreglarlo en cuatro repos.

**Por copia** —el esqueleto—, lo que es un punto de partida y después diverge legítimamente: la
estructura de carpetas, las pantallas, la configuración de compilación. Una biblioteca que impone
para siempre los nombres de las carpetas es una molestia, no una garantía.

La prueba para saber cuál es cuál: **si arreglo esto, ¿tiene que llegarles a todas?** Si sí,
biblioteca. Si no, esqueleto.

## Cómo se corre

```bash
npm run avance      # en qué tramo va la implementación, y qué sigue
npm test            # las comprobaciones, la puerta, y las pruebas
npm run dev         # levanta el esqueleto
npm run simulado    # el backend simulado en :4010
npm run clon        # el ritual de clonar, de verdad: empaqueta, instala y compila
```

**Una casilla no cierra un tramo: lo cierra su punto de control**, que es la aplicación arrancando.

## El orden en que se construye

**Primero las decisiones, después la primera aplicación, y recién al final extraer a una biblioteca
lo que la segunda pruebe que es común.**

La razón está a la vista en el repositorio hermano: granito se construyó con un solo consumidor y
quedó hablando el idioma de ése —con el símbolo del peso adentro, los nombres de un contrato ajeno
y los rótulos cableados—. Separarlo llevó una jornada entera. **Con un solo consumidor no se ve qué
es general y qué es de ése.**

La única excepción es la sesión, porque de eso hay evidencia y no una suposición: es el mismo
proveedor de identidad para todas. Cuál sea es configuración; que sea compartido es el hecho.

## Dónde seguir

| | |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Cómo se trabaja acá. **Se lee entero antes de tocar nada** |
| [`docs/decisiones.md`](docs/decisiones.md) | El índice de las decisiones, con su estado |
| [`src/app/README.md`](src/app/README.md) | Lo que una aplicación declara |
| [`src/features/README.md`](src/features/README.md) | Cómo se agrega una pantalla |
