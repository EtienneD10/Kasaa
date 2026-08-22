"use client";

import { useState } from "react";
import { CheckCircle2, Clock, MessageCircle, Phone, X } from "lucide-react";
import type { VisitRequest } from "@/types";
import {
  AGENDA_SHORT_LABELS,
  RESCHEDULE_TIME_SLOTS,
  RESCHEDULED_VISIT_DURATION_MINUTES,
  formatShortDate,
  isSlotTaken,
  minutesToTime,
  timeToMinutes,
  visitEndMinutes,
  type WeekDay,
} from "@/lib/agenda";
import { cn } from "@/lib/utils";

function proposedEndTime(time: string): string {
  return minutesToTime(
    Math.min(timeToMinutes(time) + RESCHEDULED_VISIT_DURATION_MINUTES, 23 * 60 + 59)
  );
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export interface ConflictResolution {
  confirmedId: string;
  rescheduledId: string;
  newSlot: { date: string; time: string } | null;
  outcome: "confirmed" | "rejected";
}

/**
 * "Flujo de Resolución de Conflictos" — wizard de 3 pasos del frame del
 * mismo nombre. El frame lo mostraba como 3 cards separadas una al lado
 * de la otra con flechas "PASO 2"/"PASO 3" — eso era la puesta en escena
 * de la presentación, no la UI real; acá se implementó como un único
 * modal que avanza de paso (mismo shell, contenido que cambia), que es
 * como funcionaría de verdad en la app.
 *
 * Paso 2 ("¿Qué franjas están disponibles?"): la referencia mostraba
 * 09:00 y 11:30 deshabilitados pero 09:30 habilitado a pesar de que la
 * visita de Ana García ese día dura 09:00-09:45 (se solaparía con
 * 09:30) — el frame no es consistente con una sola regla de solapamiento
 * real. Se optó por la regla más simple y explicable: una franja se
 * deshabilita si otra visita del agente arranca EXACTAMENTE a esa hora
 * ese día (`isSlotTaken`), documentado en `lib/agenda.ts` y en
 * TRACKING.md. Es una simplificación intencional, no un bug.
 */
export function ConflictResolutionModal({
  group,
  weekDays,
  allVisits,
  onClose,
  onResolve,
}: {
  group: VisitRequest[];
  weekDays: WeekDay[];
  allVisits: VisitRequest[];
  onClose: () => void;
  onResolve: (result: ConflictResolution) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmed, setConfirmed] = useState<VisitRequest | null>(null);
  const [toReschedule, setToReschedule] = useState<VisitRequest | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"confirmed" | "rejected" | null>(null);

  const [a] = group;
  const propertyLabel = AGENDA_SHORT_LABELS[a.propertyId] ?? a.propertyId;
  const conflictDayLabel = formatShortDate(a.slot.date);
  const conflictEnd = minutesToTime(visitEndMinutes(a));

  function handleConfirmCandidate(candidate: VisitRequest) {
    const other = group.find((v) => v.id !== candidate.id)!;
    setConfirmed(candidate);
    setToReschedule(other);
    setStep(2);
  }

  function handleSendProposal() {
    setStep(3);
  }

  function handleOutcome(result: "confirmed" | "rejected") {
    if (!confirmed || !toReschedule) return;
    setOutcome(result);
    onResolve({
      confirmedId: confirmed.id,
      rescheduledId: toReschedule.id,
      newSlot: result === "confirmed" && selectedDay && selectedTime ? { date: selectedDay, time: selectedTime } : null,
      outcome: result,
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 1 && (
          <>
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-base font-bold text-buyer-text">
                Dos solicitudes para el mismo horario
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-1 text-buyer-text-faint hover:bg-buyer-input-bg"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-3 text-xs text-buyer-text-muted">
              Elegí a quién confirmar y reagendá al resto.
            </p>
            <div className="mb-4 rounded-lg bg-buyer-input-bg px-3 py-2 text-xs font-medium text-buyer-text-muted">
              {propertyLabel} · {conflictDayLabel} · {a.slot.time} - {conflictEnd}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {group.map((candidate) => (
                <div key={candidate.id} className="rounded-lg border border-agent-border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-buyer-input-bg text-[11px] font-bold text-buyer-text-muted">
                      {initialsOf(candidate.buyerName)}
                    </div>
                    <p className="min-w-0 text-sm font-semibold leading-tight text-buyer-text">
                      {candidate.buyerName}
                    </p>
                  </div>
                  <div className="mb-2 flex items-center gap-1 text-[11px] text-buyer-text-muted">
                    <Phone size={11} />
                    <span className="truncate">{candidate.buyerPhone}</span>
                  </div>
                  <div className="mb-2 flex items-center gap-1 text-xs font-medium text-buyer-text">
                    <Clock size={12} />
                    {candidate.slot.time} - {minutesToTime(visitEndMinutes(candidate))}
                  </div>
                  <span className="mb-2 inline-block rounded-full bg-status-amber-bg px-2 py-0.5 text-[10px] font-bold text-status-amber-text">
                    Pendiente
                  </span>
                  <button
                    type="button"
                    onClick={() => handleConfirmCandidate(candidate)}
                    className="w-full rounded-control bg-accent py-2 text-xs font-bold text-black transition-transform hover:brightness-95"
                  >
                    Confirmar a este
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && toReschedule && (
          <>
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-base font-bold text-buyer-text">
                Reagendar visita de {toReschedule.buyerName}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-1 text-buyer-text-faint hover:bg-buyer-input-bg"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-4 text-xs text-buyer-text-muted">
              Proponé un nuevo horario para {propertyLabel}.
            </p>

            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
              Seleccioná día
            </p>
            <div className="mb-4 grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day.date);
                    setSelectedTime(null);
                  }}
                  className={cn(
                    "rounded-lg border py-1.5 text-center transition-colors",
                    selectedDay === day.date
                      ? "border-accent bg-accent text-black"
                      : "border-agent-border text-buyer-text hover:bg-buyer-input-bg"
                  )}
                >
                  <span className="block text-[9px] font-bold uppercase">{day.label}</span>
                  <span className="block text-xs font-bold">{day.dayNum}</span>
                </button>
              ))}
            </div>

            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
              Horarios disponibles
            </p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {RESCHEDULE_TIME_SLOTS.map((time) => {
                const taken = selectedDay ? isSlotTaken(allVisits, selectedDay, time, toReschedule.id) : false;
                const selected = selectedDay && selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={!selectedDay || taken}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                      selected
                        ? "border-accent bg-accent text-black"
                        : taken || !selectedDay
                          ? "cursor-not-allowed border-agent-border text-buyer-text-faint/50"
                          : "border-agent-border text-buyer-text hover:bg-buyer-input-bg"
                    )}
                  >
                    {time}
                  </button>
                );
              })}
            </div>

            {selectedDay && selectedTime && (
              <div className="mb-4 rounded-lg bg-buyer-input-bg px-3 py-2 text-xs font-semibold text-buyer-text">
                Propuesta elegida: {formatShortDate(selectedDay)} · {selectedTime} -{" "}
                {proposedEndTime(selectedTime)}
              </div>
            )}

            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
              Vista previa de mensaje
            </p>
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-buyer-input-bg p-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-success/20 text-emerald-700">
                <MessageCircle size={12} />
              </div>
              <p className="text-xs text-buyer-text">
                Hola {toReschedule.buyerName.split(" ")[0]}, para {propertyLabel} te proponemos
                cambiar tu visita
                {selectedDay && selectedTime
                  ? ` a ${formatShortDate(selectedDay)} ${selectedTime}`
                  : ""}
                . ¿Te sirve?
              </p>
            </div>

            <button
              type="button"
              disabled={!selectedDay || !selectedTime}
              onClick={handleSendProposal}
              className="flex w-full items-center justify-center gap-1.5 rounded-control bg-accent py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageCircle size={15} />
              Enviar propuesta por WhatsApp
            </button>
          </>
        )}

        {step === 3 && toReschedule && (
          <>
            <div className="mb-3 flex items-start justify-end">
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-1 text-buyer-text-faint hover:bg-buyer-input-bg"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mx-auto -mt-6 mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-status-success/15 text-emerald-700">
              <MessageCircle size={24} strokeWidth={1.75} />
            </div>
            <h2 className="mb-1.5 text-center text-base font-bold text-buyer-text">
              Propuesta enviada
            </h2>
            <p className="mb-3 text-center text-sm text-buyer-text-muted">
              Esperando la respuesta de {toReschedule.buyerName} sobre el{" "}
              {selectedDay ? formatShortDate(selectedDay) : ""}
              {selectedTime ? `, ${selectedTime}` : ""}.
            </p>
            {!outcome && (
              <div className="mb-4 flex justify-center">
                <span className="flex items-center gap-1 rounded-full bg-status-blue-bg px-2.5 py-1 text-[11px] font-bold text-status-blue">
                  <Clock size={11} />
                  Esperando respuesta
                </span>
              </div>
            )}

            <div className="mb-4 rounded-lg bg-buyer-input-bg p-3 text-xs">
              <p className="mb-1.5 font-semibold text-buyer-text">{propertyLabel}</p>
              <p className="text-buyer-text-faint line-through">
                {conflictDayLabel} · {a.slot.time} - {conflictEnd}
              </p>
              {selectedDay && selectedTime && (
                <p className="mt-1 flex items-center gap-1 font-semibold text-buyer-text">
                  ↓ {formatShortDate(selectedDay)} · {selectedTime} - {proposedEndTime(selectedTime)}
                  {outcome === "confirmed" && (
                    <CheckCircle2 size={13} className="text-emerald-600" />
                  )}
                </p>
              )}
            </div>

            {!outcome ? (
              <>
                <div className="mb-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleOutcome("confirmed")}
                    className="flex w-full items-center justify-center gap-1.5 rounded-control bg-accent py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95"
                  >
                    <CheckCircle2 size={15} /> {toReschedule.buyerName.split(" ")[0]} confirmó
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOutcome("rejected")}
                    className="flex w-full items-center justify-center gap-1.5 rounded-control border border-status-red py-2.5 text-sm font-bold text-status-red hover:bg-status-red-bg"
                  >
                    <X size={15} /> {toReschedule.buyerName.split(" ")[0]} rechazó
                  </button>
                </div>
                <button
                  type="button"
                  title="Próximamente"
                  className="mb-2 block w-full text-center text-xs font-medium text-buyer-text-faint underline"
                >
                  Reenviar por WhatsApp
                </button>
                <p className="text-center text-[11px] text-buyer-text-faint">
                  Si no hay respuesta en 24 horas, te lo recordaremos.
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-control bg-accent py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95"
              >
                Listo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
