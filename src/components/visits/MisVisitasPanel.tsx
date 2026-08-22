"use client";

import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { mockPropertyById, mockVisitRequests } from "@/lib/mock-data";
import { DayTimeSelector } from "@/components/booking/DayTimeSelector";
import type { VisitRequest } from "@/types";

/**
 * "Mis Visitas" — dropdown que se abre desde el ícono de calendario del
 * Header (rol comprador), reconstruido a partir de los frames reales
 * `desktop-discovery-default-cards + panel-mis-visitas` /
 * `+ cancelar-flow` / `+ visitas-canceladas`. Sin backend todavía (ver
 * TODO en `DiscoveryClient.requestVisit`), así que arranca de
 * `mockVisitRequests` y mantiene su propia copia mutable en memoria para
 * que confirmar/reagendar/cancelar se sienta real dentro de la sesión —
 * se resetea al recargar, igual que el resto de los mocks de esta app.
 *
 * 3 tabs mapean directo a `VisitStatus` (spec §5.1): Agendadas→"aceptada",
 * Pendientes→"pendiente", Canceladas→"cancelada" (`vencida_sin_respuesta`
 * no tiene tab propia todavía, no apareció en los frames de referencia —
 * se puede sumar después si hace falta distinguirla de "cancelada").
 *
 * Colores de estado: "Confirmada" verde, "Pendiente" ámbar (mismos
 * tokens que el pill de `PropertyCard`), "Cancelada" rojo
 * (`status-red`/`status-red-bg`, ya definidos en globals.css pero sin
 * uso todavía en la superficie compradora) — confirmado por el usuario
 * sobre la referencia, ver TRACKING.md.
 */
type Tab = "aceptada" | "pendiente" | "cancelada";

const TABS: { id: Tab; label: string }[] = [
  { id: "aceptada", label: "Agendadas" },
  { id: "pendiente", label: "Pendientes" },
  { id: "cancelada", label: "Canceladas" },
];

const STATUS_PILL: Record<Tab, { label: string; className: string }> = {
  aceptada: { label: "Confirmada", className: "bg-status-success/15 text-emerald-700" },
  pendiente: { label: "Pendiente", className: "bg-status-amber-bg text-status-amber-text" },
  cancelada: { label: "Cancelada", className: "bg-status-red-bg text-status-red" },
};

