"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { FormField } from "@/components/ui/FormField";
import { GoogleIcon, AppleIcon } from "@/components/icons/SocialIcons";

/**
 * Formulario de Login / Registro del comprador — tabs, campos, login social.
 * Extraído de `login/page.tsx` para reusarlo tal cual en el recuadro
 * "Iniciá sesión para agendar" (`LoginRequiredModal`), sin duplicar el form.
 *
 * El submit no pega a ningún backend real todavía (ver decisión abierta #2
 * en TRACKING.md) — llama a `useAuth().login("comprador", …)` y después a
 * `onSuccess` (la página navega a Discovery; el recuadro retoma la acción
 * que había quedado pendiente).
 */
type Tab = "login" | "signup";

export function BuyerAuthForm({
  onSuccess,
  title,
}: {
  onSuccess: () => void;
  /** Título sobre los campos; por defecto el de la página de login. */
  title?: { login: string; signup: string };
}) {
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { login } = useAuth();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const displayName =
      tab === "signup" && name.trim() ? name.trim() : email.split("@")[0] || "Comprador Kasaa";
    login("comprador", { name: displayName, email: email.trim() || undefined });
    onSuccess();
  }

  const heading = title ?? { login: "Bienvenido de nuevo", signup: "Creá tu cuenta" };

  return (
    <>
      <div className="mb-7 flex rounded-pill bg-buyer-input-bg p-1">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={cn(
            "flex-1 rounded-pill py-2.5 text-sm font-semibold transition-colors",
            tab === "login" ? "bg-accent text-black" : "text-buyer-text-muted"
          )}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
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
        {tab === "login" ? heading.login : heading.signup}
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
    </>
  );
}
