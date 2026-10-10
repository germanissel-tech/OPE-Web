/**
 * **Un instante del contrato, partido en lo que se muestra.**
 *
 * El contrato viaja instantes ISO en UTC (`2026-10-09T12:00:00Z`). Granito
 * formatea fechas y no instantes, así que se separan acá: la fecha va a su
 * formato, y la hora se muestra en UTC y diciéndolo —convertir a la zona del
 * navegador sin decirlo mentiría en un registro—.
 *
 * Vive en `lib/` porque lo usan varias funcionalidades y no dibuja nada.
 */

/** El día de un instante, en el formato en que viaja una fecha: `2026-10-09`. */
export const dayOf = (instant: string) => instant.slice(0, 10)

/** La hora de un instante, en UTC: `12:00`. */
export const timeOf = (instant: string) => instant.slice(11, 16)
