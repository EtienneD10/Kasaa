"use client";

import { MessageCircle, Phone, X } from "lucide-react";
import type { Property, VisitRequest, VisitStatus } from "@/types";
import { visitDurationMinutes, visitEndMinutes, minutesToTime } from "@/lib/agenda";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<VisitStatus, string> = {
  pendiente: "Pendiente",
  aceptada: "Confirmada",
  cancelada: "Cancelada",
  vencida_sin_respuesta: "Vencida",
};

const STATUS_PILL: Record<VisitStatus, string> = {
  pendiente: "bg-status-amber-bg text-status-amber-text",
  aceptada: "bg-status-success-bg text-status-success-text",
  cancelada: "bg-status-red-bg text-status-red",
  vencida_sin_respuesta: "bg-agent-border text-buyer-text-muted",
};

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

/**
 * Modal de detalle de una visita — se abre al tocar cualquier card del
 * calendario de Agenda que NO forme parte de un conflicto (para las que
 * sí, ver `ConflictResolutionModal`). El frame real (`agent-agenda-screen`)
 * mostraba esto como un popover flotante anclado a la card; acá se
 * implementó como modal centrado (mismo patrón que `ConfirmListingModal`)
 * por simplicidad/robustez — mismo contenido, layout distinto.
 *
 * "Confirmar visita"/"Cancelar visita" son acciones reales sobre el
 * estado de `AgentAgenda` (resuelve el pedido de verdad, mismo espíritu
 * que pidió el usuario: "la agenda va a depender directamente de la
 * aceptación... o canceladas esas visitas"). "Ver detalle" y el botón de
 * WhatsApp quedan decorativos — no hay página de detalle de visita ni
 * integración de WhatsApp todavía (spec §7, decisión abierta).
 */
export function VisitDetailModal({
  visit,
  property,
  onClose,
  onAccept,
  onCancel,
}: {
  visit: VisitRequest;
  property: Property | null;
  onClose: () => void;
  onAccept: () => void;
  onCancel: () => void;
}) {
  const endTime = minutesToTime(visitEndMinutes(visit));
  const durationMinutes = visitDurationMinutes(visit);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-card bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-buyer-input-bg">
              {property?.photos[0] ? (
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
                {property?.location.address ?? "Propiedad"}
              </p>
              <p className="truncate text-xs text-buyer-text-faint">
                {property ? `${property.location.neighborhood}, ${property.location.city}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-buyer-text-faint hover:bg-buyer-input-bg"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-agent-border p-3">
          <p className="text-sm font-semibold text-buyer-text">{visit.buyerName}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-buyer-text-muted">
            <Phone size={12} />
            {visit.buyerPhone}
            <button
              type="button"
              title="Próximamente: Contactar por WhatsApp"
              className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-success/15 text-emerald-700"
            >
              <MessageCircle size={11} strokeWidth={2} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-medium text-buyer-text">
              {formatDayLabel(visit.slot.date)} · {visit.slot.time} - {endTime} ({durationMinutes} min)
            </p>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                STATUS_PILL[visit.status]
              )}
            >
              {STATUS_LABEL[visit.status]}
            </span>
          </div>
        </div>

        {visit.status === "pendiente" && (
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-control border border-status-red py-2.5 text-sm font-bold text-status-red hover:bg-status-red-bg"
            >
              Cancelar visita
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 rounded-control bg-accent py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95"
            >
              Confirmar visita
            </button>
          </div>
        )}

        <button
          type="button"
          title="Próximamente"
          className="block w-full text-center text-xs font-medium text-buyer-text-faint underline"
        >
          Ver detalle
        </button>
      </div>
    </div>
  );
}
