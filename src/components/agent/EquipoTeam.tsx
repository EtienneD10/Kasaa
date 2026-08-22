"use client";

import { useMemo, useState } from "react";
import {
  RefreshCw,
  Users,
  Award,
  CalendarDays,
  BarChart3,
  X,
  UserPlus,
  Building2,
  Search,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockAgentDashboardStats,
  mockLeads,
  mockTeamMembers,
  mockTeamStats,
  UNASSIGNED_AGENT_ID,
} from "@/lib/mock-data";
import type { Agent } from "@/types";

/**
 * "Tu equipo" (frame real `equipo-team`) — tabla de miembros de la
 * agencia + panel de detalle/permisos del agente seleccionado. Misma
 * referencia de baja resolución que `PipelineKanban` (ver el comentario
 * de ese componente) — la estructura general se pudo confirmar bien con
 * zoom, el texto fino de algunas celdas no.
 *
 * - La fila de arriba ("N agentes activos · N leads sin asignar · N
 *   visitas · N% respuesta promedio") se calcula de verdad:
 *   `mockTeamMembers.length`, el conteo real de leads con
 *   `assignedAgentId === UNASSIGNED_AGENT_ID`, `mockAgentDashboardStats.
 *   visitasDelMes` (mismo dato que el Dashboard Home) y el promedio real
 *   de `responseRateWithin2h` de los 4 miembros — ninguno es una
 *   constante copiada a mano.
 * - El banner amarillo es descartable de verdad (estado local
 *   `showBanner`) — "Ver y asignar" queda decorativo (no hay pantalla de
 *   asignación de leads todavía).
 * - Columnas "Prop. Act." y "Leads" de la tabla: constantes ilustrativas
 *   por fila (`mockTeamStats`), ver el comentario en `mock-data.ts` sobre
 *   la inconsistencia conocida con `dashboard-home` para la fila de
 *   María Rodríguez. "Respuesta %" sí sale de verdad de
 *   `agent.responseRateWithin2h`.
 * - Click en una fila selecciona ese agente en el panel derecho (estado
 *   local `selectedId`, default el 2º miembro — "Carlos Martínez" — tal
 *   cual estaba seleccionado en la referencia).
 * - Los 3 toggles de "Permisos y Roles" reflejan `agent.permissions` del
 *   agente seleccionado pero son de solo lectura (no hay backend para
 *   persistir cambios de permisos todavía) — decorativos con
 *   `title="Próximamente"`, mismo criterio que el resto de la app.
 * - "Asignar lead"/"Asignar propiedad", el buscador de esa sección y
 *   "Desactivar Agente" quedan decorativos por el mismo motivo.
 */

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function deriveEmail(name: string) {
  return `${name.split(" ")[0].toLowerCase()}@kasaa.com`;
}

