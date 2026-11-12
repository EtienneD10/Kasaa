"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Box,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Grid3x3,
  Hourglass,
  MapPin,
  MapPinned,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { buildInitialQueue, nextSimilar, type QueueItem } from "@/lib/immersive-queue";
import { usePropertyMedia } from "@/lib/property-media";
import { useLoginGate } from "@/lib/login-gate";
import { DayTimeSelector } from "@/components/booking/DayTimeSelector";
import { SCHEDULING_IDLE_CLOSE_MS } from "@/components/property/PropertyCard";
import { PropertyMedia } from "@/components/property/PropertyMedia";
import { PropertyQuickLookModal } from "@/components/property/PropertyQuickLookModal";
import { Tour3DViewer } from "@/components/property/Tour3DViewer";
import type { AvailabilitySlot, Property } from "@/types";

/**
 * Feed inmersivo (spec §3.6) — video vertical 9:16 a pantalla completa,
 * swipe continuo hacia arriba/abajo. Se abre desde "Ver visita inmersiva
 * completa" del Quick Look.
 *
 * - **Overlay sobre Discovery, no una ruta aparte**: Discovery queda montado
 *   debajo, así que "Volver a resultados" vuelve exactamente a la misma
 *   posición de scroll y con los mismos filtros, sin tener que serializarlos
 *   en la URL (lo que pide la spec).
 * - **Swipe = scroll-snap nativo** (`snap-y snap-mandatory`): funciona con
 *   touch, rueda, trackpad y las flechas ↑/↓ del teclado sin librería de
 *   gestos. En desktop, además, botones ↑/↓ al costado de la columna.
 * - **Cola de similares** (`lib/immersive-queue.ts`): arranca con la
 *   propiedad elegida y se extiende a medida que se avanza, siempre a partir
 *   de la última vista. Sale del subconjunto ya filtrado de Discovery
 *   (`pool`), así que respeta los filtros activos; cuando se agota, recicla.
 * - **Overlays iguales a la tarjeta** (`PropertyCard`, estado Default):
 *   badges, pila de acciones (grilla → Quick Look, mapa decorativo, "+"
 *   favorito), barrio/título/specs/precio/vistas/agente y los botones "Ver
 *   en 3D"/"Solicitar Visita". Se suma el sonido (sólo si hay video real) y
 *   un pill con el motivo por el que entró a la cola ("Mismo barrio").
 * - **Booking**: panel que sube desde abajo DENTRO de la columna (no un
 *   modal aparte), con el mismo `DayTimeSelector` y el mismo flujo
 *   post-solicitud que la tarjeta (autocierre a los 3,5 s, CTA ámbar
 *   "Solicitud enviada", Cancelar anula de verdad). El estado de solicitudes
 *   vive en `DiscoveryClient`, así que lo que se pide acá se ve en la
 *   tarjeta al volver y viceversa.
 *
 * Sólo las slides vecinas a la activa (±1) montan `PropertyMedia`; el resto
 * es la primera foto estática — mismo criterio de rendimiento que la grilla.
 */

const SENT_PANEL_AUTOCLOSE_MS = 3500;

interface ImmersiveFeedProps {
  startProperty: Property;
  /** Propiedades de donde sale la cola — el resultado filtrado de Discovery. */
  pool: Property[];
  favorites: Set<string>;
  onToggleFavorite: (propertyId: string) => void;
  requestedVisits: Map<string, AvailabilitySlot>;
  onRequestVisit: (propertyId: string, slot: AvailabilitySlot) => void;
  onCancelVisit: (propertyId: string) => void;
  onClose: () => void;
}

type SheetState = { mode: "schedule" } | { mode: "sent"; autoClose: boolean };

