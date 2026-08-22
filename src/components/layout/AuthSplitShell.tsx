import type { ReactNode } from "react";

/**
 * Shell compartido para las pantallas de auth con foto editorial —
 * Login/Registro comprador (spec §3.2) y Registro de agente. Reconstruido
 * de los frames `login-desktop` / `signup-desktop` / `signup-agente-desktop`
 * en Figma: imagen a la izquierda ocupando ~60% (no 50/50 como la primera
 * versión), texto superpuesto abajo a la izquierda, columna de formulario
 * a la derecha con el wordmark arriba de todo.
 *
 * El login de agente (spec §4.1) NO usa este shell — es una card utility
 * sobre fondo oscuro, ver `agente/login/page.tsx`.
 */
export function AuthSplitShell({
  imageUrl,
  overlayTitle,
  overlaySubtitle,
  children,
}: {
  imageUrl: string;
  overlayTitle: string;
  overlaySubtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[3fr_2fr]">
      <div className="relative hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" aria-hidden className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/10" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="font-display text-3xl font-semibold leading-tight">{overlayTitle}</p>
          <p className="mt-2 text-sm text-white/80">{overlaySubtitle}</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
