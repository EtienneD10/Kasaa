"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { BuyerAuthForm } from "@/components/auth/BuyerAuthForm";

/**
 * Recuadro "Iniciá sesión para agendar" — aparece cuando alguien sin sesión
 * de comprador toca "Solicitar Visita" (tarjeta, Quick Look o Feed
 * inmersivo). Mismo formulario que `/login` (`BuyerAuthForm`); al entrar,
 * `LoginGateProvider` retoma la acción que había quedado pendiente, así la
 * persona no tiene que volver a buscar la propiedad ni volver a tocar nada.
 *
 * z-[70]: por encima del Feed inmersivo (45), Quick Look (50) y visor 3D (60),
 * que pueden estar abiertos debajo cuando se dispara.
 */
export function LoginRequiredModal({
  propertyTitle,
  signedInAsAgent,
  onSuccess,
  onClose,
}: {
  propertyTitle?: string;
  /** Hay sesión, pero de agente: agendar es una acción de comprador. */
  signedInAsAgent: boolean;
  onSuccess: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Que no lo tome también el Quick Look / feed de abajo.
        e.stopImmediatePropagation();
        onClose();
      }
    }
    // Captura: corre antes que los listeners de Escape de los overlays de abajo.
    document.addEventListener("keydown", onKeyDown, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Iniciá sesión para agendar tu visita"
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-card bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-buyer-text-muted hover:bg-buyer-bg hover:text-buyer-text"
        >
          <X size={16} />
        </button>

        <Logo />

        <div className="mb-6 mt-5 flex gap-3 rounded-control bg-accent-tint p-3">
          <CalendarClock size={18} className="mt-0.5 shrink-0 text-buyer-text" />
          <div className="text-sm leading-snug text-buyer-text">
            <p className="font-semibold">Iniciá sesión para agendar tu visita</p>
            <p className="mt-0.5 text-xs text-buyer-text-muted">
              {signedInAsAgent
                ? "Tu sesión actual es de agente. Para pedir una visita entrá con una cuenta de comprador."
                : "Así el agente sabe quién va y te confirma por WhatsApp."}
              {propertyTitle && (
                <>
                  {" "}
                  Después seguís agendando <span className="font-semibold">{propertyTitle}</span>.
                </>
              )}
            </p>
          </div>
        </div>

        <BuyerAuthForm
          onSuccess={onSuccess}
          title={{ login: "Bienvenido de nuevo", signup: "Creá tu cuenta" }}
        />
      </div>
    </div>,
    document.body
  );
}
