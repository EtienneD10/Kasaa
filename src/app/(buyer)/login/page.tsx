"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { AuthSplitShell } from "@/components/layout/AuthSplitShell";
import { Logo } from "@/components/layout/Logo";
import { FormField } from "@/components/ui/FormField";
import { GoogleIcon, AppleIcon } from "@/components/icons/SocialIcons";

/**
 * Login / Registro — comprador. Reconstruida a partir de los frames reales
 * de Figma `login-desktop` / `signup-desktop` (no de una interpretación
 * libre de la spec §3.2). Cambios contra la versión anterior: imagen a la
 * izquierda ahora ocupa ~60% (no 50/50), wordmark vive en la columna del
 * formulario (no sobre la foto), inputs con label uppercase + fondo gris,
 * los campos van ANTES que el login social (no después), se agregó
 * "¿Olvidaste tu contraseña?" y el botón de Apple.
 *
 * El submit no pega a ningún backend real todavía (ver decisión abierta #2
 * en TRACKING.md) — llama a `useAuth().login("comprador", …)`.
 */
type Tab = "login" | "signup";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200";

export default function BuyerLoginPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const displayName =
      tab === "signup" && name.trim() ? name.trim() : email.split("@")[0] || "Comprador Kasaa";
    login("comprador", { name: displayName, email: email.trim() || undefined });
    router.push("/discovery");
  }

  return (
    <AuthSplitShell
      imageUrl={HERO_IMAGE}
      overlayTitle="Encontrá tu próximo hogar"
      overlaySubtitle="Miles de propiedades, visitas coordinadas en segundos"
    >
      <Link href="/" className="mb-8 inline-block">
        <Logo />
      </Link>

      <div className="mb-7 flex rounded-pill bg-buyer-input-bg p-1">
        <button
          onClick={() => setTab("login")}
          className={cn(
            "flex-1 rounded-pill py-2.5 text-sm font-semibold transition-colors",
            tab === "login" ? "bg-accent text-black" : "text-buyer-text-muted"
          )}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => setTab("signup")}
          className={cn(
            "flex-1 rounded-pill py-2.5 text-sm font-semibold transition-colors",
            tab === "signup" ? "bg-accent text-black" : "text-buyer-text-muted"
          )}
        >
          Crear cuenta
        </button>
      </div>

      <h1 className="mb-6 font-display text-2xl font-semibold text-buyer-text">
        {tab === "login" ? "Bienvenido de nuevo" : "Creá tu cuenta"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === "signup" && (
          <FormField
            label="Nombre completo"
            type="text"
            required
            placeholder="Alejandro Méndez"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <FormField
          label="Email"
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {tab === "signup" && (
          <FormField label="Teléfono" type="tel" required placeholder="+34 600 000 000" />
        )}
        <div>
          <FormField label="Contraseña" type="password" required placeholder="••••••••" />
          {tab === "login" && (
            <div className="mt-1.5 text-right">
              <button
                type="button"
                title="Próximamente"
                className="text-xs font-medium text-accent"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </div>

        {tab === "signup" && (
          <label className="flex items-start gap-2 text-xs text-buyer-text-muted">
            <input type="checkbox" required className="mt-0.5 accent-accent" />
            Acepto los{" "}
            <button type="button" title="Próximamente" className="font-medium text-accent underline">
              términos y condiciones
            </button>
          </label>
        )}

        <button
          type="submit"
          className="w-full rounded-control bg-accent py-3.5 text-sm font-bold text-black transition-transform hover:brightness-95"
        >
          {tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
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
        ¿Sos agente inmobiliario?{" "}
        <Link href="/agente/registro" className="font-semibold text-accent underline">
          Registrate acá
        </Link>
      </p>
    </AuthSplitShell>
  );
}
