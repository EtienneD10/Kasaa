"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockAgentBlockedSlots, mockAgentWeekVisits, mockPropertyById } from "@/lib/mock-data";
import {
  AGENDA_SHORT_LABELS,
  RESCHEDULED_VISIT_DURATION_MINUTES,
  assignLanes,
  findConflictGroups,
  formatWeekRangeLabel,
  getWeekDays,
  minutesToTime,
  timeToMinutes,
  visitDurationMinutes,
  visitEndMinutes,
} from "@/lib/agenda";
import type { BlockedSlot, VisitRequest, VisitStatus } from "@/types";
import { VisitDetailModal } from "./VisitDetailModal";
import { ConflictResolutionModal, type ConflictResolution } from "./ConflictResolutionModal";
import { BlockScheduleModal } from "./BlockScheduleModal";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const ROW_HEIGHT = 64;

const STATUS_FILTERS: { key: VisitStatus; label: string; dot: string }[] = [
  { key: "aceptada", label: "Confirmada", dot: "bg-status-success" },
  { key: "pendiente", label: "Pendiente", dot: "bg-status-amber" },
  { key: "cancelada", label: "Cancelada", dot: "bg-status-red" },
];

const STATUS_CARD_STYLE: Record<VisitStatus, string> = {
  aceptada: "border-status-success bg-status-success-bg",
  pendiente: "border-status-amber bg-status-amber-bg",
  cancelada: "border-status-red bg-status-red-bg",
  vencida_sin_respuesta: "border-agent-border bg-agent-bg",
};

const STATUS_DOT: Record<VisitStatus, string> = {
  aceptada: "bg-status-success",
  pendiente: "bg-status-amber",
  cancelada: "bg-status-red",
  vencida_sin_respuesta: "bg-buyer-text-faint",
};

function pxTop(time: string): number {
  return ((timeToMinutes(time) - HOURS[0] * 60) / 60) * ROW_HEIGHT;
}

function pxHeight(durationMinutes: number): number {
  return Math.max((durationMinutes / 60) * ROW_HEIGHT, 30);
}

/**
 * Agenda del agente (frame `agent-agenda-screen` + "Flujo de Resolución
 * de Conflictos") — calendario semanal real: cada visita se ubica según
 * su `slot.date`/`slot.time` real, filtrable por propiedad/estado, con
 * huecos bloqueados a mano y detección real de conflictos de horario
 * (dos visitas del agente que se superponen, ver `lib/agenda.ts`).
 *
 * Decisiones/desvíos documentados en TRACKING.md, sección "Rediseño
 * 2026-08":
 * - "Mes" queda decorativo (`title="Próximamente"`) — sólo se construyó
 *   la vista Semana, que es la única que mostraba la referencia.
 * - El popover flotante de detalle de la referencia se implementó como
 *   modal centrado (`VisitDetailModal`), mismo contenido.
 * - "Solo mis visitas" es un toggle real en el sentido de que cambia de
 *   estado al tocarlo, pero hoy no filtra nada — todavía no existe una
 *   fuente de visitas de OTROS agentes para contrastar (ver Equipo/
 *   Pipeline, que sí tienen múltiples agentes pero no visitas propias).
 * - Confirmar/Cancelar una visita pendiente desde acá SÍ es una acción
 *   real sobre el estado local (resuelve parte del ítem pendiente de
 *   TRACKING.md "acciones reales de aceptar/rechazar").
 */