export function MisVisitasPanel({ onClose }: { onClose: () => void }) {
  const [visits, setVisits] = useState<VisitRequest[]>(mockVisitRequests);
  const [activeTab, setActiveTab] = useState<Tab>("aceptada");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [draftTime, setDraftTime] = useState<string | null>(null);

  const filtered = visits.filter((v) => v.status === activeTab);

  function toggleExpand(visit: VisitRequest) {
    if (expandedId === visit.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(visit.id);
    setCancelingId(null);
    setDraftDate(visit.slot.date);
    setDraftTime(visit.slot.time);
  }

  function confirmReschedule(visit: VisitRequest) {
    if (!draftDate || !draftTime) return;
    // TODO: PATCH /api/visits/:id — confirma el reagendado real, spec §5.1.
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visit.id
          ? { ...v, status: "aceptada", slot: { date: draftDate, time: draftTime }, respondedAt: new Date().toISOString() }
          : v
      )
    );
    setExpandedId(null);
  }

  function confirmCancel(visit: VisitRequest) {
    // TODO: PATCH /api/visits/:id — cancela de verdad, spec §5.1 (mismo
    // TODO que "Cancelar" en el estado Sent de PropertyCard).
    setVisits((prev) =>
      prev.map((v) => (v.id === visit.id ? { ...v, status: "cancelada" } : v))
    );
    setCancelingId(null);
    setExpandedId(null);
  }

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-[380px] overflow-hidden rounded-card border border-buyer-border bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-buyer-border px-4 py-3">
        <h3 className="font-display text-base font-semibold text-buyer-text">Mis Visitas</h3>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-7 w-7 items-center justify-center rounded-full text-buyer-text-muted hover:bg-buyer-bg"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex border-b border-buyer-border px-2">
        {TABS.map((tab) => {
          const count = visits.filter((v) => v.status === tab.id).length;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setExpandedId(null);
                setCancelingId(null);
              }}
              className={cn(
                "flex-1 border-b-2 px-2 py-2.5 text-xs font-semibold transition-colors",
                active
                  ? "border-accent text-buyer-text"
                  : "border-transparent text-buyer-text-faint hover:text-buyer-text-muted"
              )}
            >
              {tab.label} {count > 0 && <span className="text-buyer-text-faint">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-buyer-text-muted">
            No tenés visitas {TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}.
          </p>
        ) : (
          filtered.map((visit) => {
            const property = mockPropertyById.get(visit.propertyId);
            if (!property) return null;
            const pill = STATUS_PILL[visit.status as Tab];
            const expanded = expandedId === visit.id;
            const canceling = cancelingId === visit.id;

            return (
              <div key={visit.id} className="border-b border-buyer-border last:border-0">
                <button
                  onClick={() => toggleExpand(visit)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-buyer-bg"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-buyer-text">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={property.photos[0]}
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-buyer-text">
                      {property.title}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-buyer-text-muted">
                      <MapPin size={10} />
                      {new Date(visit.slot.date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                      , {visit.slot.time}
                    </p>
                    <p className="truncate text-[11px] text-buyer-text-faint">
                      Agente {property.agent.name}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      pill.className
                    )}
                  >
                    {pill.label}
                  </span>
                </button>

                {expanded && !canceling && (
                  <div className="space-y-3 border-t border-buyer-border bg-buyer-bg/60 px-4 py-4">
                    {visit.status === "pendiente" ? (
                      <>
                        <p className="text-xs font-semibold text-buyer-text">
                          Reagendar día y horario
                        </p>
                        <DayTimeSelector
                          slots={property.availability}
                          selectedDate={draftDate}
                          selectedTime={draftTime}
                          onSelectDate={(d) => {
                            setDraftDate(d);
                            setDraftTime(null);
                          }}
                          onSelectTime={setDraftTime}
                        />
                        <p className="text-xs text-buyer-text-muted">¿Confirmás esta visita?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCancelingId(visit.id)}
                            className="flex-1 rounded-xl border border-buyer-border bg-white py-2.5 text-xs font-bold text-buyer-text"
                          >
                            No, gracias
                          </button>
                          <button
                            disabled={!draftDate || !draftTime}
                            onClick={() => confirmReschedule(visit)}
                            className={cn(
                              "flex-1 rounded-xl py-2.5 text-xs font-bold transition-colors",
                              draftDate && draftTime
                                ? "bg-accent text-black"
                                : "cursor-not-allowed bg-buyer-border text-buyer-text-faint"
                            )}
                          >
                            Sí, confirmo
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-buyer-text-muted">
                        {formatPrice(property.price, property.currency)} ·{" "}
                        {property.location.address}
                      </p>
                    )}
                    {visit.status !== "cancelada" && (
                      <button
                        onClick={() => setCancelingId(visit.id)}
                        className="block text-center text-xs font-semibold text-buyer-text-muted underline"
                      >
                        Cancelar visita
                      </button>
                    )}
                  </div>
                )}

                {expanded && canceling && (
                  <div className="space-y-3 border-t border-buyer-border bg-buyer-bg/60 px-4 py-4">
                    <p className="text-xs text-buyer-text">
                      ¿Confirmás que querés cancelar esta visita?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCancelingId(null)}
                        className="flex-1 rounded-xl border border-buyer-border bg-white py-2.5 text-xs font-bold text-buyer-text"
                      >
                        No, mantener
                      </button>
                      <button
                        onClick={() => confirmCancel(visit)}
                        className="flex-1 rounded-xl bg-status-red py-2.5 text-xs font-bold text-white"
                      >
                        Sí, cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
