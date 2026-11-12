"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitShell } from "@/components/layout/AuthSplitShell";
import { Logo } from "@/components/layout/Logo";
import { BuyerAuthForm } from "@/components/auth/BuyerAuthForm";

/**
 * Login / Registro — comprador. Reconstruida a partir de los frames reales
 * de Figma `login-desktop` / `signup-desktop` (no de una interpretación
 * libre de la spec §3.2). Cambios contra la versión anterior: imagen a la
 * izquierda ahora ocupa ~60% (no 50/50), wordmark vive en la columna del
 * formulario (no sobre la foto), inputs con label uppercase + fondo gris,
 * los campos van ANTES que el login social (no después), se agregó
 * "¿Olvidaste tu contraseña?" y el botón de Apple.
 *
 * El formulario vive en `BuyerAuthForm` (compartido con el recuadro
 * "Iniciá sesión para agendar" de Discovery).
 */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200";

export default function BuyerLoginPage() {
  const router = useRouter();

  return (
    <AuthSplitShell
      imageUrl={HERO_IMAGE}
      overlayTitle="Encontrá tu próximo hogar"
      overlaySubtitle="Miles de propiedades, visitas coordinadas en segundos"
    >
      <Link href="/" className="mb-8 inline-block">
        <Logo />
      </Link>

      <BuyerAuthForm onSuccess={() => router.push("/discovery")} />

      <p className="mt-8 text-center text-xs text-buyer-text-muted">
        ¿Sos agente inmobiliario?{" "}
        <Link href="/agente/registro" className="font-semibold text-accent underline">
          Registrate acá
        </Link>
      </p>
    </AuthSplitShell>
  );
}
