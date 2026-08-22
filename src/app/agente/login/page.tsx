"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/layout/Logo";
import { FormField } from "@/components/ui/FormField";

/**
 * Login de agente — spec §4.1: "Card centrada sobre fondo dark #0F1210.
 * Distinto del login comprador (utility, no marketing)." Reconstruido a
 * partir del frame real `agent-login-desktop` en Figma: es una CARD BLANCA
 * flotando sobre el fondo oscuro (no una card translúcida con texto
 * blanco como en la primera versión), con labels + inputs grises tipo
 * `FormField`, link "¿Olvidaste tu contraseña?", botón outline
 * "Registrate como agente" (no un tab) y "← Volver a Kasaa" debajo de la
 * card, fuera de ella.
 *
 * El Registro de agente vive aparte en `agente/registro/page.tsx` y SÍ
 * comparte el `AuthSplitShell` marketing (imagen + formulario), a
 * diferencia de este login utility.
 */
export default function AgentLoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const displayName = email.split("@")[0] || "Agente Kasaa";
    login("agente", { name: displayName, email: email.trim() || undefined });
    router.push("/agente");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-agent-sidebar px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-card bg-white p-8 shadow-xl">
          <Link href="/" className="mb-6 inline-block">
            <Logo />
          </Link>

          <h1 className="mb-1 font-display text-xl font-semibold text-buyer-text">
            Panel de agente
          </h1>
          <p className="mb-6 text-sm text-buyer-text-muted">
            Gestioná tus propiedades, agenda y leads.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              required
              placeholder="tu@inmobiliaria.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div>
              <FormField label="Contraseña" type="password" required placeholder="••••••••" />
              <div className="mt-1.5 text-right">
                <button
                  type="button"
                  title="Próximamente"
                  className="text-xs font-medium text-accent"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-control bg-accent py-3.5 text-sm font-bold text-black transition-transform hover:brightness-95"
            >
              Iniciar sesión
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-buyer-text-faint">
            <span className="h-px flex-1 bg-buyer-border" />
            o
            <span className="h-px flex-1 bg-buyer-border" />
          </div>

          <Link
            href="/agente/registro"
            className="block w-full rounded-control border border-buyer-border py-3.5 text-center text-sm font-bold text-buyer-text transition-colors hover:border-buyer-text"
          >
            Registrate como agente
          </Link>
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-white/60 hover:text-white"
        >
          <ArrowLeft size={14} /> Volver a Kasaa
        </Link>
      </div>
    </div>
  );
}
