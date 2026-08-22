"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Home,
  CalendarDays,
  Users,
  BarChart3,
  Clock,
  FileWarning,
  CalendarCheck,
  ImageOff,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { AccountDropdown } from "@/components/account/AccountDropdown";
import { AccountSettingsPanel } from "@/components/account/AccountSettingsPanel";
import {
  mockAgentAttentionItems,
  mockAgentDashboardStats,
  mockAgentTodayVisits,
  mockPropertyById,
  mockProperties,
} from "@/lib/mock-data";
import { getListingStatus } from "@/lib/property-status";
import type { AgentAttentionItem, Property, VisitStatus } from "@/types";

/**
 * Dashboard Home del panel de agente (frame real `dashboard-home`) —
 * contenido principal a la derecha de `AgentSidebar`. Decisiones tomadas
 * al reconstruirlo, todas documentadas también en TRACKING.md:
 *
 * - El toggle "Mi actividad" / "Todo el equipo": solo "Mi actividad" es
 *   real (cambia un estado local que no afecta los datos, porque el mock
 *   solo tiene un agente logueado — no hay "equipo" que filtrar todavía).
 *   "Todo el equipo" queda decorativo (`title="Próximamente"`), mismo
 *   criterio del resto de la app.
 * - La campanita de notificaciones es decorativa — no existe Centro de
 *   Notificaciones para agentes todavía (ver TRACKING.md).
 * - Los 4 iconos de las StatCards usan los 4 tokens semánticos que ya
 *   existen (success/amber/blue + un 4° en verde) — el archivo de
 *   referencia insinúa un 4° color distinto (violeta) para "Leads
 *   Activos", pero no hay token violeta en el sistema (`globals.css` solo
 *   define success/amber/red/blue para la superficie de agente), así que
 *   se usa azul ahí en su lugar en vez de inventar un token nuevo sin
 *   validar contra más pantallas.
 * - "Tasa de Respuesta" se deriva de verdad de `agt-4.responseRateWithin2h`
 *   (vía `mockPropertyById.get("p25")!.agent`, ya que agt-4 no se exporta
 *   directo desde mock-data.ts) — no es una constante suelta.
 * - Catálogo Activo muestra exactamente p25/p26/p27 (no las 5 propiedades
 *   de agt-4) y Timeline del Día exactamente avr-1..avr-4, tal cual el
 *   frame real — `avr-5` (Pedro Muñoz) no aparece acá, solo dispara la
 *   alerta crítica de "Atención Requerida".
 * - OJO: la fila de Pedro Gómez (17:00, `cancelada`) usa el mismo verde
 *   que "CONFIRMADA" en el frame real — se confirmó con zoom que no es
 *   error de sampleo. Se replica tal cual acá por fidelidad pixel-a-pixel,
 *   pero probablemente sea un descuido del archivo de Figma (avisado al
 *   usuario en el reporte de esta tarea).
 * - Los botones de aceptar/rechazar de la fila `pendiente` (Gastón Pérez)
 *   son decorativos (`title="Próximamente"`) — el ícono de "rechazar" es
 *   una interpretación de baja confianza del ícono ambiguo de la
 *   referencia (ver TRACKING.md).
 * - ACTUALIZACIÓN (frames reales `propiedades-table-view` /
 *   `confirm-listing-modal`): el badge del Catálogo Activo ahora usa
 *   `getListingStatus()` (`lib/property-status.ts`, regla de 20 días)
 *   en vez de leer `p.status` directo — p25 pasó a mostrar "Pendiente de
 *   confirmación" en vez de "En venta" como consecuencia real de esa
 *   regla (antes tenía `updatedDaysAgo: -3`, ahora `-20` a propósito para
 *   demostrarla). El CTA "Confirmar vigencia" de la alerta "att-2" ahora
 *   es un link real a `/agente/propiedades?confirmar=<id>` (la primera
 *   propiedad pendiente), y su título/cuerpo se recalculan con el
 *   conteo real de propiedades pendientes en vez del texto fijo del
 *   mock. Ver TRACKING.md para el detalle completo.
 */

