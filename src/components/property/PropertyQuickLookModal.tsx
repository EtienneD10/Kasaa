"use client";

import { useEffect, useState } from "react";
import {
  X,
  Box,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Heart,
  Compass,
  Building2,
  ArrowUpDown,
  Wallet,
  Car,
  Landmark,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { relatedProperties } from "@/lib/mock-data";
import type { Property } from "@/types";

/**
 * Quick Look — modal de vista expandida, reconstruido a partir del frame
 * real de Figma (`desktop-discovery-default-cards + account-dropdown-menu`).
 * Se abre desde el ícono de galería (arriba) de la pila de acciones
 * flotantes de `PropertyCard` — confirmado por el usuario sobre la
 * referencia con flecha (los otros dos íconos de esa pila, mute y resumen
 * IA, siguen sin acción todavía).
 *
 * Contenido: hero de fotos (sin video real todavía, ver TRACKING.md
 * decisión abierta #3 — el toggle "Vídeo" queda deshabilitado),
 * características (mapea 1:1 con `PropertyCharacteristics`), financiación
 * (mapea con `PropertyFinancing`), carrusel "También te puede interesar"
 * (clickear un mini-card navega DENTRO del modal sin cerrarlo) y un
 * placeholder de mapa (mismo patrón que `MapaPlaceholder` en Discovery —
 * falta elegir proveedor, decisión abierta #5).
 *
 * "Solicitar Visita" acá no repite el selector de día/hora — cierra el
 * modal y expande la tarjeta de origen a su estado de scheduling (que sí
 * tiene el `DayTimeSelector`), vía `onRequestVisitClick`.
 */
interface PropertyQuickLookModalProps {
  property: Property;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite?: (propertyId: string) => void;
  onRequestVisitClick: () => void;
}

const ORIENTACION_LABEL: Record<string, string> = {
  norte: "Norte",
  sur: "Sur",
  este: "Este",
  oeste: "Oeste",
  combinada: "Combinada",
};

const COCHERA_LABEL: Record<string, string> = {
  incluida: "Cochera incluida",
  opcional: "Cochera opcional",
  no_tiene: "Sin cochera",
};

export function PropertyQuickLookModal({
  property: initialProperty,
  onClose,
  isFavorite,
  onToggleFavorite,
  onRequestVisitClick,
}: PropertyQuickLookModalProps) {
  // `PropertyQuickLookModal` se monta/desmonta con `showQuickLook` en
  // `PropertyCard` (no queda vivo entre distintas `initialProperty`), así
  // que `useState(initialProperty)` ya alcanza para arrancar sincronizado
  // — no hace falta un efecto que lo reasigne en cada mount.
  const [property, setProperty] = useState(initialProperty);
  const [photoIndex, setPhotoIndex] = useState(0);

  function selectRelated(next: Property) {
    setProperty(next);
    setPhotoIndex(0);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const c = property.characteristics;
  const f = property.financing;
  const statusLabel = property.operation === "venta" ? "VENTA" : "ALQUILER";
  const nextSlot = property.availability[0];
  const related = relatedProperties(property);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-card bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
        >
          <X size={16} />
        </button>

        {/* Hero — fotos (sin video real todavía) */}
        <div className="relative aspect-[16/10] w-full bg-buyer-text">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.photos[photoIndex]}
            alt={property.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute left-3 top-3 flex gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-buyer-text">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {statusLabel}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Box size={10} /> 3D Tour
            </span>
          </div>

          <div className="absolute right-12 top-3 flex overflow-hidden rounded-full bg-black/45 text-[10px] font-semibold text-white backdrop-blur-sm">
            <button
              title="Próximamente: video real"
              className="flex items-center gap-1 px-2.5 py-1 text-white/50"
            >
              <Play size={10} /> Vídeo
            </button>
            <span className="rounded-full bg-white px-2.5 py-1 text-buyer-text">Fotos</span>
          </div>

          {property.photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setPhotoIndex((i) => (i - 1 + property.photos.length) % property.photos.length)
                }
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPhotoIndex((i) => (i + 1) % property.photos.length)}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {/* Título, precio, agente */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs font-semibold text-accent">
                <MapPin size={11} /> {property.location.neighborhood}, {property.location.city}
              </p>
              <p className="text-xs capitalize text-buyer-text-faint">{property.type}</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-buyer-text">
                {property.title}
              </h2>
            </div>
            {nextSlot && (
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-buyer-border px-2.5 py-1 text-[10px] font-semibold text-buyer-text-muted">
                <CalendarClock size={11} /> Visita desde{" "}
                {new Date(nextSlot.date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-buyer-text-muted">
            <span className="flex items-center gap-1">
              <Bed size={14} /> {property.bedrooms} Dorm
            </span>
            <span className="text-buyer-border">|</span>
            <span className="flex items-center gap-1">
              <Bath size={14} /> {property.bathrooms} Baños
            </span>
            <span className="text-buyer-border">|</span>
            <span className="flex items-center gap-1">
              <Maximize size={14} /> {c.superficieCubierta} m²
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-2xl font-bold text-buyer-text">
              {formatPrice(property.price, property.currency)}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-buyer-border">
                  {property.agent.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.agent.avatarUrl}
                      alt={property.agent.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-semibold text-buyer-text">{property.agent.name}</p>
                  <p className="text-[11px] text-buyer-text-faint">{property.agent.agency}</p>
                </div>
              </div>
              <button
                onClick={() => onToggleFavorite?.(property.id)}
                className="flex items-center gap-1 text-buyer-text-muted"
                aria-label="Marcar como favorito"
              >
                <Heart size={16} className={isFavorite ? "fill-accent text-accent" : ""} />
                <span className="text-xs font-medium">{property.favoriteCount}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              title="Próximamente: feed inmersivo"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-buyer-border bg-white py-3 text-xs font-bold text-buyer-text"
            >
              <Play size={13} /> Ver visita inmersiva completa
            </button>
            {property.id === initialProperty.id ? (
              <button
                onClick={onRequestVisitClick}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-soft py-3 text-xs font-bold text-black"
              >
                <CalendarClock size={13} /> Solicitar Visita
              </button>
            ) : (
              // Navegaste a una propiedad relacionada dentro del modal — el
              // booking real vive en la tarjeta de origen (PropertyCard), no
              // acá, así que no hay una tarjeta "de esta tercera propiedad"
              // para expandir. Queda deshabilitado hasta que Quick Look
              // tenga su propio flujo de booking inline.
              <button
                disabled
                title="Cerrá el Quick Look y buscá esta propiedad en el listado para agendar"
                className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-buyer-bg py-3 text-xs font-bold text-buyer-text-faint"
              >
                <CalendarClock size={13} /> Solicitar Visita
              </button>
            )}
          </div>

          {/* Características — mapea 1:1 con PropertyCharacteristics */}
          <div className="mt-6 border-t border-buyer-border pt-5">
            <h3 className="mb-3 text-sm font-semibold text-buyer-text">Características</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-buyer-text-muted">
              <Feature icon={Compass} label={`Orientación ${c.orientacion.map((o) => ORIENTACION_LABEL[o]).join("/")}`} />
              {c.piso !== undefined && (
                <Feature icon={Building2} label={`Piso ${c.piso}${c.totalPisos ? ` de ${c.totalPisos}` : ""}`} />
              )}
              <Feature icon={ArrowUpDown} label={c.ascensor ? "Con ascensor" : "Sin ascensor"} />
              {c.expensas !== undefined && (
                <Feature icon={Wallet} label={`Expensas ${formatPrice(c.expensas, property.currency)}/mes`} />
              )}
              <Feature icon={Car} label={COCHERA_LABEL[c.cochera]} />
              <Feature
                icon={Maximize}
                label={`${c.superficieCubierta} m² cubiertos${c.superficieDescubierta ? ` + ${c.superficieDescubierta} m² descub.` : ""}`}
              />
            </div>
          </div>

          {/* Financiación — mapea 1:1 con PropertyFinancing */}
          {(f.aptoCreditoBancario || f.esDesarrollo) && (
            <div className="mt-5 space-y-2.5 border-t border-buyer-border pt-5">
              {f.aptoCreditoBancario && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-buyer-text">
                  <Landmark size={15} className="text-buyer-text-muted" /> Apto crédito bancario
                </p>
              )}
              {f.esDesarrollo && (
                <div className="rounded-xl bg-accent-tint p-3 text-xs text-buyer-text">
                  <p className="font-semibold">Financiación del desarrollo</p>
                  <p className="mt-0.5 text-buyer-text-muted">
                    {f.anticipoPorcentaje}% anticipo · {f.cuotas} cuotas
                    {f.plazoEntrega ? ` · Entrega estimada ${f.plazoEntrega}` : ""}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* También te puede interesar */}
          {related.length > 0 && (
            <div className="mt-6 border-t border-buyer-border pt-5">
              <h3 className="mb-3 text-sm font-semibold text-buyer-text">También te puede interesar</h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {related.map((rp) => (
                  <button
                    key={rp.id}
                    onClick={() => selectRelated(rp)}
                    className="w-32 shrink-0 overflow-hidden rounded-xl border border-buyer-border text-left transition-colors hover:border-buyer-text"
                  >
                    {/* Foto con badges y specs superpuestos — mismo lenguaje
                        visual que la tarjeta principal (`PropertyCard`), no
                        un thumbnail plano con texto abajo. */}
                    <div className="relative aspect-[4/3] w-full bg-buyer-text">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rp.photos[0]} alt={rp.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                      <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-semibold text-white backdrop-blur-sm">
                        <Box size={8} /> 3D Tour
                      </span>
                      <span className="absolute right-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] text-white backdrop-blur-sm">
                        {timeAgo(rp.createdAt)}
                      </span>

                      <div className="absolute inset-x-1 bottom-1 flex items-center gap-1.5 text-[9px] font-medium text-white">
                        <span className="flex items-center gap-0.5">
                          <Bed size={9} /> {rp.bedrooms}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Bath size={9} /> {rp.bathrooms}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Maximize size={9} /> {rp.characteristics.superficieCubierta}m²
                        </span>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <p className="line-clamp-1 text-[11px] font-semibold text-buyer-text">{rp.title}</p>
                      <div className="mt-0.5 flex items-center justify-between">
                        <p className="text-xs font-bold text-buyer-text">
                          {formatPrice(rp.price, rp.currency)}
                        </p>
                        <span className="flex items-center gap-0.5 text-buyer-text-faint">
                          <Heart size={10} /> <span className="text-[10px]">{rp.favoriteCount}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ubicación — placeholder, mismo criterio que MapaPlaceholder de
              Discovery hasta elegir proveedor de mapas (decisión abierta #5) */}
          <div className="mt-6 border-t border-buyer-border pt-5">
            <h3 className="mb-3 text-sm font-semibold text-buyer-text">Ubicación</h3>
            <div className="relative flex h-32 items-center justify-center rounded-xl bg-buyer-bg">
              <span className={cn("h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-accent-tint")} />
            </div>
            <p className="mt-2 text-xs text-buyer-text-muted">
              {property.location.address} · {property.location.neighborhood}, {property.location.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Compass; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon size={14} className="shrink-0 text-buyer-text-faint" /> {label}
    </span>
  );
}
