import type { VisitRequest } from "@/types";

/**
 * Helpers puros para Agenda (frame `agent-agenda-screen` + "Flujo de
 * Resolución de Conflictos"). Igual que `property-status.ts`, todo lo
 * que se puede derivar de datos reales se deriva acá en vez de
 * guardarse como estado — ver TRACKING.md, sección "Rediseño 2026-08",
 * para el detalle.
 */

export const WEEKDAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"] as const;

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MONTH_NAMES_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export interface WeekDay {
  date: string; // ISO
  label: (typeof WEEKDAY_LABELS)[number];
  dayNum: number;
  isToday: boolean;
}

/**
 * Devuelve los 7 días (Lun→Dom) de la semana que contiene `refDate`,
 * más `weekOffset` semanas (para las flechas ‹ › de Agenda). `todayISO`
 * se compara aparte de `refDate` para poder marcar "Hoy" incluso cuando
 * se navegó a otra semana.
 */
export function getWeekDays(refDate: Date, weekOffset: number, todayISO: string): WeekDay[] {
  const d = new Date(refDate);
  const jsDay = d.getDay(); // 0=domingo … 6=sábado
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + mondayOffset + weekOffset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(day.getDate() + i);
    const iso = toISODate(day);
    return {
      date: iso,
      label: WEEKDAY_LABELS[i],
      dayNum: day.getDate(),
      isToday: iso === todayISO,
    };
  });
}

