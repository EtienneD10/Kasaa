import type { Property, PropertyStatus } from "@/types";

/**
 * Regla de "vigencia" de una publicación (spec §5.4) — confirmada por el
 * usuario en esta sesión junto con los frames reales
 * `propiedades-table-view` / `confirm-listing-modal`: "desde el momento
 * en que agregan cada propiedad tienen 20 días para que esté en tiempo,
 * luego se activa una alerta para que actualicen la propiedad y se pausa
 * la publicación".
 *
 * Implementación: a partir de `CONFIRMATION_THRESHOLD_DAYS` sin
 * actualizar (`lastUpdatedAt`), una propiedad `publicada` pasa a
 * mostrarse como `pendiente_confirmacion` (dispara el ícono de reloj +
 * el modal de confirmación). Si el agente no responde durante
 * `PAUSE_GRACE_DAYS` adicionales, pasa a `pausada` sola. El usuario
 * especificó los 20 días; el período de gracia extra no lo especificó —
 * se eligió 7 días como valor razonable, documentado acá para poder
 * ajustarlo fácil si hace falta.
 *
 * Es una regla DERIVADA, no un campo que se guarda: se calcula en cada
 * render a partir de `lastUpdatedAt`. Solo aplica sobre propiedades con
 * `status === "publicada"` — `borrador`/`vencida`/`pausada` seteados a
 * mano en el mock (ver `mock-data.ts`) son estados finales/manuales y NO
 * se recalculan acá.
 *
 * "Confirmar que sigue disponible" en el modal resetea `lastUpdatedAt` a
 * hoy (vuelve a `publicada`); "Ya no está disponible" pasa el status
 * real a `pausada` de una — ver `ConfirmListingModal.tsx`.
 */
export const CONFIRMATION_THRESHOLD_DAYS = 20;
export const PAUSE_GRACE_DAYS = 7;

export function daysSince(iso: string, now: number = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

export function getListingStatus(property: Pick<Property, "status" | "lastUpdatedAt">): PropertyStatus {
  if (property.status !== "publicada") return property.status;
  const days = daysSince(property.lastUpdatedAt);
  if (days >= CONFIRMATION_THRESHOLD_DAYS + PAUSE_GRACE_DAYS) return "pausada";
  if (days >= CONFIRMATION_THRESHOLD_DAYS) return "pendiente_confirmacion";
  return "publicada";
}