export function ImmersiveFeed({
  startProperty,
  pool,
  favorites,
  onToggleFavorite,
  requestedVisits,
  onRequestVisit,
  onCancelVisit,
  onClose,
}: ImmersiveFeedProps) {
  const [queue, setQueue] = useState<QueueItem[]>(() => buildInitialQueue(startProperty, pool));
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [quickLook, setQuickLook] = useState<Property | null>(null);
  const [show3D, setShow3D] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { requireBuyer } = useLoginGate();

  const active = queue[activeIndex].property;
  const { tourUrl } = usePropertyMedia(active);

  const closeSheet = useCallback(() => {
    setSheet(null);
    setSelectedDate(null);
    setSelectedTime(null);
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: i * el.clientHeight, behavior: "smooth" });
  }, []);

  // Slide activa = la que ocupa la mayor parte de la columna. Al llegar
  // cerca del final se agrega el próximo lote de similares (a partir de la
  // propiedad que se está viendo, no de la primera).
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.index);
          setActiveIndex(i);
          setQueue((q) =>
            i >= q.length - 2 ? [...q, ...nextSimilar(q[i].property, pool, q)] : q
          );
        }
      },
      { root, threshold: 0.6 }
    );
    root.querySelectorAll("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [queue.length, pool]);

  // Bloquea el scroll de Discovery debajo (sin moverlo: la posición queda
  // intacta para "Volver a resultados").
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Quick Look y el visor 3D tienen su propio Escape.
      if (quickLook || show3D) return;
      if (e.key === "Escape") {
        if (sheet) closeSheet();
        else onClose();
      } else if (!sheet && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        scrollToIndex(
          Math.max(0, Math.min(queue.length - 1, activeIndex + (e.key === "ArrowDown" ? 1 : -1)))
        );
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [quickLook, show3D, sheet, activeIndex, queue.length, closeSheet, onClose, scrollToIndex]);

  // Mismo cierre por inactividad que el agendado de la tarjeta.
  useEffect(() => {
    if (sheet?.mode !== "schedule" || quickLook || show3D) return;
    const id = setTimeout(closeSheet, SCHEDULING_IDLE_CLOSE_MS);
    return () => clearTimeout(id);
  }, [sheet, quickLook, show3D, selectedDate, selectedTime, closeSheet]);

  useEffect(() => {
    if (sheet?.mode !== "sent" || !sheet.autoClose) return;
    const id = setTimeout(closeSheet, SENT_PANEL_AUTOCLOSE_MS);
    return () => clearTimeout(id);
  }, [sheet, closeSheet]);

  const requestedSlot = requestedVisits.get(active.id);
  const canConfirm = !!(selectedDate && selectedTime);

  function openBooking() {
    if (requestedSlot) {
      setSheet({ mode: "sent", autoClose: false });
      return;
    }
    // Agendar requiere sesión de comprador (mismo gate que la tarjeta).
    requireBuyer(() => setSheet({ mode: "schedule" }), { propertyTitle: active.title });
  }

  function confirmVisit() {
    if (!selectedDate || !selectedTime) return;
    onRequestVisit(active.id, { date: selectedDate, time: selectedTime });
    setSheet({ mode: "sent", autoClose: true });
  }

  /** "Ver visita inmersiva" de una propiedad relacionada dentro del Quick
   * Look: se mete justo después de la actual y se salta a ella. */
  function jumpToProperty(p: Property) {
    setQuickLook(null);
    if (p.id === active.id) return;
    setQueue((q) => [
      ...q.slice(0, activeIndex + 1),
      { property: p, reason: "Elegida por vos" },
      ...q.slice(activeIndex + 1),
    ]);
    requestAnimationFrame(() => scrollToIndex(activeIndex + 1));
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Feed inmersivo"
      className="fixed inset-0 z-[45] flex items-center justify-center bg-black"
    >
      {/* Columna 9:16 — en mobile ocupa toda la pantalla. */}
      <div className="relative h-dvh w-full max-w-[calc(100dvh*9/16)]">
        <div
          ref={scrollerRef}
          className={cn(
            "h-full snap-y snap-mandatory overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Con el panel de booking abierto no se puede deslizar a otra slide.
            sheet ? "overflow-y-hidden" : "overflow-y-scroll"
          )}
        >
          {queue.map((item, i) => (
            <FeedSlide
              key={`${i}-${item.property.id}`}
              index={i}
              item={item}
              mountMedia={Math.abs(i - activeIndex) <= 1}
              isActive={i === activeIndex}
              muted={muted || i !== activeIndex}
              onToggleMute={() => setMuted((m) => !m)}
              isFavorite={favorites.has(item.property.id)}
              onToggleFavorite={onToggleFavorite}
              requested={requestedVisits.has(item.property.id)}
              onOpenQuickLook={() => setQuickLook(item.property)}
              onOpen3D={() => setShow3D(true)}
              onBook={openBooking}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-xs font-semibold text-white hover:bg-black/80"
        >
          <ArrowLeft size={14} /> Volver a resultados
        </button>

        {activeIndex === 0 && !sheet && (
          <p className="pointer-events-none absolute inset-x-0 bottom-[42%] z-20 flex flex-col items-center text-[11px] font-semibold text-white/80 [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.7))] motion-safe:animate-bounce">
            Deslizá para ver similares
            <ChevronDown size={16} />
          </p>
        )}

        {/* Navegación ↑/↓ en desktop, al costado de la columna. */}
        <div className="absolute -right-16 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex">
          <button
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0 || !!sheet}
            aria-label="Propiedad anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronUp size={20} />
          </button>
          <button
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex >= queue.length - 1 || !!sheet}
            aria-label="Propiedad siguiente"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Panel de booking — sube desde abajo dentro de la columna. */}
        <div
          onClick={closeSheet}
          className={cn(
            "absolute inset-0 z-30 bg-black/40 transition-opacity duration-300",
            sheet ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-40 rounded-t-3xl bg-white p-5 shadow-2xl transition-transform duration-300 ease-out",
            sheet ? "translate-y-0" : "translate-y-full"
          )}
          aria-hidden={!sheet}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-buyer-border" />
          <button
            onClick={closeSheet}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-buyer-text-muted hover:bg-buyer-bg"
          >
            <X size={16} />
          </button>

          {sheet?.mode === "sent" && requestedSlot ? (
            <div className="flex flex-col items-center py-3 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-buyer-border">
                <Hourglass size={20} className="text-buyer-text-muted" />
              </div>
              <p className="text-base font-semibold text-buyer-text">Solicitud enviada</p>
              <p className="mt-1.5 text-xs text-buyer-text-muted">
                Tu agente {active.agent.name} recibirá una notificación por WhatsApp y confirmará tu
                visita a la brevedad.
              </p>
              <span className="mt-4 rounded-full bg-status-amber-bg px-3 py-1.5 text-xs font-semibold text-status-amber-text">
                Pendiente de confirmación
              </span>
              <button
                onClick={() => {
                  onCancelVisit(active.id);
                  closeSheet();
                }}
                className="mt-4 text-xs font-semibold text-buyer-text-muted underline"
              >
                Cancelar
              </button>
              <button
                onClick={closeSheet}
                className="mt-2 text-xs font-semibold text-buyer-text-faint underline"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-buyer-text-faint">
                <CalendarClock size={12} /> Agenda tu visita
              </p>
              <p className="truncate pr-8 text-sm font-semibold text-buyer-text">{active.title}</p>
              <DayTimeSelector
                slots={active.availability}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setSelectedTime(null);
                }}
                onSelectTime={setSelectedTime}
              />
              <div className="flex items-center gap-3 border-t border-buyer-border pt-3">
                <AgentAvatar property={active} className="h-11 w-11 border-white" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-buyer-text">
                    {active.agent.name}
                  </p>
                  <p className="truncate text-sm text-buyer-text-muted">
                    Asesor/a {active.agent.agency}
                  </p>
                </div>
              </div>
              <button
                disabled={!canConfirm}
                onClick={confirmVisit}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-colors",
                  canConfirm
                    ? "bg-accent-soft text-black"
                    : "cursor-not-allowed bg-buyer-bg text-buyer-text-faint"
                )}
              >
                <CalendarClock size={13} /> Solicitar Visita
              </button>
            </div>
          )}
        </div>
      </div>

      {show3D && (
        <Tour3DViewer title={active.title} tourUrl={tourUrl} onClose={() => setShow3D(false)} />
      )}

      {quickLook && (
        <PropertyQuickLookModal
          property={quickLook}
          onClose={() => setQuickLook(null)}
          isFavorite={favorites.has(quickLook.id)}
          onToggleFavorite={onToggleFavorite}
          onRequestVisitClick={() => {
            setQuickLook(null);
            openBooking();
          }}
          onOpenImmersive={jumpToProperty}
        />
      )}
    </div>,
    document.body
  );
}