/** "11-17 Agosto 2026" a partir de los 7 WeekDay — usa mes/año del primer día salvo que la semana cruce de mes. */
export function formatWeekRangeLabel(days: WeekDay[]): string {
  const start = new Date(days[0].date);
  const end = new Date(days[6].date);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTH_NAMES_SHORT[start.getMonth()]} - ${end.getDate()} ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getFullYear()}`;
}

const WEEKDAY_SHORT_TITLE = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** "Mar 12 Ago" — usado en el paso 2/3 del flujo de conflictos. */
export function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const jsDay = d.getDay();
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return `${WEEKDAY_SHORT_TITLE[idx]} ${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`;
}

/**
 * Nombres cortos de propiedad sólo para Agenda (el frame real las
 * llamaba "Depto Palermo 3amb", "Casa Belgrano", etc. — más informales
 * que `Property.title`). No reemplazan el título real en ningún otro
 * lado de la app, es puramente un alias de visualización para esta
 * pantalla.
 */
export const AGENDA_SHORT_LABELS: Record<string, string> = {
  p25: "Depto Palermo 3amb",
  p29: "PH San Telmo",
  p31: "Casa Belgrano",
  p32: "Depto Recoleta",
  p34: "Loft Núñez",
};

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function visitDurationMinutes(visit: VisitRequest): number {
  return visit.slot.durationMinutes ?? 45;
}

export function visitEndMinutes(visit: VisitRequest): number {
  return timeToMinutes(visit.slot.time) + visitDurationMinutes(visit);
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function visitsOverlap(a: VisitRequest, b: VisitRequest): boolean {
  if (a.slot.date !== b.slot.date) return false;
  return rangesOverlap(
    timeToMinutes(a.slot.time),
    visitEndMinutes(a),
    timeToMinutes(b.slot.time),
    visitEndMinutes(b)
  );
}

/**
 * Agrupa las visitas que se superponen en horario (mismo agente, no
 * puede estar en dos lados a la vez) — sólo entre pendientes/aceptadas,
 * una cancelada no genera conflicto. Devuelve sólo los grupos con 2+
 * visitas (los conflictos reales). Es la función que dispara el "Flujo
 * de Resolución de Conflictos" sobre cualquier card superpuesta del
 * calendario, no sólo sobre el caso semilla de Ana García/Pedro Muñoz.
 */
export function findConflictGroups(visits: VisitRequest[]): VisitRequest[][] {
  const relevant = visits.filter((v) => v.status === "pendiente" || v.status === "aceptada");
  const groups: VisitRequest[][] = [];
  const assigned = new Set<string>();

  for (const visit of relevant) {
    if (assigned.has(visit.id)) continue;
    const group = [visit, ...relevant.filter((other) => other.id !== visit.id && visitsOverlap(visit, other))];
    if (group.length > 1) {
      group.forEach((v) => assigned.add(v.id));
      groups.push(group);
    }
  }
  return groups;
}

/**
 * Franjas horarias fijas que ofrece el paso 2 del flujo de conflictos
 * ("Reagendar visita de X") — copiadas del frame real. No hay un
 * sistema de disponibilidad configurable por propiedad todavía, así que
 * son las mismas 6 franjas para cualquier propiedad/día.
 */
export const RESCHEDULE_TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

/**
 * Asigna "carriles" horizontales a las visitas de UN día para que las
 * que se superponen en horario (el conflicto Ana García/Pedro Muñoz del
 * viernes, por ejemplo) se dibujen lado a lado en vez de exactamente
 * encima una de la otra — sin esto, la de más arriba en el DOM tapa a
 * la otra por completo y ni se ve ni se puede tocar. No es un algoritmo
 * general de layout de calendario (no fusiona transitivamente clusters
 * que se tocan por elementos intermedios en casos muy raros), pero
 * cubre bien el caso real de este mock (como mucho 2 visitas
 * superpuestas a la vez).
 */
export function assignLanes(
  dayVisits: VisitRequest[]
): Map<string, { lane: number; totalLanes: number }> {
  const items = dayVisits
    .map((v) => ({ id: v.id, start: timeToMinutes(v.slot.time), end: visitEndMinutes(v) }))
    .sort((x, y) => x.start - y.start);

  const clusters: (typeof items)[] = [];
  for (const item of items) {
    const cluster = clusters.find((c) => c.some((o) => o.start < item.end && item.start < o.end));
    if (cluster) cluster.push(item);
    else clusters.push([item]);
  }

  const result = new Map<string, { lane: number; totalLanes: number }>();
  for (const cluster of clusters) {
    const laneEnds: number[] = [];
    const laneOf = new Map<string, number>();
    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.end);
      } else {
        laneEnds[lane] = item.end;
      }
      laneOf.set(item.id, lane);
    }
    const totalLanes = Math.max(1, laneEnds.length);
    cluster.forEach((item) => result.set(item.id, { lane: laneOf.get(item.id)!, totalLanes }));
  }
  return result;
}

/** Duración fija de una visita reagendada desde el flujo de conflictos. */
export const RESCHEDULED_VISIT_DURATION_MINUTES = 30;

/**
 * Una franja está ocupada si se solaparía de verdad con otra visita del
 * agente ese día (no cancelada, sin contar la que se está reagendando)
 * — chequeo de rango completo, no sólo de arranque exacto. Se probó
 * primero con "arranca exactamente a esa hora" (más simple), pero eso
 * permitía reagendar una visita justo encima de otra ya confirmada ese
 * mismo día (ej. mover a alguien a las 09:30 cuando ya hay una visita de
 * 09:00-09:45 ese día) — el flujo de conflictos terminaba creando un
 * conflicto nuevo en el mismo paso en el que se suponía que resolvía
 * uno. Se cambió a solapamiento real; como consecuencia, las franjas
 * deshabilitadas ya no coinciden 1 a 1 con las del frame de referencia
 * (que en sí mismo era inconsistente: bloqueaba 09:00 pero dejaba
 * libre 09:30 pese a una visita de 09:00-09:45 ese día) — se priorizó
 * que la herramienta no permita crear conflictos nuevos por encima de
 * calcar exactamente esos dos píxeles.
 */
export function isSlotTaken(
  visits: VisitRequest[],
  date: string,
  time: string,
  excludeVisitId: string
): boolean {
  const candidateStart = timeToMinutes(time);
  const candidateEnd = candidateStart + RESCHEDULED_VISIT_DURATION_MINUTES;
  return visits.some(
    (v) =>
      v.id !== excludeVisitId &&
      v.status !== "cancelada" &&
      v.slot.date === date &&
      rangesOverlap(candidateStart, candidateEnd, timeToMinutes(v.slot.time), visitEndMinutes(v))
  );
}
