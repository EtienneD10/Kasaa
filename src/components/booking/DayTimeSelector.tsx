"use client";

import { cn } from "@/lib/utils";
import type { AvailabilitySlot } from "@/types";

/**
 * Selector de día/hora reutilizado en: booking del comprador (tarjeta,
 * feed inmersivo), Agenda del agente, reagendado, resolución de
 * conflictos, y Marketing (programar publicación).
 * Ver kasaa-spec-completa.md §1.5 y §7.
 *
 * Controlado desde afuera (sin botón de confirmar propio) — el estilo y
 * el botón de acción final varían según quién lo use (PropertyCard tiene
 * "Ver en 3D" + "Solicitar Visita" lado a lado, la Agenda del agente tiene
 * otra cosa), así que este componente solo resuelve la grilla de chips.
 *
 * El pill "HOY" y el horario seleccionado usan `accent-soft` (verde
 * pastel #74fa79), no el accent neón — confirmado contra el frame real
 * "Estados de Booking", ver TRACKING.md. El borde+fondo del día
 * seleccionado sigue siendo `accent`/`accent-tint`, sin cambios.
 *
 * La fila de días muestra siempre 4 días CONSECUTIVOS a partir de hoy
 * (hoy, hoy+1, hoy+2, hoy+3) — no los días sueltos que traiga
 * `availability` del mock. Antes se derivaban los chips directo de
 * `Set(slots.map(s => s.date))`, así que una propiedad con
 * `availabilityDays: [2, 5]` (offsets no contiguos) mostraba solo 2
 * chips salteados en vez de un rango fijo, y una con `[]` no mostraba
 * ningún día. Si un día de los 4 no tiene horarios en el mock, se ve
 * igual (chip clickeable) y al seleccionarlo aparece el mensaje "Sin
 * horarios disponibles este día" que ya existía más abajo.
 */
const VISIBLE_DAYS = 4;
interface DayTimeSelectorProps {
  slots: AvailabilitySlot[];
  selectedDate: string | null;
  selectedTime: string | null;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  className?: string;
}

const DAY_LABELS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export function DayTimeSelector({
  slots,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  className,
}: DayTimeSelectorProps) {
  const timesForDate = slots.filter((s) => s.date === selectedDate);
  const today = new Date().toISOString().split("T")[0];
  const visibleDays = Array.from({ length: VISIBLE_DAYS }, (_, offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2 overflow-x-auto">
        {visibleDays.map((date) => {
          const d = new Date(date);
          const isToday = date === today;
          const isFeatured = slots.some((s) => s.date === date && s.isFeatured);
          const selected = date === selectedDate;
          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex min-w-[64px] flex-1 flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition-colors",
                selected
                  ? "border-2 border-accent bg-accent-tint"
                  : "border-buyer-border bg-white hover:border-buyer-text"
              )}
            >
              <span className="text-[10px] font-medium text-buyer-text-faint">
                {DAY_LABELS[d.getDay()]}
              </span>
              <span className="text-lg font-bold leading-none text-buyer-text">
                {d.getDate()}
              </span>
              {isToday && (
                <span className="mt-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-black">
                  HOY
                </span>
              )}
              {isFeatured && !isToday && (
                <span className="mt-0.5 text-[9px] font-semibold text-accent">
                  ★ Recom.
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="flex flex-wrap gap-2">
          {timesForDate.map((slot) => (
            <button
              key={slot.time}
              onClick={() => onSelectTime(slot.time)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                selectedTime === slot.time
                  ? "border-accent-soft bg-accent-soft font-bold text-black"
                  : "border-buyer-border bg-white text-buyer-text hover:border-buyer-text"
              )}
            >
              {slot.time}
            </button>
          ))}
          {timesForDate.length === 0 && (
            <p className="text-xs italic text-buyer-text-faint">
              Sin horarios disponibles este día
            </p>
          )}
        </div>
      )}
    </div>
  );
}
