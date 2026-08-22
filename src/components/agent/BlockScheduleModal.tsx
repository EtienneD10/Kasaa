"use client";

import { useState } from "react";
import { Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeekDay } from "@/lib/agenda";

const HOUR_OPTIONS = Array.from({ length: 23 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

/**
 * Modal del botón "Bloquear horario" del header de Agenda — marca un
 * hueco como no disponible (mismo tipo `BlockedSlot` que la semilla
 * "No dispon..." del jueves). Acción real: agrega el bloqueo al estado
 * de `AgentAgenda`, que lo renderiza en el calendario con el mismo
 * estilo (borde punteado + candado) y un botón "×" para sacarlo.
 */
export function BlockScheduleModal({
  weekDays,
  onClose,
  onBlock,
}: {
  weekDays: WeekDay[];
  onClose: () => void;
  onBlock: (date: string, startTime: string, endTime: string, reason: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string>(weekDays.find((d) => d.isToday)?.date ?? weekDays[0].date);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");

  const invalid = startTime >= endTime;

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
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-buyer-input-bg text-buyer-text-muted">
              <Lock size={16} strokeWidth={1.75} />
            </div>
            <h2 className="text-base font-bold text-buyer-text">Bloquear horario</h2>
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

        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
          Día
        </p>
        <div className="mb-4 grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDay(day.date)}
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

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
              Desde
            </span>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-agent-border px-2.5 py-2 text-sm text-buyer-text"
            >
              {HOUR_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
              Hasta
            </span>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-agent-border px-2.5 py-2 text-sm text-buyer-text"
            >
              {HOUR_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-buyer-text-faint">
            Motivo (opcional)
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Almuerzo, trámite personal..."
            className="w-full rounded-lg border border-agent-border px-2.5 py-2 text-sm text-buyer-text outline-none placeholder:text-buyer-text-faint"
          />
        </label>

        {invalid && (
          <p className="mb-3 text-xs font-medium text-status-red">
            El horario de inicio tiene que ser antes que el de fin.
          </p>
        )}

        <button
          type="button"
          disabled={invalid}
          onClick={() => onBlock(selectedDay, startTime, endTime, reason || "No disponible")}
          className="w-full rounded-control bg-accent py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Bloquear horario
        </button>
      </div>
    </div>
  );
}
