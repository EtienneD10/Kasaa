"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Film, Plane, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DRONE_STYLES,
  DEFAULT_DRONE_STYLE,
  isValidTourUrl,
  usePropertyMedia,
  usePropertyMediaStore,
} from "@/lib/property-media";
import { DroneReel } from "@/components/property/PropertyMedia";
import { Tour3DViewer } from "@/components/property/Tour3DViewer";
import type { DroneStyle, Property } from "@/types";

/**
 * Editor de medios de una propiedad (panel Propiedades → ícono de lápiz):
 * el agente carga el video representativo, elige el estilo del recorrido
 * tipo dron y pega el enlace del recorrido 3D (Matterport u otro).
 *
 * Qué es real y qué no (ver TRACKING.md):
 * - El video se elige desde el equipo (`<input type="file">`) o se pega una
 *   URL https. Un archivo elegido se guarda como `blob:` URL en memoria —
 *   dura lo que dura la sesión del navegador; subirlo a un storage real es
 *   trabajo de backend (todavía no existe).
 * - El estilo dron es una simulación con las fotos (zoom/paneo animado),
 *   no un video generado: sólo se usa cuando la propiedad NO tiene video.
 * - El enlace 3D sólo se acepta si es https (termina en un iframe).
 * - "Guardar" escribe en `PropertyMediaProvider` (contexto en memoria), por
 *   eso se ve en la tarjeta del comprador sin recargar la página.
 */
