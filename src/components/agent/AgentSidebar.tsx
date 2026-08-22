"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  LayoutGrid,
  Home,
  Calendar,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  mockAgentAttentionItems,
  mockAgentDashboardStats,
  mockAgentTodayVisits,
} from "@/lib/mock-data";

/**
 * Sidebar del panel de agente — reconstruido a partir del frame real
 * `dashboard-home`. Es una superficie completamente distinta del Header
 * comprador (dark utility vs. light editorial, spec §7), así que no
 * comparte componente con `Header`.
 *
 * El wordmark acá es TODO BLANCO (sin la "k" verde) + un tag "AGENTES"
 * aparte — distinto de `Logo` (que sí mantiene la "k" verde incluso en
 * su variante `dark`). Se probó primero con `Logo`, pero el frame real
 * de este sidebar específicamente no tiene la "k" en verde, así que acá
 * se renderiza texto plano en vez de reusar ese componente.
 *
 * "Dashboard", "Propiedades", "Agenda", "Pipeline" y "Equipo" navegan de
 * verdad (únicas pantallas construidas del panel de agente todavía) —
 * el resto de los ítems (Marketing, Configuración) quedan con
 * `title="Próximamente"`, mismo criterio que el resto de la app para
 * secciones sin pantalla propia (ver TRACKING.md, "Panel de agente —
 * pendiente").
 *
 * Los badges de color (azul/naranja/verde) son counts derivados de datos
 * reales del mock (no inventados a mano): Dashboard = alertas críticas,
 * Agenda = visitas de hoy pendientes de confirmar, Pipeline = leads
 * nuevos. El de Propiedades (crema, "12") sí matchea 1:1 el mismo número
 * que la stat card "Propiedades Activas". Los dígitos exactos de la
 * referencia eran ilegibles a esta resolución — se documentó en
 * TRACKING.md.
 */
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/agente", icon: LayoutGrid },
  { key: "propiedades", label: "Propiedades", href: "/agente/propiedades", icon: Home },
  { key: "agenda", label: "Agenda", href: "/agente/agenda", icon: Calendar },
  { key: "pipeline", label: "Pipeline", href: "/agente/pipeline", icon: Users },
  { key: "equipo", label: "Equipo", href: "/agente/equipo", icon: UserCog },
  { key: "marketing", label: "Marketing", href: null, icon: BarChart3 },
  { key: "configuracion", label: "Configuración", href: null, icon: Settings },
] as const;

export function AgentSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const criticalAlerts = mockAgentAttentionItems.filter((a) => a.severity === "critico").length;
  const pendingVisitsToday = mockAgentTodayVisits.filter((v) => v.status === "pendiente").length;

  const initials = user?.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-agent-sidebar px-3 py-5">
      <div className="mb-5 flex items-center gap-2 px-2">
        <span className="text-xl font-bold tracking-tight text-white">kasaa</span>
        <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
          Agentes
        </span>
      </div>

      <label className="mb-4 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white/40">
        <Search size={15} className="shrink-0" />
        <input
          type="text"
          placeholder="Buscar propiedad, agente..."
          className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
        />
        <kbd className="shrink-0 rounded border border-white/10 px-1 text-[9px] text-white/30">
          ⌘K
        </kbd>
      </label>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href !== null && pathname === item.href;
          const badge =
            item.key === "dashboard"
              ? criticalAlerts
              : item.key === "propiedades"
                ? mockAgentDashboardStats.propiedadesActivas
                : item.key === "agenda"
                  ? pendingVisitsToday
                  : item.key === "pipeline"
                    ? mockAgentDashboardStats.leadsNuevos
                    : undefined;

          const content = (
            <>
              <Icon
                size={17}
                strokeWidth={1.75}
                className={active ? "text-accent" : "text-white/60"}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {badge !== undefined && badge > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    item.key === "propiedades"
                      ? "bg-white text-buyer-text"
                      : item.key === "agenda"
                        ? "bg-status-amber text-white"
                        : item.key === "pipeline"
                          ? "bg-status-success text-black"
                          : "bg-status-blue text-white"
                  )}
                >
                  {badge}
                </span>
              )}
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-agent-sidebar-active text-white" : "text-white/70 hover:bg-white/5"
                )}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              title="Próximamente"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5"
            >
              {content}
            </button>
          );
        })}
      </nav>

      <button
        title="Próximamente: Editor de propiedad"
        className="mb-4 flex items-center justify-center gap-1.5 rounded-lg bg-accent py-3 text-sm font-bold text-black transition-transform hover:brightness-95"
      >
        <Plus size={16} /> Nueva Propiedad
      </button>

      <div className="flex items-center gap-2.5 border-t border-white/10 px-2 pt-4">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-white/40">{user?.agency}</p>
        </div>
      </div>
    </aside>
  );
}
