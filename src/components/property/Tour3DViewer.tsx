"use client";

import { useEffect } from "react";
import { Box, X } from "lucide-react";
import { isValidTourUrl } from "@/lib/property-media";

/**
 * Visor del recorrido 3D tipo Matterport — pantalla completa, incrusta el
 * enlace que el agente cargó para la propiedad (`tourUrl`, Matterport u
 * otro proveedor de tours 360°). Sirve igual para departamento, casa,
 * terreno o local: el visor no sabe de tipo de propiedad, sólo muestra el
 * recorrido que exista.
 *
 * Kasaa NO genera el recorrido — requiere un escaneo real de la propiedad
 * (cámara 360° / LiDAR) hecho por el agente o un proveedor. Sin enlace
 * (o con uno inválido) se muestra un estado explícito en vez de un visor
 * roto o una escena inventada.
 */
export function Tour3DViewer({
  title,
  tourUrl,
  onClose,
}: {
  title: string;
  tourUrl?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const embeddable = !!tourUrl && isValidTourUrl(tourUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Recorrido 3D de ${title}`}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3 text-white">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Box size={16} className="shrink-0 text-accent" />
          <span className="truncate">Recorrido 3D · {title}</span>
        </p>
        <button
          onClick={onClose}
          aria-label="Cerrar recorrido 3D"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative flex-1 px-3 pb-3 sm:px-5 sm:pb-5">
        {embeddable ? (
          <iframe
            src={tourUrl}
            title={`Recorrido 3D de ${title}`}
            allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
            referrerPolicy="no-referrer"
            className="h-full w-full rounded-card border-0 bg-black"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-card border border-white/15 px-6 text-center text-white">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/25">
              <Box size={24} />
            </div>
            <p className="text-lg font-semibold">Recorrido 3D no disponible aún</p>
            <p className="mt-2 max-w-sm text-sm text-white/65">
              El agente todavía no cargó el recorrido 3D de esta propiedad. Podés pedirle una visita
              guiada inmersiva con el botón &quot;Solicitar Visita&quot;.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-buyer-text"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
