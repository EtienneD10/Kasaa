"use client";

import { Clock } from "lucide-react";
import type { Property } from "@/types";
import { daysSince } from "@/lib/property-status";

/**
 * Modal "¿Esta propiedad sigue disponible?" (frame real
 * `confirm-listing-modal`) — se dispara cuando `getListingStatus()`
 * (`lib/property-status.ts`) marca una propiedad como
 * `pendiente_confirmacion` (20+ días sin actualizar). Aparece desde el
 * ícono de reloj de la fila en `PropertiesTable` y, entrando desde el
 * Dashboard Home, vía el link "Confirmar vigencia" de la alerta
 * correspondiente en Atención Requerida (`?confirmar=<id>` en la URL).
 *
 * "Sí, sigue disponible" y "No, ya no está disponible" son acciones
 * reales (las resuelve `PropertiesTable`, que es quien tiene el estado
 * mutable de las propiedades) — "Recordarme en 3 días" queda decorativo,
 * no hay backend de recordatorios/notificaciones todavía.
 */
export function ConfirmListingModal({
  property,
  onClose,
  onConfirmAvailable,
  onMarkUnavailable,
}: {
  property: Property;
  onClose: () => void;
  onConfirmAvailable: () => void;
  onMarkUnavailable: () => void;
}) {
  const days = daysSince(property.lastUpdatedAt);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-card bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-agent-border p-2.5">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-buyer-input-bg">
            {property.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={property.photos[0]}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-buyer-text">
              {property.location.address}, {property.bedrooms} amb
            </p>
            <p className="truncate text-xs text-buyer-text-faint">
              {property.location.neighborhood}, {property.location.city}
            </p>
          </div>
        </div>

        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-status-amber-bg text-status-amber">
          <Clock size={24} strokeWidth={1.75} />
        </div>
        <h2 className="mb-1.5 text-center text-base font-bold text-buyer-text">
          ¿Esta propiedad sigue disponible?
        </h2>
        <p className="mb-5 text-center text-sm text-buyer-text-muted">
          {property.location.address} lleva {days} días publicada sin actualizaciones.
          Confirmanos si sigue vigente.
        </p>

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={onMarkUnavailable}
            className="flex-1 rounded-control border border-status-red py-2.5 text-sm font-bold text-status-red hover:bg-status-red-bg"
          >
            No, ya no está disponible
          </button>
          <button
            type="button"
            onClick={onConfirmAvailable}
            className="flex-1 rounded-control bg-accent py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95"
          >
            Sí, sigue disponible
          </button>
        </div>

        <button
          type="button"
          title="Próximamente"
          className="block w-full text-center text-xs font-medium text-buyer-text-faint underline"
        >
          Recordarme en 3 días
        </button>
      </div>
    </div>
  );
}
