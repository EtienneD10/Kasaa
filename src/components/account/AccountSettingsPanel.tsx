"use client";

import { useState } from "react";
import { X, LogOut, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { FormField } from "@/components/ui/FormField";

/**
 * Drawer de "Configuración" — se abre desde "Mi cuenta" o "Configuración"
 * en `AccountDropdown`, reconstruido a partir del frame real
 * `discovery-drawer-datos`. Mismo lenguaje visual que `MisVisitasPanel`
 * (dropdown flotante bajo el avatar, no un drawer lateral tipo Filtros
 * avanzados — a pesar del nombre del frame en Figma, por tamaño y
 * posición se comporta igual que el resto de los dropdowns del Header).
 *
 * Simplificación deliberada: el Figma real solo tiene captura de la tab
 * "Datos personales" — "Notificaciones", "Búsquedas" y "Privacidad"
 * existen como tabs (así que se dejan armadas acá) pero su contenido es
 * un placeholder "Próximamente" hasta que aparezca la referencia visual
 * de cada una. También se simplificó a que tanto "Mi cuenta" como
 * "Configuración" del dropdown abran este mismo panel en la misma tab
 * por defecto — no había una segunda referencia que mostrara alguna
 * diferencia entre ambos.
 *
 * "Guardar cambios" SÍ actualiza el usuario mockeado de verdad
 * (`useAuth().updateUser`), mismo criterio que "Cancelar visita" y
 * "Cerrar sesión" en el resto de la app — no queda como acción
 * decorativa. "Cambiar foto de perfil" sigue sin pantalla propia
 * (no hay upload real ni storage de imágenes todavía), así que es
 * decorativo.
 */
type Tab = "datos" | "notificaciones" | "busquedas" | "privacidad";

const TABS: { id: Tab; label: string }[] = [
  { id: "datos", label: "Datos personales" },
  { id: "notificaciones", label: "Notificaciones" },
  { id: "busquedas", label: "Búsquedas" },
  { id: "privacidad", label: "Privacidad" },
];

export function AccountSettingsPanel({ onClose }: { onClose: () => void }) {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("datos");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [justSaved, setJustSaved] = useState(false);

  const initials = user?.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSave() {
    updateUser({ name: name.trim() || user?.name, email: email.trim(), phone: phone.trim() });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  }

  function handleLogout() {
    logout();
    onClose();
  }

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-[380px] overflow-hidden rounded-card border border-buyer-border bg-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-buyer-border px-4 py-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-buyer-text/90 text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-buyer-text">{user?.name}</p>
          <p className="truncate text-xs text-buyer-text-muted">{user?.email}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-buyer-text-muted hover:bg-buyer-bg"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-buyer-border px-4 py-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors",
              activeTab === tab.id
                ? "bg-accent text-black"
                : "text-buyer-text-muted hover:bg-buyer-bg"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[440px] overflow-y-auto px-4 py-4">
        {activeTab === "datos" ? (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-buyer-text">Datos personales</h4>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-buyer-text/90 text-base font-bold text-white">
                {initials}
              </div>
              <div>
                <button
                  type="button"
                  title="Próximamente"
                  className="text-xs font-semibold text-accent underline"
                >
                  Cambiar foto de perfil
                </button>
                <p className="text-[11px] text-buyer-text-faint">.JPG, .PNG. Máximo 2MB</p>
              </div>
            </div>

            <FormField
              label="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FormField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-buyer-text-muted">
                Teléfono móvil
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full flex-1 rounded-control bg-buyer-input-bg px-4 py-3 text-sm text-buyer-text outline-none placeholder:text-buyer-text-faint focus:ring-2 focus:ring-accent"
                />
                <span className="flex shrink-0 items-center gap-1 rounded-pill bg-status-success/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                  <MessageCircle size={12} /> WhatsApp
                </span>
              </div>
            </label>

            <button
              onClick={handleSave}
              className="w-full rounded-control bg-accent py-3 text-sm font-bold text-black transition-transform hover:brightness-95"
            >
              {justSaved ? "¡Guardado!" : "Guardar cambios"}
            </button>
          </div>
        ) : (
          <p className="px-2 py-10 text-center text-sm text-buyer-text-muted">
            {TABS.find((t) => t.id === activeTab)?.label} — próximamente.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-buyer-border px-4 py-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-semibold text-buyer-text-muted hover:text-buyer-text"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
        <span className="text-[11px] text-buyer-text-faint">v1.2.0</span>
      </div>
    </div>
  );
}
