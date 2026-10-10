# Propuestas a granito

Lo que OPE-Web necesita de granito y hoy **compone** con sus piezas, sin un estilo propio (principio
IV). Cada una tiene su evidencia, qué se compone mientras tanto, y qué se borra de acá cuando granito
la tenga. **Tandilia es sólo lectura desde OPE**: las lleva el dueño desde granito, con este texto.

Están ordenadas por cuánto se nota: la primera se ve en toda grilla; la última, en dos pantallas.

---

## 1 · Un «cargar más» sin total (`OW-4`, `GR-17`)

**Qué pasa.** `LoadMore` de `@granito/ui` exige `totalItems`, decide «hay más» con
`loaded < totalItems` y dice «N de M». OPE pagina con un cursor opaco y **sin recuento** (`ADR-020`
del backend): no hay M. Pasarle `Infinity` dibuja «20 de ∞».

**Qué se compone mientras tanto.** `LoadMoreCursor` en `packages/core/src/ui/load-more.tsx`: un
`Button` y dos textos («N cargados», «No hay más»). Se ve correcto y no se parece al paginador.

**Qué se pide.** Un `LoadMore` cuyo `totalItems` sea opcional, o un `hasMore` explícito. Con
`hasMore` y sin total, el texto sería «N cargados» y, al final, «No hay más». Se conserva lo que
`GR-17` fija y OPE comparte: **un botón, nunca carga automática al llegar al pie**.

**Qué se borra acá cuando llegue.** `LoadMoreCursor`, su prueba, y los tres textos del marco
(`loadMore`, `loadedCount`, `noMore`).

## 2 · Un valor que se muestra una sola vez (`OW-8`)

**Qué pasa.** El backend entrega el valor de una credencial **sólo en la respuesta que la acuña**
(`ADR-031` del backend): al crear un merchant y al rotar una llave. La pantalla tiene que mostrarlo
con una advertencia, dejar copiarlo, y decir si copió o no pudo. Granito no tiene una pieza para
«un valor que se copia y se va».

**Qué se compone mientras tanto.** `SecretOnce` en `packages/core/src/ui/secret-once.tsx`: un
`Alert` de advertencia y, por valor, un `Field` con `Value` (en `<code>`) y un `Button` «Copiar» que
dice «Copiado» un instante o «No se pudo copiar». **Lo que se ve mal**: el botón ocupa el ancho entero
debajo del valor, porque es lo que el `Field` hace con lo que recibe; y «Copiado» aparece debajo del
botón y corre el pie del formulario al aparecer.

**Qué se pide.** Un control de sólo lectura con el valor en fuente de código y «copiar» al costado,
que diga «copiado» sin cambiar de alto (por ejemplo, reemplazando el texto del botón un instante) y
que no finja cuando el portapapeles no está. Que no guarde nada: lo que recibe lo dibuja mientras
está montado.

**Qué se borra acá cuando llegue.** `SecretOnce`, su prueba, y los textos `copy`, `copied`,
`copyFailed` y `copyOnceTitle` del marco. La prueba de `OW-8` que intercepta telemetría y avisos **se
queda**: es de la pantalla, no de la pieza.

## 3 · Una barra de grilla sólo de acciones (`GR-38`)

**Qué pasa.** `GR-38` pone las acciones de una grilla en su `FilterBar`, y `FilterBar` exige
`applyOnChange` u `onApply` y reserva el renglón de filtros aunque no haya ninguno.
`listMerchants` no filtra, así que la grilla de merchants tiene una barra con «Nuevo merchant» a la
derecha y un renglón vacío encima.

**Qué se compone mientras tanto.** `FilterBar applyOnChange` sin filtros; `applyOnChange` no aplica a
nada. Se ve un espacio vacío donde irían los filtros.

**Qué se pide.** Que `FilterBar` acepte no tener filtros —sin `applyOnChange` ni `onApply`, sólo
`actions`— y entonces no reserve el renglón. O una pieza más chica, «barra de acciones de la
grilla», con el mismo lugar y el mismo borde.

**Qué se borra acá cuando llegue.** Nada: la grilla cambia un atributo. Cuando el contrato filtre,
la barra vuelve a tener filtros y esto deja de importar.

## 4 · Una acción al lado del dato de un campo (feature 008)

**Qué pasa.** Un `Field` apila lo que recibe y lo estira al ancho de su columna, que es lo que un
control necesita y lo que un botón no. En la configuración de un merchant cada valor **se hereda o
se declara**: heredado es un `Value` con «Declarar», declarado es su control con «Heredar». Puesto
tal cual, «Declarar» ocupa el ancho entero y se lee como el campo mismo. Es el mismo defecto que
`SecretOnce` tiene con «Copiar» (§2).

**Qué se compone mientras tanto.** `FieldAction` en
`apps/console/src/features/configuration/screens/treatment-fields.tsx`: un `<span>` alrededor del
botón, que se estira él y deja al botón a su ancho. Es estructura, no estilo; el botón queda debajo
del dato y no a su lado.

**Qué se pide.** Que `Field` acepte una acción propia —por ejemplo `action={<Button …/>}`— y la
dibuje al costado del dato o del control, a su ancho y alineada a su línea de base. Con eso,
«Declarar», «Heredar» y «Copiar» son la misma pieza.

**Qué se borra acá cuando llegue.** `FieldAction` y su comentario, y en `SecretOnce` el botón pasa a
ser la acción del campo.