export function PropertyMediaModal({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const current = usePropertyMedia(property);
  const { setMedia } = usePropertyMediaStore();

  const [videoUrl, setVideoUrl] = useState(current.videoUrl ?? "");
  const [videoName, setVideoName] = useState<string | null>(
    current.videoUrl?.startsWith("blob:") ? "Video cargado desde tu equipo" : null
  );
  const [droneStyle, setDroneStyle] = useState<DroneStyle>(current.droneStyle);
  const [tourUrl, setTourUrl] = useState(current.tourUrl ?? "");
  const [previewing3D, setPreviewing3D] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !previewing3D) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, previewing3D]);

  const trimmedVideo = videoUrl.trim();
  const videoIsBlob = trimmedVideo.startsWith("blob:");
  const videoInvalid = trimmedVideo !== "" && !videoIsBlob && !isValidTourUrl(trimmedVideo);
  const trimmedTour = tourUrl.trim();
  const tourInvalid = trimmedTour !== "" && !isValidTourUrl(trimmedTour);
  const canSave = !videoInvalid && !tourInvalid;

  function handleFile(file: File | undefined) {
    if (!file) return;
    setVideoUrl(URL.createObjectURL(file));
    setVideoName(file.name);
  }

  function handleSave() {
    if (!canSave) return;
    setMedia(property.id, {
      videoUrl: trimmedVideo || undefined,
      droneStyle,
      tourUrl: trimmedTour || undefined,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Medios de la propiedad"
        className="w-full max-w-xl rounded-card bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-buyer-text">Medios de la propiedad</h2>
            <p className="truncate text-xs text-buyer-text-faint">
              {property.code} · {property.location.address}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-buyer-text-muted hover:bg-agent-bg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video representativo */}
        <section className="mb-6">
          <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-buyer-text">
            <Film size={15} /> Video representativo
          </h3>
          <p className="mb-3 text-xs text-buyer-text-muted">
            Video vertical corto (el formato que se usa hoy para mostrar una propiedad). La tarjeta lo
            reproduce mudo y en loop. Si no cargás uno, se usa el recorrido dron con tus fotos.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            aria-label="Elegir video desde tu equipo"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-control border border-agent-border px-3 py-2 text-xs font-semibold text-buyer-text hover:bg-agent-bg"
            >
              <Upload size={13} /> Elegir video
            </button>
            {trimmedVideo && (
              <button
                type="button"
                onClick={() => {
                  setVideoUrl("");
                  setVideoName(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-xs font-semibold text-buyer-text-muted underline"
              >
                Quitar video
              </button>
            )}
          </div>
          <input
            type="url"
            value={videoIsBlob ? "" : videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setVideoName(null);
            }}
            placeholder="…o pegá el enlace https del video"
            aria-label="Enlace del video"
            className="mt-2 w-full rounded-control border border-agent-border px-3 py-2 text-sm outline-none placeholder:text-buyer-text-faint"
          />
          {videoName && <p className="mt-1.5 text-xs text-buyer-text-muted">✓ {videoName}</p>}
          {videoInvalid && (
            <p className="mt-1.5 text-xs text-status-red">El enlace tiene que empezar con https://</p>
          )}
          {trimmedVideo && !videoInvalid && (
            <video
              src={trimmedVideo}
              muted
              loop
              playsInline
              autoPlay
              className="mt-3 aspect-[9/16] max-h-56 rounded-lg bg-black object-cover"
            />
          )}
          {videoIsBlob && (
            <p className="mt-1.5 text-[11px] text-buyer-text-faint">
              Por ahora el video queda guardado sólo en esta sesión del navegador — falta el
              almacenamiento real (backend).
            </p>
          )}
        </section>

        {/* Estilo dron */}
        <section className="mb-6">
          <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-buyer-text">
            <Plane size={15} /> Estilo de recorrido dron
          </h3>
          <p className="mb-3 text-xs text-buyer-text-muted">
            {trimmedVideo
              ? "Esta propiedad tiene video, así que el recorrido dron queda como respaldo (se usa si el video no carga)."
              : "Sin video, la tarjeta arma un recorrido tipo dron animando tus fotos. Elegí el movimiento de cámara."}
          </p>
          <div role="radiogroup" aria-label="Estilo de recorrido dron" className="grid grid-cols-2 gap-2.5">
            {DRONE_STYLES.map((st) => {
              const selected = droneStyle === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setDroneStyle(st.id)}
                  className={cn(
                    "overflow-hidden rounded-xl border-2 text-left transition-colors",
                    selected ? "border-accent" : "border-agent-border hover:border-buyer-text-faint"
                  )}
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-buyer-text">
                    {property.photos.length > 0 ? (
                      <DroneReel photos={property.photos.slice(0, 1)} style={st.id} alt="" />
                    ) : null}
                  </div>
                  <div className="p-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-buyer-text">
                      {st.label}
                      {st.id === DEFAULT_DRONE_STYLE && (
                        <span className="rounded-pill bg-accent-tint px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                          PREDETERMINADO
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-buyer-text-muted">
                      {st.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recorrido 3D */}
        <section className="mb-6">
          <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-buyer-text">
            <Box size={15} /> Recorrido 3D (tipo Matterport)
          </h3>
          <p className="mb-3 text-xs text-buyer-text-muted">
            Pegá el enlace del recorrido 3D de la propiedad (departamento, casa, terreno o local).
            Kasaa no genera el recorrido: necesita un escaneo hecho con Matterport u otro proveedor.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={tourUrl}
              onChange={(e) => setTourUrl(e.target.value)}
              placeholder="https://my.matterport.com/show/?m=…"
              aria-label="Enlace del recorrido 3D"
              className="min-w-0 flex-1 rounded-control border border-agent-border px-3 py-2 text-sm outline-none placeholder:text-buyer-text-faint"
            />
            <button
              type="button"
              disabled={!trimmedTour || tourInvalid}
              onClick={() => setPreviewing3D(true)}
              className="shrink-0 rounded-control border border-agent-border px-3 py-2 text-xs font-semibold text-buyer-text hover:bg-agent-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              Probar
            </button>
          </div>
          {tourInvalid && (
            <p className="mt-1.5 text-xs text-status-red">El enlace tiene que empezar con https://</p>
          )}
        </section>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-control border border-agent-border py-2.5 text-sm font-semibold text-buyer-text hover:bg-agent-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="flex-1 rounded-control bg-accent py-2.5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Guardar medios
          </button>
        </div>
      </div>

      {previewing3D && (
        <Tour3DViewer
          title={property.title}
          tourUrl={trimmedTour}
          onClose={() => setPreviewing3D(false)}
        />
      )}
    </div>
  );
}
