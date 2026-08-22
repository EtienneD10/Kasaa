"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AgentSidebar } from "@/components/agent/AgentSidebar";

/**
 * Layout compartido de las pantallas reales del panel de agente —
 * `/agente` (Dashboard Home), `/agente/pipeline` y `/agente/equipo`. Se
 * movió acá el gate por rol que antes vivía solo en `agente/page.tsx`
 * (spec §7 + decisión abierta #4 en TRACKING.md) para no repetirlo en
 * cada pantalla nueva del panel: cada `page.tsx` de este grupo de rutas
 * `(panel)` ahora solo renderiza su contenido específico, sin preocuparse
 * por invitado/comprador/sidebar.
 *
 * `(panel)` es un route group (no aparece en la URL) — así `/agente/login`
 * y `/agente/registro`, que viven FUERA de este grupo (hermanos, no
 * hijos), no pasan por este gate ni muestran el sidebar oscuro, que es lo
 * correcto para pantallas de pre-login.
 *
 * Tres estados según el rol mockeado en `AuthProvider`:
 * - invitado (role === null): redirige a `/agente/login`.
 * - comprador: pantalla de "Acceso restringido" (frame
 *   `agent-access-restricted`), sin sidebar.
 * - agente: `AgentSidebar` + el `children` de la pantalla pedida.
 */
export default function AgentPanelLayout({ children }: { children: ReactNode }) {
  const { role, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role === null) {
      router.replace("/agente/login");
    }
  }, [role, router]);

  if (role === null) {
    return null;
  }

  if (role === "comprador") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-agent-sidebar px-6 py-12 text-center">
        <div className="w-full max-w-sm">
          <div className="rounded-card bg-white p-10 shadow-xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-buyer-input-bg">
              <Lock size={22} className="text-buyer-text-muted" />
            </div>
            <h1 className="mb-2 font-display text-xl font-semibold text-buyer-text">
              Acceso restringido
            </h1>
            <p className="mb-8 text-sm text-buyer-text-muted">
              Estás conectado como comprador ({user?.name}). El panel de agente es exclusivo
              para cuentas profesionales verificadas.
            </p>
            <Link
              href="/agente/registro"
              className="block w-full rounded-control bg-accent py-3.5 text-center text-sm font-bold text-black transition-transform hover:brightness-95"
            >
              Registrarme como agente
            </Link>
          </div>

          <Link
            href="/discovery"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-white/60 hover:text-white"
          >
            <ArrowLeft size={14} /> Volver a Kasaa
          </Link>
        </div>
      </div>
    );
  }

  // role === "agente"
  return (
    <div className="flex h-screen overflow-hidden bg-agent-bg">
      <AgentSidebar />
      {children}
    </div>
  );
}