function PermissionToggle({ label, description, on }: { label: string; description: string; on: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-buyer-text">{label}</p>
        <p className="mt-0.5 text-xs text-buyer-text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        title="Próximamente"
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-pill transition-colors",
          on ? "bg-status-success" : "bg-buyer-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            on ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function EquipoTeam() {
  const [showBanner, setShowBanner] = useState(true);
  const [selectedId, setSelectedId] = useState(mockTeamMembers[1]?.id ?? mockTeamMembers[0]?.id);

  const unassignedCount = useMemo(
    () => mockLeads.filter((l) => l.assignedAgentId === UNASSIGNED_AGENT_ID).length,
    []
  );

  const avgResponseRate = useMemo(() => {
    const rates = mockTeamMembers
      .map((a) => a.responseRateWithin2h)
      .filter((r): r is number => typeof r === "number");
    if (rates.length === 0) return 0;
    return Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length);
  }, []);

  const selectedAgent: Agent | undefined =
    mockTeamMembers.find((a) => a.id === selectedId) ?? mockTeamMembers[0];

  return (
    <div className="flex-1 overflow-y-auto bg-agent-bg">
      <header className="flex items-center justify-between border-b border-agent-border bg-white px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-buyer-text">Tu equipo</h1>
          <p className="mt-0.5 text-sm text-buyer-text-muted">
            Administrá los miembros de tu agencia, sus permisos y rendimiento de venta.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Próximamente: Invitar agente"
            className="flex items-center gap-1.5 rounded-control bg-accent px-4 py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95"
          >
            <UserPlus size={16} /> Invitar agente
          </button>
          <button
            type="button"
            title="Próximamente: Actualizar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-buyer-text-muted hover:bg-agent-bg"
          >
            <RefreshCw size={16} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <main className="px-8 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-card border border-agent-border bg-white px-4 py-3 text-sm text-buyer-text-muted">
          <span className="flex items-center gap-1.5">
            <Users size={14} strokeWidth={1.75} /> {mockTeamMembers.length} agentes activos
          </span>
          <span className="text-buyer-text-faint">·</span>
          <span className="flex items-center gap-1.5 text-status-amber-text">
            <Award size={14} strokeWidth={1.75} /> {unassignedCount} leads sin asignar
          </span>
          <span className="text-buyer-text-faint">·</span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} strokeWidth={1.75} /> {mockAgentDashboardStats.visitasDelMes}{" "}
            visitas
          </span>
          <span className="text-buyer-text-faint">·</span>
          <span className="flex items-center gap-1.5">
            <BarChart3 size={14} strokeWidth={1.75} /> {avgResponseRate}% respuesta promedio
          </span>
        </div>

        {showBanner && unassignedCount > 0 && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-card border border-status-amber/30 bg-status-amber-bg/60 px-4 py-3">
            <span className="text-sm font-semibold text-status-amber-text">
              Tenés {unassignedCount} leads sin asignar
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                title="Próximamente"
                className="text-sm font-bold text-status-amber-text underline"
              >
                Ver y asignar →
              </button>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => setShowBanner(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-status-amber-text hover:bg-white/50"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-buyer-text-faint">
              Miembros de la agencia ({mockTeamMembers.length})
            </h2>
            <div className="overflow-hidden rounded-card border border-agent-border bg-white">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 border-b border-agent-border bg-buyer-bg px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-buyer-text-faint">
                <span>Agente</span>
                <span>Rol</span>
                <span>Prop. Act.</span>
                <span>Leads</span>
                <span>Respuesta</span>
              </div>
              {mockTeamMembers.map((agent) => {
                const stats = mockTeamStats[agent.id];
                const active = agent.id === selectedAgent?.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedId(agent.id)}
                    className={cn(
                      "grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 border-b border-agent-border px-4 py-3 text-left text-sm last:border-b-0",
                      active ? "bg-status-success/10" : "hover:bg-buyer-bg"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-buyer-input-bg">
                        {agent.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={agent.avatarUrl}
                            alt={agent.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-buyer-text-muted">
                            {initialsOf(agent.name)}
                          </div>
                        )}
                      </div>
                      <span className="min-w-0 truncate">
                        <span className="block truncate font-semibold text-buyer-text">
                          {agent.name}
                        </span>
                        <span className="block truncate text-xs text-buyer-text-faint">
                          {deriveEmail(agent.name)}
                        </span>
                      </span>
                    </span>
                    <span>
                      <span
                        className={cn(
                          "rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase",
                          agent.role === "admin"
                            ? "bg-status-blue-bg text-status-blue"
                            : "bg-buyer-input-bg text-buyer-text-muted"
                        )}
                      >
                        {agent.role === "admin" ? "Admin" : "Agente"}
                      </span>
                    </span>
                    <span className="text-buyer-text">{stats?.propiedadesActivas ?? 0}</span>
                    <span className="text-buyer-text">{stats?.leads ?? 0}</span>
                    <span className="font-semibold text-emerald-700">
                      {agent.responseRateWithin2h ?? 0}%
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedAgent && (
            <section className="h-fit rounded-card border border-agent-border bg-white p-4">
              <div className="mb-4 flex items-center gap-3 border-b border-agent-border pb-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-buyer-input-bg">
                  {selectedAgent.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedAgent.avatarUrl}
                      alt={selectedAgent.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-buyer-text-muted">
                      {initialsOf(selectedAgent.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-buyer-text">
                    {selectedAgent.name}
                  </p>
                  <p className="truncate text-xs text-buyer-text-faint">
                    {deriveEmail(selectedAgent.name)}
                  </p>
                  <span className="mt-1 inline-block rounded-pill bg-status-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                    Agente Activo
                  </span>
                </div>
              </div>

              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-buyer-text-faint">
                Permisos y Roles
              </h3>
              <div className="divide-y divide-agent-border">
                <PermissionToggle
                  label="Gestionar propiedades"
                  description="Crear, editar y eliminar publicaciones de la agencia."
                  on={!!selectedAgent.permissions?.gestionarPropiedades}
                />
                <PermissionToggle
                  label="Ver pipeline completo"
                  description="Acceso a todos los leads y clientes de todos los agentes."
                  on={!!selectedAgent.permissions?.verPipelineCompleto}
                />
                <PermissionToggle
                  label="Invitar otros agentes"
                  description="Permite enviar invitaciones a nuevos agentes de la agencia."
                  on={!!selectedAgent.permissions?.invitarAgentes}
                />
              </div>

              <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-buyer-text-faint">
                Asignaciones
              </h3>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  title="Próximamente"
                  className="flex items-center justify-center gap-1.5 rounded-control border border-agent-border py-2 text-xs font-semibold text-buyer-text"
                >
                  <UserPlus size={13} /> Asignar lead
                </button>
                <button
                  type="button"
                  title="Próximamente"
                  className="flex items-center justify-center gap-1.5 rounded-control border border-agent-border py-2 text-xs font-semibold text-buyer-text"
                >
                  <Building2 size={13} /> Asignar propiedad
                </button>
              </div>
              <label className="mb-4 flex items-center gap-2 rounded-control border border-agent-border px-3 py-2 text-xs text-buyer-text-faint">
                <Search size={13} className="shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar lead o propiedad..."
                  className="w-full bg-transparent outline-none placeholder:text-buyer-text-faint"
                />
                <ChevronDown size={13} className="shrink-0" />
              </label>

              <button
                type="button"
                title="Próximamente"
                className="w-full rounded-control border border-status-red py-2.5 text-sm font-bold text-status-red hover:bg-status-red-bg"
              >
                Desactivar Agente
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