function AgentAvatar({ property, className }: { property: Property; className?: string }) {
  return (
    <div className={cn("relative shrink-0 rounded-full border-2 bg-buyer-border", className)}>
      <div className="h-full w-full overflow-hidden rounded-full">
        {property.agent.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.agent.avatarUrl}
            alt={property.agent.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-black/60 bg-accent" />
    </div>
  );
}

interface FeedSlideProps {
  index: number;
  item: QueueItem;
  mountMedia: boolean;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  isFavorite: boolean;
  onToggleFavorite: (propertyId: string) => void;
  requested: boolean;
  onOpenQuickLook: () => void;
  onOpen3D: () => void;
  onBook: () => void;
}

function FeedSlide({
  index,
  item,
  mountMedia,
  isActive,
  muted,
  onToggleMute,
  isFavorite,
  onToggleFavorite,
  requested,
  onOpenQuickLook,
  onOpen3D,
  onBook,
}: FeedSlideProps) {
  const { property, reason } = item;
  const { videoUrl } = usePropertyMedia(property);
  const statusLabel = property.operation === "venta" ? "VENTA" : "ALQUILER";

  return (
    <section
      data-index={index}
      aria-label={property.title}
      className="relative flex h-full snap-start snap-always flex-col overflow-hidden bg-buyer-text"
    >
      {mountMedia ? (
        <PropertyMedia property={property} muted={muted} />
      ) : (
        property.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.photos[0]}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

      {/* Badges — debajo del botón "Volver a resultados". */}
      <div className="relative z-10 flex items-start justify-between gap-1.5 px-3 pt-14">
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {statusLabel}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white">
            <Box size={10} /> 3D Tour
          </span>
          {reason && (
            <span className="flex items-center gap-1 rounded-full border border-accent/60 bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white">
              <Sparkles size={10} className="text-accent" /> {reason}
            </span>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
          <Clock size={10} /> {timeAgo(property.createdAt)}
        </span>
      </div>

      {/* Acciones flotantes — mismas que la tarjeta + sonido si hay video. */}
      <div className="absolute right-3 top-[52%] z-10 flex -translate-y-1/2 flex-col items-center gap-4">
        <button
          onClick={onOpenQuickLook}
          className="flex h-10 w-10 items-center justify-center text-white [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.6))]"
          aria-label="Ver más detalles"
        >
          <Grid3x3 size={22} />
        </button>
        <button
          title="Próximamente: ver en el mapa"
          className="flex h-10 w-10 items-center justify-center text-white [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.6))]"
          aria-label="Ver ubicación en el mapa"
        >
          <MapPinned size={22} />
        </button>
        {videoUrl && (
          <button
            onClick={onToggleMute}
            className="flex h-10 w-10 items-center justify-center text-white [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.6))]"
            aria-label={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
        )}
        <button
          onClick={() => onToggleFavorite(property.id)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
            isFavorite ? "bg-white text-accent" : "bg-accent text-black"
          )}
          aria-label="Marcar como favorito"
          aria-pressed={isFavorite}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="relative z-10 mt-auto space-y-2 p-4 pb-6 pr-16 text-white">
        <p className="flex items-center gap-1 text-xs font-semibold text-accent">
          <MapPin size={11} /> {property.location.neighborhood}, {property.location.city}
        </p>
        <p className="line-clamp-2 font-display text-2xl font-semibold leading-tight">
          {property.title}
        </p>
        <p className="text-sm font-medium text-white/90">
          {property.bedrooms} Dorm <span className="text-white/50">|</span> {property.bathrooms}{" "}
          Baños <span className="text-white/50">|</span>{" "}
          {property.characteristics.superficieCubierta} m²
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="min-w-0 truncate text-2xl font-bold">
            {formatPrice(property.price, property.currency)}
          </p>
          {/* Vistas: mismo placeholder que PropertyCard/InterstitialCard. */}
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white/90">
            <Eye size={14} /> {Math.round(property.favoriteCount * 3.4).toLocaleString("es-AR")}
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-black/50 p-2">
          <AgentAvatar property={property} className="h-9 w-9 border-white/70" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{property.agent.name}</p>
            <p className="truncate text-xs text-white/75">Asesor/a {property.agent.agency}</p>
          </div>
        </div>
        <div className="-mr-12 flex gap-2 pt-1">
          <button
            onClick={onOpen3D}
            tabIndex={isActive ? 0 : -1}
            className="flex flex-1 items-center justify-center rounded-xl border border-white/30 bg-white py-3 text-xs font-bold text-buyer-text"
          >
            Ver en 3D
          </button>
          {requested ? (
            <button
              onClick={onBook}
              tabIndex={isActive ? 0 : -1}
              aria-label="Solicitud enviada — ver estado"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-status-amber-bg py-3 text-xs font-bold text-status-amber-text"
            >
              <Clock size={13} /> Solicitud enviada
            </button>
          ) : (
            <button
              onClick={onBook}
              tabIndex={isActive ? 0 : -1}
              className="flex flex-1 items-center justify-center rounded-xl bg-accent py-3 text-xs font-bold text-black"
            >
              Solicitar Visita
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