const ATTENTION_ICONS: Record<AgentAttentionItem["icon"], typeof Clock> = {
  reloj: Clock,
  publicaciones: FileWarning,
  visita: CalendarCheck,
  fotos: ImageOff,
};

const SEVERITY_STYLES: Record<
  AgentAttentionItem["severity"],
  { card: string; iconBg: string; cta: string }
> = {
  critico: {
    card: "border-status-red/25 bg-status-red-bg/40",
    iconBg: "bg-status-red text-white",
    cta: "bg-status-red text-white hover:brightness-95",
  },
  atencion: {
    card: "border-status-amber/25 bg-status-amber-bg/50",
    iconBg: "bg-status-amber text-white",
    cta: "border border-status-amber text-status-amber-text hover:bg-status-amber-bg",
  },
  info: {
    card: "border-status-blue/25 bg-status-blue-bg/50",
    iconBg: "bg-status-blue text-white",
    cta: "border border-status-blue text-status-blue hover:bg-status-blue-bg",
  },
};

const CATALOG_STATUS_STYLES: Partial<Record<Property["status"], { label: string; className: string }>> = {
  publicada: { label: "EN VENTA", className: "bg-status-success/15 text-emerald-700" },
  borrador: { label: "BORRADOR", className: "bg-buyer-input-bg text-buyer-text-muted" },
  vencida: { label: "VENCIDA", className: "bg-status-red-bg text-status-red" },
  // Ver `lib/property-status.ts` — regla de 20 días (spec §5.4, frames
  // reales `propiedades-table-view` / `confirm-listing-modal`). Mismos
  // colores que usa la tabla completa de "Propiedades" para el mismo
  // estado, para que el catálogo del Dashboard y esa pantalla se vean
  // consistentes.
  pendiente_confirmacion: {
    label: "PENDIENTE DE CONFIRMACIÓN",
    className: "bg-status-amber-bg text-status-amber-text",
  },
  pausada: { label: "PAUSADA", className: "bg-status-amber-bg text-status-amber-text" },
};

const TYPE_LABELS: Record<Property["type"], string> = {
  departamento: "DEPARTAMENTO",
  piso: "PISO",
  casa: "CASA",
  atico: "ÁTICO",
  estudio: "ESTUDIO",
  finca_rustica: "FINCA RÚSTICA",
  chalet: "CHALET",
  local: "LOCAL",
  oficina: "OFICINA",
  ph: "PH",
  otro: "OTRO",
};

const TIMELINE_STATUS_STYLES: Partial<Record<VisitStatus, { label: string; className: string }>> = {
  aceptada: { label: "CONFIRMADA", className: "bg-status-success/15 text-emerald-700" },
  // Ver comentario del componente: replica intencional del frame real.
  cancelada: { label: "CANCELADA", className: "bg-status-success/15 text-emerald-700" },
};

const CATALOG_PROPERTY_IDS = ["p25", "p26", "p27"];