export function AgentAgenda() {
  const [visits, setVisits] = useState<VisitRequest[]>(() => [...mockAgentWeekVisits]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() => [...mockAgentBlockedSlots]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [propertySearch, setPropertySearch] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [activeConflictGroup, setActiveConflictGroup] = useState<VisitRequest[] | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [soloMisVisitas, setSoloMisVisitas] = useState(true);

  const agendaPropertyIds = useMemo(
    () => Array.from(new Set(mockAgentWeekVisits.map((v) => v.propertyId))),
    []
  );
  const [propertyFilter, setPropertyFilter] = useState<Set<string>>(
    () => new Set(agendaPropertyIds)
  );
  const [statusFilter, setStatusFilter] = useState<Set<VisitStatus>>(
    () => new Set<VisitStatus>(["aceptada", "pendiente"])
  );

  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);
  const weekDays = useMemo(
    () => getWeekDays(new Date(), weekOffset, todayISO),
    [weekOffset, todayISO]
  );
  const weekRangeLabel = formatWeekRangeLabel(weekDays);

  const filteredVisits = useMemo(
    () =>
      visits.filter((v) => propertyFilter.has(v.propertyId) && statusFilter.has(v.status)),
    [visits, propertyFilter, statusFilter]
  );

  const conflictGroups = useMemo(() => findConflictGroups(filteredVisits), [filteredVisits]);
  const conflictByVisitId = useMemo(() => {
    const map = new Map<string, VisitRequest[]>();
    conflictGroups.forEach((group) => group.forEach((v) => map.set(v.id, group)));
    return map;
  }, [conflictGroups]);

  const propertyOptions = useMemo(
    () =>
      agendaPropertyIds
        .map((id) => ({ id, label: AGENDA_SHORT_LABELS[id] ?? id }))
        .filter((p) => p.label.toLowerCase().includes(propertySearch.trim().toLowerCase())),
    [agendaPropertyIds, propertySearch]
  );

  function toggleProperty(id: string) {
    setPropertyFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleStatus(key: VisitStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleAccept(visitId: string) {
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, status: "aceptada" } : v)));
    setSelectedVisitId(null);
  }

  function handleCancel(visitId: string) {
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, status: "cancelada" } : v)));
    setSelectedVisitId(null);
  }

  function handleConflictResolve(result: ConflictResolution) {
    setVisits((prev) =>
      prev.map((v) => {
        if (v.id === result.confirmedId) return { ...v, status: "aceptada" };
        if (v.id === result.rescheduledId) {
          if (result.outcome === "rejected") return { ...v, status: "cancelada" };
          if (result.newSlot) {
            return {
              ...v,
              status: "aceptada",
              slot: {
                ...v.slot,
                date: result.newSlot.date,
                time: result.newSlot.time,
                durationMinutes: RESCHEDULED_VISIT_DURATION_MINUTES,
              },
            };
          }
        }
        return v;
      })
    );
  }

  function handleBlock(date: string, startTime: string, endTime: string, reason: string) {
    setBlockedSlots((prev) => [
      ...prev,
      { id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date, startTime, endTime, reason },
    ]);
    setBlockModalOpen(false);
  }

  function removeBlockedSlot(id: string) {
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
  }

  const selectedVisit = visits.find((v) => v.id === selectedVisitId) ?? null;
  const selectedProperty = selectedVisit ? mockPropertyById.get(selectedVisit.propertyId) ?? null : null;

  return (
    <div className="flex-1 overflow-y-auto bg-agent-bg">
      <header className="flex items-center justify-between border-b border-agent-border bg-white px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-buyer-text">Agenda</h1>
          <p className="mt-0.5 text-sm text-buyer-text-muted">Coordiná y gestioná tus visitas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-pill border border-agent-border p-0.5 text-sm font-semibold">
            <span className="rounded-pill bg-status-success px-4 py-1.5 text-black">Semana</span>
            <button
              type="button"
              title="Próximamente"
              className="rounded-pill px-4 py-1.5 text-buyer-text-muted"
            >
              Mes
            </button>
          </div>
          <button
            type="button"
            onClick={() => setBlockModalOpen(true)}
            className="flex items-center gap-1.5 rounded-control border border-agent-border bg-white px-3.5 py-2 text-sm font-semibold text-buyer-text hover:bg-agent-bg"
          >
            <CalendarDays size={15} strokeWidth={1.75} />
            Bloquear horario
          </button>
        </div>
      </header>

      <main className="px-8 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-agent-border bg-white text-buyer-text-muted hover:bg-agent-bg"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-agent-border bg-white text-buyer-text-muted hover:bg-agent-bg"
              aria-label="Semana siguiente"
            >
              <ChevronRight size={16} />
            </button>
            <h2 className="ml-2 text-sm font-bold text-buyer-text">{weekRangeLabel}</h2>
          </div>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-pill bg-status-success-bg px-3 py-1 text-xs font-bold text-status-success-text hover:brightness-95"
          >
            Hoy
          </button>
        </div>

        <div className="grid grid-cols-[240px_1fr] gap-5">
          {/* Filtros */}
          <aside className="h-fit rounded-card border border-agent-border bg-white p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
              Filtrar por propiedad
            </p>
            <label className="mb-3 flex items-center gap-2 rounded-lg border border-agent-border px-2.5 py-2 text-sm text-buyer-text-faint">
              <Search size={14} className="shrink-0" />
              <input
                type="text"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-transparent text-buyer-text outline-none placeholder:text-buyer-text-faint"
              />
            </label>
            <div className="mb-4 space-y-2">
              {propertyOptions.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm text-buyer-text">
                  <input
                    type="checkbox"
                    checked={propertyFilter.has(p.id)}
                    onChange={() => toggleProperty(p.id)}
                    className="h-4 w-4 rounded accent-accent"
                  />
                  {p.label}
                </label>
              ))}
              {propertyOptions.length === 0 && (
                <p className="text-xs text-buyer-text-faint">Sin resultados.</p>
              )}
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
              Filtrar por estado
            </p>
            <div className="mb-4 space-y-2">
              {STATUS_FILTERS.map((s) => (
                <label key={s.key} className="flex cursor-pointer items-center gap-2 text-sm text-buyer-text">
                  <input
                    type="checkbox"
                    checked={statusFilter.has(s.key)}
                    onChange={() => toggleStatus(s.key)}
                    className="h-4 w-4 rounded accent-accent"
                  />
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                  {s.label}
                </label>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between border-t border-agent-border pt-3">
              <span className="text-sm font-medium text-buyer-text">Solo mis visitas</span>
              <button
                type="button"
                role="switch"
                aria-checked={soloMisVisitas}
                title="Hoy todas las visitas ya son tuyas — no hay agenda compartida de equipo todavía"
                onClick={() => setSoloMisVisitas((v) => !v)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-pill transition-colors",
                  soloMisVisitas ? "bg-status-success" : "bg-agent-border"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    soloMisVisitas ? "translate-x-[22px]" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            <div className="space-y-1.5 border-t border-agent-border pt-3">
              {STATUS_FILTERS.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-xs text-buyer-text-muted">
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                  {s.label}
                </div>
              ))}
            </div>
          </aside>

          {/* Calendario */}
          <div className="overflow-x-auto rounded-card border border-agent-border bg-white">
            <div className="grid min-w-[720px] grid-cols-[56px_repeat(7,1fr)]">
              <div />
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "border-b border-l border-agent-border px-2 py-2.5 text-center",
                    day.isToday && "bg-status-success-bg/40"
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
                    {day.label}
                  </p>
                  <p
                    className={cn(
                      "mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold",
                      day.isToday ? "bg-status-success text-black" : "text-buyer-text"
                    )}
                  >
                    {day.dayNum}
                  </p>
                </div>
              ))}

              {/* Eje horario */}
              <div className="relative" style={{ height: HOURS.length * ROW_HEIGHT }}>
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-[10px] text-buyer-text-faint"
                    style={{ top: i * ROW_HEIGHT }}
                  >
                    {h.toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {weekDays.map((day) => {
                const dayVisits = filteredVisits.filter((v) => v.slot.date === day.date);
                const dayBlocked = blockedSlots.filter((b) => b.date === day.date);
                const isEmpty = dayVisits.length === 0 && dayBlocked.length === 0;
                const laneInfo = assignLanes(dayVisits);

                return (
                  <div
                    key={day.date}
                    className={cn(
                      "relative border-l border-agent-border",
                      day.isToday && "bg-status-success-bg/20"
                    )}
                    style={{ height: HOURS.length * ROW_HEIGHT }}
                  >
                    {HOURS.map((h, i) => (
                      <div
                        key={h}
                        className="absolute inset-x-0 border-t border-agent-border"
                        style={{ top: i * ROW_HEIGHT }}
                      />
                    ))}

                    {isEmpty && (
                      <div className="absolute inset-x-0 top-10 flex flex-col items-center gap-1 text-buyer-text-faint">
                        <CalendarDays size={16} strokeWidth={1.5} />
                        <span className="text-[10px]">Sin visitas</span>
                      </div>
                    )}

                    {dayBlocked.map((b) => (
                      <div
                        key={b.id}
                        className="absolute inset-x-1 rounded-lg border border-dashed border-buyer-text-faint bg-agent-bg px-1.5 py-1"
                        style={{
                          top: pxTop(b.startTime),
                          height: pxHeight(timeToMinutes(b.endTime) - timeToMinutes(b.startTime)),
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-[10px] font-bold text-buyer-text-muted">
                            {b.startTime} - {b.endTime}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeBlockedSlot(b.id)}
                            className="text-buyer-text-faint hover:text-status-red"
                            aria-label="Quitar bloqueo"
                          >
                            <X size={11} />
                          </button>
                        </div>
                        <p className="flex items-center gap-1 truncate text-[10px] text-buyer-text-faint">
                          <Lock size={9} />
                          {b.reason ?? "No disponible"}
                        </p>
                      </div>
                    ))}

                    {dayVisits.map((v) => {
                      const inConflict = conflictByVisitId.has(v.id);
                      const label = AGENDA_SHORT_LABELS[v.propertyId] ?? v.propertyId;
                      const { lane, totalLanes } = laneInfo.get(v.id) ?? { lane: 0, totalLanes: 1 };
                      const widthPct = 100 / totalLanes;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            inConflict
                              ? setActiveConflictGroup(conflictByVisitId.get(v.id) ?? null)
                              : setSelectedVisitId(v.id)
                          }
                          title={inConflict ? "Conflicto de horario — tocá para resolver" : undefined}
                          className={cn(
                            "absolute overflow-hidden rounded-lg border-l-4 px-1.5 py-1 text-left shadow-sm transition-transform hover:z-10 hover:scale-[1.02]",
                            STATUS_CARD_STYLE[v.status]
                          )}
                          style={{
                            top: pxTop(v.slot.time),
                            height: pxHeight(visitDurationMinutes(v)),
                            left: `calc(${lane * widthPct}% + 4px)`,
                            width: `calc(${widthPct}% - 6px)`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[10px] font-bold text-buyer-text">
                              {v.slot.time} - {minutesToTime(visitEndMinutes(v))}
                            </p>
                            {inConflict ? (
                              <TriangleAlert size={11} className="shrink-0 text-status-red" />
                            ) : (
                              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[v.status])} />
                            )}
                          </div>
                          <p className="truncate text-[11px] font-semibold text-buyer-text">
                            {v.buyerName}
                          </p>
                          <p className="truncate text-[10px] text-buyer-text-faint">{label}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          property={selectedProperty}
          onClose={() => setSelectedVisitId(null)}
          onAccept={() => handleAccept(selectedVisit.id)}
          onCancel={() => handleCancel(selectedVisit.id)}
        />
      )}

      {activeConflictGroup && (
        <ConflictResolutionModal
          group={activeConflictGroup}
          weekDays={weekDays}
          allVisits={visits}
          onClose={() => setActiveConflictGroup(null)}
          onResolve={handleConflictResolve}
        />
      )}

      {blockModalOpen && (
        <BlockScheduleModal
          weekDays={weekDays}
          onClose={() => setBlockModalOpen(false)}
          onBlock={handleBlock}
        />
      )}
    </div>
  );
}
