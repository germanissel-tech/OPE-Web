# OPE-Web

**El frontend de OPE**: la consola de operación y, después, el portal del merchant, sobre un núcleo
compartido y el sistema de diseño de Tandilia.

## El monorepo

```
packages/
├── core/        @ope/core     el arranque, el shell, las pantallas, las acciones, los cuatro estados,
│                              Problem Details, el cursor, y las comprobaciones (ope-check)
└── session/     @ope/session  la puerta: autoriza pedidos, mira respuestas y no entrega credenciales
apps/
└── console/     OPE-Console   la consola del operador, contra OPE-Backend
contracts/
└── ope/                       el contrato de OPE-Backend, sincronizado y versionado
docs/                          las decisiones: las de OPE-Web (OW-n) y las heredadas de cuarzo (CU-n)
specs/                         una especificación por feature
```

Los paquetes **no se publican**: llegan a las aplicaciones por workspace, en el mismo commit. La
prueba para saber qué va en cada lado: **si arreglo esto, ¿tiene que llegarles a las dos
aplicaciones?** Si sí, `packages/`. Si no, `apps/<x>`.

Nace de una copia de cuarzo, la aplicación base de Tandilia; qué se heredó y qué cambió está en
[`docs/origen.md`](docs/origen.md). Granito —`@granito/ui`, `@granito/tokens`— llega por `file:` a
la carpeta hermana de Tandilia hasta que esté en npm, y **no se toca desde acá**.

## Cómo se levanta

```bash
npm install                 # resuelve @granito/* por file: a ../../../../Bitbucket/Tandil Stone Pulse/tandilia
npm test                    # construye los paquetes, corre ope-check, la puerta y Vitest
npm run dev                 # la consola en http://localhost:5173
```

**Contra el backend real**: en `../backend`, `npm run dev` (escucha en `:3000`). Vite reenvía `/api`
al backend, así que no hay CORS que pedir; en producción el servidor que publica hace el mismo
reenvío. Entrar con `http://localhost:5173/?dev.bearer=1` y el token de desarrollo del backend.

**Sin backend**: `npm run dev` entra con la sesión falsa; `?dev.papel=lectura` muestra lo que hay sin
`merchants:write`; `?dev.entrada=1` arranca en la vista de ingreso.

**El contrato**: `npm run contract:sync` lo trae de `../backend` (o de `OPE_BACKEND_DIR`, o de una
carpeta de release con `--from`), y `npx ope-check conformity` verifica que el módulo de capacidades
sea el del bundle sincronizado.

## Dónde seguir

| | |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Cómo se trabaja acá. **Se lee entero antes de tocar nada** |
| [`docs/decisiones.md`](docs/decisiones.md) | El índice de las decisiones, con su estado |
| [`docs/ope.md`](docs/ope.md) | Las decisiones de OPE-Web, con su origen |
| [`apps/console/src/app/README.md`](apps/console/src/app/README.md) | Lo que una aplicación declara |
| [`apps/console/src/features/README.md`](apps/console/src/features/README.md) | Cómo se agrega una pantalla |
| [`docs/segunda-aplicacion.md`](docs/segunda-aplicacion.md) | Cómo nace `apps/portal` |