function formatPrice(p: Property) {
  return `${p.currency === "USD" ? "US$" : p.currency} ${p.price.toLocaleString("es-AR")}`;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AgentDashboardHome() {
  const { user } = useAuth();
  const [activityScope, setActivityScope] = useState<"mine" | "team">("mine");
  const [showAccount, setShowAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const firstName = user?.name.split(" ")[0] ?? "Agente";
  const initials = user ? initialsOf(user.name) : "";
  const todayLabel = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const agentProfile = mockPropertyById.get("p25")?.agent;
  const tasaRespuesta = agentProfile?.responseRateWithin2h ?? 0;

  const stats = mockAgentDashboardStats;
  const catalogProperties = CATALOG_PROPERTY_IDS.map((id) => mockPropertyById.get(id)).filter(
    (p): p is Property => !!p
  );
  const timelineVisits = mockAgentTodayVisits.slice(0, 4);

  // Propiedades de agt-4 con "Pendiente de confirmación" de verdad (regla
  // de 20 días, ver `lib/property-status.ts`) — alimenta el título/cuerpo
  // real de la alerta "att-2" de Atención Requerida (antes era el texto
  // fijo "3 Publicaciones necesitan confirmar" del mock) y el link de su
  // botón "Confirmar vigencia", que ahora navega de verdad a la primera
  // propiedad pendiente en /agente/propiedades.
  const pendingConfirmation = mockProperties.filter(
    (p) => p.agent.id === "agt-4" && getListingStatus(p) === "pendiente_confirmacion"
  );

  return (
    <div className="flex-1 overflow-y-auto bg-agent-bg">
      <header className="flex items-center justify-between border-b border-agent-border bg-white px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-buyer-text">
            Hola, {firstName}
          </h1>
          <p className="mt-0.5 text-sm capitalize text-buyer-text-muted">{todayLabel}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-pill bg-agent-bg p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActivityScope("mine")}
              className={cn(
                "rounded-pill px-3.5 py-1.5 transition-colors",
                activityScope === "mine"
                  ? "bg-white text-buyer-text shadow-sm"
                  : "text-buyer-text-muted"
              )}
            >
              Mi actividad
            </button>
            <button
              type="button"
              title="Próximamente"
              className="rounded-pill px-3.5 py-1.5 text-buyer-text-muted transition-colors"
            >
              Todo el equipo
            </button>
          </div>

          <span className="hidden text-xs text-buyer-text-faint lg:inline">Solo Admin</span>

          <button
            type="button"
            title="Próximamente: Centro de notificaciones"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-buyer-text-muted hover:bg-agent-bg"
          >
            <Bell size={19} strokeWidth={1.75} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-status-red" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowAccount((v) => !v);
                setShowSettings(false);
              }}
              aria-label="Mi cuenta"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-buyer-text/90 text-xs font-bold text-white"
            >
              {initials}
            </button>
            {showAccount && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowAccount(false)} />
                <AccountDropdown
                  onClose={() => setShowAccount(false)}
                  onOpenSettings={() => setShowSettings(true)}
                />
              </>
            )}
            {showSettings && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSettings(false)} />
                <AccountSettingsPanel onClose={() => setShowSettings(false)} />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="space-y-6 px-8 py-6">
        {/* --- Stat cards --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-card border border-agent-border bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-status-success/15 text-emerald-700">
              <Home size={18} strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-bold text-buyer-text">{stats.propiedadesActivas}</p>
            <p className="text-sm text-buyer-text-muted">Propiedades Activas</p>
          </div>

          <div className="rounded-card border border-agent-border bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-status-amber-bg text-status-amber-text">
              <CalendarDays size={18} strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-bold text-buyer-text">{stats.visitasDelMes}</p>
            <p className="mb-2 text-sm text-buyer-text-muted">Visitas del Mes</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-buyer-text-faint">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                {stats.visitasConfirmadas} confirmadas
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-status-amber" />
                {stats.visitasPendientes} pendientes
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-status-red" />
                {stats.visitasCanceladas} canceladas
              </span>
            </div>
          </div>

          <div className="rounded-card border border-agent-border bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-status-blue-bg text-status-blue">
              <Users size={18} strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-bold text-buyer-text">{stats.leadsActivos}</p>
            <p className="text-sm text-buyer-text-muted">Leads Activos</p>
            <p className="mt-2 text-xs text-buyer-text-faint">
              +{stats.leadsNuevos} nuevos esta semana
            </p>
          </div>

          <div className="rounded-card border border-agent-border bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-status-success/15 text-emerald-700">
              <BarChart3 size={18} strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-bold text-buyer-text">{tasaRespuesta}%</p>
            <p className="text-sm text-buyer-text-muted">Tasa de Respuesta</p>
            <p className="mt-2 text-xs text-buyer-text-faint">Respuestas dentro de 2 hs</p>
          </div>
        </div>

        {/* --- Atención Requerida --- */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-buyer-text-faint">
            Atención Requerida
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {mockAgentAttentionItems.map((item) => {
              const Icon = ATTENTION_ICONS[item.icon];
              const styles = SEVERITY_STYLES[item.severity];

              // "att-2" ("Publicaciones necesitan confirmar") es la única
              // tarjeta con un CTA real — las demás siguen decorativas
              // (no hay backend para responder visitas, gestionar leads o
              // subir fotos todavía). Título/cuerpo se recalculan acá con
              // el conteo real de `pendingConfirmation` en vez de usar el
              // texto fijo del mock.
              const isConfirmVigencia = item.id === "att-2";
              const title = isConfirmVigencia
                ? `${pendingConfirmation.length} publicaciones necesitan confirmar`
                : item.title;
              const body = isConfirmVigencia
                ? `${pendingConfirmation.length} propiedades llevan +20 días publicadas sin confirmar vigencia.`
                : item.body;

              return (
                <div
                  key={item.id}
                  className={cn("flex items-start gap-3 rounded-card border p-4", styles.card)}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      styles.iconBg
                    )}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-buyer-text">{title}</p>
                    <p className="mt-0.5 text-xs text-buyer-text-muted">{body}</p>
                    {isConfirmVigencia && pendingConfirmation[0] ? (
                      <Link
                        href={`/agente/propiedades?confirmar=${pendingConfirmation[0].id}`}
                        className={cn(
                          "mt-2.5 inline-block rounded-control px-3 py-1.5 text-xs font-bold transition-colors",
                          styles.cta
                        )}
                      >
                        {item.ctaLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        title="Próximamente"
                        className={cn(
                          "mt-2.5 rounded-control px-3 py-1.5 text-xs font-bold transition-colors",
                          styles.cta
                        )}
                      >
                        {item.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- Catálogo Activo + Timeline del Día --- */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-buyer-text-faint">
              Catálogo Activo
            </h2>
            <div className="space-y-3">
              {catalogProperties.map((p) => {
                const statusStyle = CATALOG_STATUS_STYLES[getListingStatus(p)];
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-card border border-agent-border bg-white p-3"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-buyer-input-bg">
                      {p.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photos[0]}
                          alt={p.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-buyer-text-faint">
                          <ImageOff size={18} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-buyer-text">{p.title}</p>
                      <p className="truncate text-xs text-buyer-text-muted">
                        {p.location.address} · {formatPrice(p)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {statusStyle && (
                          <span
                            className={cn(
                              "rounded-pill px-2 py-0.5 text-[10px] font-bold",
                              statusStyle.className
                            )}
                          >
                            {statusStyle.label}
                          </span>
                        )}
                        <span className="rounded-pill border border-buyer-border px-2 py-0.5 text-[10px] font-bold text-buyer-text-muted">
                          {TYPE_LABELS[p.type]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-buyer-text-faint">
              Timeline del Día
            </h2>
            <div className="space-y-3">
              {timelineVisits.map((visit) => {
                const property = mockPropertyById.get(visit.propertyId);
                const statusStyle = TIMELINE_STATUS_STYLES[visit.status];
                return (
                  <div
                    key={visit.id}
                    className="flex items-center gap-3 rounded-card border border-agent-border bg-white p-3"
                  >
                    <span className="w-12 shrink-0 text-xs font-bold text-buyer-text-muted">
                      {visit.slot.time}
                    </span>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-buyer-text/90 text-xs font-bold text-white">
                      {initialsOf(visit.buyerName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-buyer-text">
                        {visit.buyerName}
                      </p>
                      <p className="truncate text-xs text-buyer-text-muted">{property?.title}</p>
                    </div>

                    {visit.status === "pendiente" ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          title="Próximamente: Confirmar visita"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-status-success/15 text-emerald-700 hover:brightness-95"
                        >
                          <Check size={14} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          title="Próximamente: Rechazar visita"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-status-red-bg text-status-red hover:brightness-95"
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      statusStyle && (
                        <span
                          className={cn(
                            "shrink-0 rounded-pill px-2.5 py-1 text-[10px] font-bold",
                            statusStyle.className
                          )}
                        >
                          {statusStyle.label}
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
