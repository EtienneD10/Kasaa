"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/layout/Logo";
import { MisVisitasPanel } from "@/components/visits/MisVisitasPanel";
import { AccountDropdown } from "@/components/account/AccountDropdown";
import { AccountSettingsPanel } from "@/components/account/AccountSettingsPanel";

/**
 * Header global — reconstruido a partir del archivo real de Figma
 * (`kasaaEstilo1`, frames `desktop-discovery-default-cards`), no solo del
 * texto de kasaa-spec-completa.md §2. Diferencias notadas contra la spec
 * escrita, ver TRACKING.md:
 * - No hay campanita de notificaciones en el header en el diseño real —
 *   el Centro de Notificaciones (spec §3.14) va a necesitar otra entrada
 *   cuando se construya esa pantalla.
 * - El comprador logueado SÍ sigue viendo "Anunciar propiedad" (como link
 *   de texto, no botón) — la spec decía que no debía verse.
 * - El ícono de "Mis Visitas" es un combo calendario+reloj (cuenta
 *   regresiva de 2hs, spec §5.1), aproximado acá con `CalendarClock`.
 *   Abre el dropdown `MisVisitasPanel` (antes era decorativo) — frames
 *   `desktop-discovery-default-cards + panel-mis-visitas` / `+
 *   cancelar-flow` / `+ visitas-canceladas`.
 * - El avatar ahora abre `AccountDropdown` (antes era un botón decorativo
 *   "Próximamente: Mi cuenta") — frame `desktop-discovery-default-cards +
 *   account-dropdown`. Desde ahí, el item "Mis Visitas" abre el mismo
 *   `MisVisitasPanel` que el ícono de calendario (un solo estado
 *   `showVisitas` compartido, para no tener dos paneles independientes),
 *   y "Mi cuenta"/"Configuración" abren `AccountSettingsPanel` — frame
 *   `discovery-drawer-datos`. Los 3 dropdowns (`showVisitas`,
 *   `showAccount`, `showSettings`) se cierran entre sí al abrir uno
 *   nuevo, para que nunca queden dos superpuestos.
 *
 * `centerSlot` permite inyectar la search bar (Discovery) sin duplicar la
 * lógica de los 3 estados de rol — Landing y Login no la pasan.
 */
interface HeaderProps {
  variant?: "solid" | "transparent";
  className?: string;
  centerSlot?: ReactNode;
}

export function Header({ variant = "solid", className, centerSlot }: HeaderProps) {
  const { role, user, pendingVisitsCount } = useAuth();
  const [showVisitas, setShowVisitas] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const initials = user?.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className={cn(
        "z-20 w-full",
        variant === "solid"
          ? "sticky top-0 border-b border-buyer-border bg-buyer-surface"
          : "absolute inset-x-0 top-0 bg-transparent",
        className
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-8">
        <Link href="/" className="shrink-0">
          <Logo dark={variant === "transparent"} />
        </Link>

        {centerSlot && <div className="flex-1">{centerSlot}</div>}

        <div className={cn("flex shrink-0 items-center gap-4", !centerSlot && "ml-auto")}>
          {role === null && (
            <>
              <Link
                href="/login"
                className={cn(
                  "text-sm font-semibold",
                  variant === "transparent" ? "text-white" : "text-buyer-text"
                )}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/agente/login"
                className={cn(
                  "rounded-control border px-4 py-2 text-sm font-semibold transition-colors",
                  variant === "transparent"
                    ? "border-white/70 text-white hover:bg-white/10"
                    : "border-buyer-border text-buyer-text hover:border-buyer-text"
                )}
              >
                Anunciar propiedad
              </Link>
            </>
          )}

          {role === "comprador" && (
            <>
              <Link
                href="/agente/login"
                className="text-sm font-semibold text-buyer-text"
              >
                Anunciar propiedad
              </Link>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowVisitas((v) => !v);
                    setShowAccount(false);
                    setShowSettings(false);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-buyer-text hover:bg-buyer-bg"
                  aria-label="Mis Visitas"
                >
                  <CalendarClock size={20} strokeWidth={1.75} />
                  {pendingVisitsCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-black">
                      {pendingVisitsCount}
                    </span>
                  )}
                </button>
                {showVisitas && (
                  <>
                    {/* Capa transparente para cerrar al clickear afuera —
                        mismo patrón que el backdrop de Filtros avanzados
                        pero sin blur/dim, es un dropdown chico, no un
                        drawer. */}
                    <div className="fixed inset-0 z-20" onClick={() => setShowVisitas(false)} />
                    <MisVisitasPanel onClose={() => setShowVisitas(false)} />
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAccount((v) => !v);
                    setShowVisitas(false);
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
                      onOpenVisitas={() => setShowVisitas(true)}
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
            </>
          )}

          {role === "agente" && (
            <>
              <Link
                href="/agente"
                className="rounded-control bg-accent px-4 py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95"
              >
                Panel de agente →
              </Link>
              <div className="relative">
                <button
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
