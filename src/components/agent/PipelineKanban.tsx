"use client";

import { useMemo, useState } from "react";
import { RefreshCw, ChevronDown, MessageCircle, MoreHorizontal, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { mockLeads, mockPropertyById } from "@/lib/mock-data";
import type { Lead, LeadStage } from "@/types";

/**
 * Pipeline de Leads (frame real `pipeline-kanban`) — Kanban de 6 columnas,
 * una por `LeadStage`. El frame de referencia llegó en muy baja
 * resolución (774×300 el compuesto completo con `equipo-team`, ~387×300
 * por pantalla) — bastante más chico que las referencias anteriores de
 * esta sesión — así que el texto exacto de las tarjetas (nombres,
 * "hace X", el pill ámbar) se leyó zoomeando al máximo pero con baja
 * confianza en el detalle fino; la estructura (columnas, colores,
 * layout de tarjeta) sí se pudo confirmar bien. Detalle de decisiones:
 *
 * - Las 6 columnas son `nuevo_lead` → `contactado` → `visita_agendada` →
 *   `visita_realizada` → `negociacion` → `cerrado_ganado` (el frame solo
 *   muestra UNA columna "Cerrado", no separa ganado/perdido — se usa
 *   `cerrado_ganado` para los leads cerrados del mock, `cerrado_perdido`
 *   queda soportado por el tipo pero sin leads todavía).
 * - Franja de color superior de cada columna: azul (Nuevo Lead/
 *   Contactado), ámbar (Visita Agendada/Visita Realizada), verde
 *   (Negociación/Cerrado) — confirmado con zoom.
 * - El badge de conteo por columna se cuenta de verdad
 *   (`leads.filter(...).length`), no está copiado a mano de la
 *   referencia (los dígitos ahí eran ilegibles a esta resolución).
 * - "Hace X" de cada tarjeta se calcula desde `lastActivityAt` con
 *   granularidad de DÍA (Hoy/Ayer/Hace N días) — el mock no tiene
 *   timestamps con hora, a diferencia de lo que parecía decir la
 *   referencia ("hace 2 horas"); mismo criterio que el resto de
 *   `mock-data.ts` (`createdAt`/`lastUpdatedAt` tampoco tienen hora).
 * - El pill ámbar ("Alto interés") se muestra para los leads con
 *   `highIntent: true` — el texto exacto del pill en la referencia era
 *   ilegible a este tamaño, se usó una etiqueta razonable.
 * - El ícono verde de cada tarjeta es un botón de WhatsApp decorativo
 *   (`title="Próximamente"`) — la integración real de WhatsApp está en
 *   la lista de pendientes de TRACKING.md, no se adelantó acá. El botón
 *   "⋯" al lado es "más opciones", también decorativo.
 * - Buscador de texto (por nombre) SÍ filtra de verdad; los 2 selects
 *   "Propiedad"/"Agente" y el botón "+ Nuevo Lead" quedan decorativos.
 * - Sin drag-and-drop entre columnas — no hay pedido de reordenar leads
 *   todavía y el frame no alcanza a mostrar esa interacción.
 */

const STAGE_COLUMNS: { stage: LeadStage; label: string; bar: string }[] = [
  { stage: "nuevo_lead", label: "Nuevo Lead", bar: "bg-status-blue" },
  { stage: "contactado", label: "Contactado", bar: "bg-status-blue" },
  { stage: "visita_agendada", label: "Visita Agendada", bar: "bg-status-amber" },
  { stage: "visita_realizada", label: "Visita Realizada", bar: "bg-status-amber" },
  { stage: "negociacion", label: "Negociación", bar: "bg-status-success" },
  { stage: "cerrado_ganado", label: "Cerrado", bar: "bg-status-success" },
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeDay(iso: string) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

function LeadCard({ lead }: { lead: Lead }) {
  const property = mockPropertyById.get(lead.propertyId);

  return (
    <div className="rounded-card border border-agent-border bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-buyer-text/90 text-[11px] font-bold text-white">
          {initialsOf(lead.buyerName)}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-buyer-text">
          {lead.buyerName}
        </p>
        <button
          type="button"
          title="Próximamente: Contactar por WhatsApp"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-status-success/15 text-emerald-700"
        >
          <MessageCircle size={13} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Próximamente"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-buyer-text-faint hover:bg-buyer-bg"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {property && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-buyer-bg p-1.5">
          <div className="h-7 w-7 shrink-0 overflow-hidden rounded bg-buyer-input-bg">
            {property.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={property.photos[0]}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-buyer-text-faint">
                <ImageOff size={12} strokeWidth={1.5} />
              </div>
            )}
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-buyer-text-muted">{property.title}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-buyer-text-faint">{relativeDay(lead.lastActivityAt)}</span>
        {lead.highIntent && (
          <span className="rounded-pill bg-status-amber-bg px-2 py-0.5 text-[10px] font-bold text-status-amber-text">
            ALTO INTERÉS
          </span>
        )}
      </div>
    </div>
  );
}

export function PipelineKanban() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // Cartera de agt-4 (la agente logueada) — los leads sin agente
  // (`UNASSIGNED_AGENT_ID`) no aparecen acá, solo en el contador de
  // "Equipo".
  const myLeads = useMemo(
    () => mockLeads.filter((l) => l.assignedAgentId === "agt-4"),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myLeads;
    return myLeads.filter((l) => l.buyerName.toLowerCase().includes(q));
  }, [myLeads, search]);

  return (
    <div className="flex-1 overflow-y-auto bg-agent-bg">
      <header className="flex items-center justify-between border-b border-agent-border bg-white px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-buyer-text">
            Pipeline de Leads
          </h1>
          <p className="mt-0.5 text-sm text-buyer-text-muted">
            Seguimiento de leads desde el primer contacto hasta el cierre de la operación.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Próximamente: Actualizar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-buyer-text-muted hover:bg-agent-bg"
          >
            <RefreshCw size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            title="Próximamente"
            className="flex items-center gap-2 rounded-control border border-agent-border px-3 py-2 text-sm font-semibold text-buyer-text"
          >
            {user?.name}
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      <main className="px-8 py-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lead..."
            className="w-56 rounded-control border border-agent-border bg-white px-3.5 py-2 text-sm outline-none placeholder:text-buyer-text-faint"
          />
          <button
            type="button"
            title="Próximamente"
            className="flex items-center gap-1.5 rounded-control border border-agent-border bg-white px-3.5 py-2 text-sm font-medium text-buyer-text-muted"
          >
            Propiedad <ChevronDown size={14} />
          </button>
          <button
            type="button"
            title="Próximamente"
            className="flex items-center gap-1.5 rounded-control border border-agent-border bg-white px-3.5 py-2 text-sm font-medium text-buyer-text-muted"
          >
            Agente <ChevronDown size={14} />
          </button>
          <button
            type="button"
            title="Próximamente: Nuevo Lead"
            className="ml-auto rounded-control bg-accent px-4 py-2 text-sm font-bold text-black transition-transform hover:brightness-95"
          >
            + Nuevo Lead
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {STAGE_COLUMNS.map((col) => {
            const leads = filtered.filter((l) => l.stage === col.stage);
            return (
              <div key={col.stage} className="w-72 shrink-0">
                <div className={cn("mb-2 h-1 rounded-pill", col.bar)} />
                <div className="mb-3 flex items-center justify-between px-0.5">
                  <span className="text-xs font-bold text-buyer-text">{col.label}</span>
                  <span className="text-xs font-semibold text-buyer-text-faint">
                    {leads.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {leads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
