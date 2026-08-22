"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthSplitShell } from "@/components/layout/AuthSplitShell";
import { Logo } from "@/components/layout/Logo";
import { FormField } from "@/components/ui/FormField";
import { GoogleIcon, AppleIcon } from "@/components/icons/SocialIcons";

/**
 * Registro de agente — reutiliza el mismo `AuthSplitShell` que Login/Registro
 * comprador (frame `signup-agente-desktop` en Figma comparte la misma
 * composición imagen 60% + columna de formulario 40%), con los campos
 * propios de una cuenta profesional: nombre de la agencia y matrícula
 * inmobiliaria (con texto de ayuda), además de un checkbox de términos
 * específico para agentes (distinto del checkbox comprador).
 *
 * El login "utility" de agente (card oscura, spec §4.1) vive aparte en
 * `agente/login/page.tsx` y no comparte este shell — ver comentario ahí.
 * El submit no pega a ningún backend real todavía (ver decisión abierta #2
 * en TRACKING.md) — llama a `useAuth().login("agente", …)`.
 */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200";

export default function AgentRegistroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agency, setAgency] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const displayName = name.trim() || email.split("@")[0] || "Agente Kasaa";
    login("agente", {
      name: displayName,
      email: email.trim() || undefined,
      agency: agency.trim() || undefined,
    });
    router.push("/agente");
  }

  return (
    <AuthSplitShell
      imageUrl={HERO_IMAGE}
      overlayTitle="Publicá y coordiná visitas sin fricción"
      overlaySubtitle="Gestioná tu cartera, tus leads y tu agenda desde un solo panel"
    >
      <Link href="/" className="mb-8 inline-block">
        <Logo />
      </Link>

      <h1 className="mb-1 font-display text-2xl font-semibold text-buyer-text">
        Sumá tu inmobiliaria
      </h1>
      <p className="mb-6 text-sm text-buyer-text-muted">
        Creá tu cuenta de agente para publicar propiedades y recibir visitas.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Nombre completo"
          type="text"
          required
          placeholder="María García"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormField
          label="Email profesional"
          type="email"
          required
          placeholder="maria@inmobiliaria.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField label="Teléfono" type="tel" required placeholder="+34 600 000 000" />
        <FormField
          label="Nombre de la agencia"
          type="text"
          required
          placeholder="García Propiedades"
          value={agency}
          onChange={(e) => setAgency(e.target.value)}
        />
        <div>
          <FormField
            label="Matrícula inmobiliaria"
            type="text"
            required
            placeholder="Ej. 12345"
          />
          <p className="mt-1.5 text-xs text-buyer-text-faint">
            Número de colegiación profesional — lo verificamos antes de activar tu cuenta.
          </p>
        </div>
        <FormField label="Contraseña" type="password" required placeholder="••••••••" />

        <label className="flex items-start gap-2 text-xs text-buyer-text-muted">
          <input type="checkbox" required className="mt-0.5 accent-accent" />
          Acepto los{" "}
          <button type="button" title="Próximamente" className="font-medium text-accent underline">
            términos y condiciones para agentes
          </button>
        </label>

        <button
          type="submit"
          className="w-full rounded-control bg-accent py-3.5 text-sm font-bold text-black transition-transform hover:brightness-95"
        >
          Crear cuenta de agente
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-buyer-text-faint">
        <span className="h-px flex-1 bg-buyer-border" /> o continuá con
        <span className="h-px flex-1 bg-buyer-border" />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          title="Próximamente"
          className="flex flex-1 items-center justify-center gap-2 rounded-control border border-buyer-border bg-white py-2.5 text-sm font-semibold text-buyer-text hover:border-buyer-text"
        >
          <GoogleIcon /> Google
        </button>
        <button
          type="button"
          title="Próximamente"
          className="flex flex-1 items-center justify-center gap-2 rounded-control border border-buyer-border bg-white py-2.5 text-sm font-semibold text-buyer-text hover:border-buyer-text"
        >
          <AppleIcon /> Apple
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-buyer-text-muted">
        ¿Ya tenés cuenta de agente?{" "}
        <Link href="/agente/login" className="font-semibold text-accent underline">
          Iniciá sesión
        </Link>
      </p>
    </AuthSplitShell>
  );
}
