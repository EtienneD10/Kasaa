"use client";

import Link from "next/link";
import { User, CalendarClock, Heart, Bookmark, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

/**
 * Dropdown de cuenta — se abre desde el avatar del Header, reconstruido a
 * partir del frame real `desktop-discovery-default-cards +
 * account-dropdown` (rol comprador). Reemplaza el botón decorativo
 * ("Próximamente: Mi cuenta") que había antes.
 *
 * "Mis Visitas", "Mi cuenta"/"Configuración" (ambos abren el mismo
 * `AccountSettingsPanel`, ver ese componente) y "Cerrar sesión" son
 * funcionales de verdad. "Favoritos" y "Búsquedas guardadas" quedan
 * decorativos — no existe ningún modelo/página para ninguno de los dos
 * todavía (`favorites` hoy es estado local de `DiscoveryClient`, no
 * persiste ni tiene vista propia), mismo criterio usado en el resto de
 * la app para features no construidas.
 *
 * El frame de referencia es de la superficie compradora. Para el rol
 * agente no había una referencia visual — se extrapoló un menú más corto
 * (Mi cuenta / Configuración / Cerrar sesión, sin Mis Visitas ni
 * Favoritos/Búsquedas guardadas, que son conceptos de comprador) hasta
 * que aparezca el frame real.
 */
export function AccountDropdown({
  onClose,
  onOpenVisitas,
  onOpenSettings,
}: {
  onClose: () => void;
  onOpenVisitas?: () => void;
  onOpenSettings?: () => void;
}) {
  const { role, user, pendingVisitsCount, logout } = useAuth();

  const initials = user?.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogout() {
    logout();
    onClose();
  }

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-card border border-buyer-border bg-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-buyer-border px-4 py-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-buyer-text/90 text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-buyer-text">{user?.name}</p>
          <p className="truncate text-xs text-buyer-text-muted">{user?.email}</p>
        </div>
      </div>

      <div className="py-1.5">
        <MenuItem
          icon={User}
          label="Mi cuenta"
          onClick={() => {
            onClose();
            onOpenSettings?.();
          }}
        />

        {role === "comprador" && (
          <MenuItem
            icon={CalendarClock}
            label="Mis Visitas"
            badge={pendingVisitsCount > 0 ? pendingVisitsCount : undefined}
            onClick={() => {
              onClose();
              onOpenVisitas?.();
            }}
          />
        )}

        {role === "comprador" && (
          <>
            <MenuItem icon={Heart} label="Favoritos" />
            <MenuItem icon={Bookmark} label="Búsquedas guardadas" />
          </>
        )}

        <MenuItem
          icon={Settings}
          label="Configuración"
          onClick={() => {
            onClose();
            onOpenSettings?.();
          }}
        />
      </div>

      <div className="border-t border-buyer-border py-1.5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-status-red hover:bg-buyer-bg"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  badge,
  onClick,
  href,
}: {
  icon: typeof User;
  label: string;
  badge?: number;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <Icon size={16} strokeWidth={1.75} className="text-buyer-text-muted" />
      <span className="flex-1 text-buyer-text">{label}</span>
      {badge !== undefined && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-black">
          {badge}
        </span>
      )}
    </>
  );

  const className = cn(
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium hover:bg-buyer-bg"
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={onClick ? undefined : "Próximamente"}
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  );
}
