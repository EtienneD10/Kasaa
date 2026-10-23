"use client";

import { memo, useEffect, useState } from "react";
import {
  Clock,
  Eye,
  Grid3x3,
  MapPinned,
  Plus,
  Box,
  CalendarClock,
  Hourglass,
  MapPin,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import type { Property, AvailabilitySlot } from "@/types";
import { DayTimeSelector } from "@/components/booking/DayTimeSelector";
import { PropertyQuickLookModal } from "@/components/property/PropertyQuickLookModal";
import { PropertyMedia } from "@/components/property/PropertyMedia";
import { Tour3DViewer } from "@/components/property/Tour3DViewer";
import { usePropertyMedia } from "@/lib/property-media";

/**
 * Componente maestro del sistema — reconstruido a partir del archivo real
 * de Figma (`property-card-booking-states`, node 492:2796), no de una
 * interpretación libre de la spec. Tres estados:
 *
 * 1. Default: foto vertical full-bleed (todo — badges, ubicación, título,
 *    specs, precio, agente, favoritos — vive superpuesto sobre la imagen
 *    con gradiente); solo el par de botones vive en una franja blanca real.
 * 2. Scheduling: la imagen se achica, aparece un footer blanco con
 *    selector de día/hora + fila de agente.
 * 3. Sent: panel de confirmación con reloj de arena + mensaje + pill.
 *
 * El pill "Pendiente de confirmación" del estado Sent usa colores ámbar
 * (`status-amber-bg` #FEF3C7 / `status-amber-text` #92400E, confirmados
 * por el usuario sobre la referencia real) — es una excepción puntual e
 * intencional a la regla de la spec §1.2 de "sin colores de estado en la
 * superficie de comprador", no un error: se mantiene neutro el resto de
 * la superficie compradora, pero este indicador específico sí usa ámbar
 * en el Figma real. Ver TRACKING.md, sección "Rediseño 2026-08".
 *
 * Reutilizado (con variantes) en: Discovery, Quick Look, Feed inmersivo,
 * preview de Marketing.
 *
 * Re-chequeado contra el frame resumen "Property Card — Estados de
 * Booking" (4 estados lado a lado). Ajustes de esa pasada:
 * - El botón "Solicitar Visita" (y el pill "HOY"/horario seleccionado de
 *   `DayTimeSelector`) usan un verde MÁS CLARO que el accent neón de
 *   badges/bordes — nuevo token `accent-soft` (#74fa79), sampleado
 *   directo del PNG de referencia. El accent neón (#00ff66) se mantiene
 *   para badges, bordes, dots y links.
 * - "Ver más" (junto a "Agenda tu visita inmersiva") ahora abre el Quick
 *   Look de verdad — antes quedaba decorativo porque ese modal no
 *   existía todavía cuando se escribió esa línea.
 *
 * FLUJO POST-SOLICITUD (pedido posterior): el panel "Solicitud enviada" se
 * cierra solo a los 3,5 s y la tarjeta vuelve al estado inicial con el CTA
 * convertido en "Solicitud enviada 🕐" (ámbar), para poder seguir
 * coordinando otras visitas. Tocar ese botón reabre el panel (sin
 * autocierre) con "Cancelar" (anula de verdad) y "Cerrar". Ver TRACKING.md.
 *
 * MEDIOS (pedido posterior): el fondo de la tarjeta ya no es una `<img>`
 * fija sino `PropertyMedia` — video en loop si la propiedad tiene
 * `videoUrl`, o recorrido tipo dron simulado con las fotos (estilo
 * predeterminado "Dron Kasaa"). "Ver en 3D" abre `Tour3DViewer` con el
 * `tourUrl` que cargó el agente. El estado Default muestra al agente
 * (avatar + nombre + agencia) en una fila propia. Detalle y límites en
 * TRACKING.md, "Medios de la propiedad".
 *
 * CORRECCIÓN (referencia "tarjeta principal", buena resolución 1051×617,
 * un solo card recortado con anotación del usuario) — el estado Default
 * tenía varios desvíos que se venían arrastrando de una pasada anterior
 * ("seguimos con el mismo problema", según el usuario) y se corrigieron acá:
 * - **No hay franja blanca en el estado Default**: los dos botones
 *   ("Ver en 3D"/"Solicitar Visita") flotan sobre la propia foto, al
 *   pie de la tarjeta — no en un footer blanco separado. El footer
 *   blanco real sigue existiendo para los estados Scheduling/Sent (no
 *   mostrados en esta referencia), que no se tocaron.
 * - **Pila de acciones flotantes corregida**: la referencia muestra 3
 *   íconos bien distintos a los que había (`Images`/`Volume2`/`Zap`) —
 *   ahora son grilla (`Grid3x3`, abre el Quick Look, mismo criterio que
 *   antes), ubicación en círculo (`MapPinned`, decorativo — ver en mapa,
 *   sin mapa real todavía, decisión abierta #5) y un círculo verde con
 *   "+" que ahora es el toggle real de favorito (antes vivía como
 *   corazón junto al precio). Además la pila ya no queda centrada en
 *   toda la altura de la foto — en la referencia arranca más abajo,
 *   cerca de donde empieza el bloque de texto inferior.
 * - **Pill "VENTA" corregido**: fondo oscuro traslúcido (como los otros
 *   2 badges), no blanco — con dot y texto en verde accent, confirmado
 *   sampleando el PNG (RGB del dot ≈ 0,255,91, el mismo accent neón).
 * - **Ícono de reloj agregado al pill de tiempo** ("🕐 Hace 2h") — antes
 *   sólo mostraba el texto.
 * - **Indicador junto al precio**: la referencia muestra un círculo
 *   simple + número (no un corazón) — se reinterpretó como vistas
 *   (`Eye`), mismo criterio ya usado en `InterstitialCard.tsx`
 *   (`views = favoriteCount * 3.4`, documentado ahí como placeholder sin
 *   campo propio en el modelo) — queda de solo lectura, ya no es el
 *   toggle de favorito (eso se movió al botón "+").
 * - **Botones sin ícono**: la referencia muestra "Ver en 3D"/"Solicitar
 *   Visita" en texto plano, sin `Box`/`CalendarClock` — se sacaron los
 *   íconos sólo en el estado Default (el estado Scheduling, no
 *   mostrado acá, mantiene el suyo).
 * - **"Solicitar Visita" en accent NEÓN, no accent-soft, en este
 *   estado**: el PNG sampleaba (0,255,91) — prácticamente idéntico a
 *   `--color-accent` (#00ff66), no a `accent-soft` (#74fa79). Esto
 *   contradice la decisión previa (arriba, "Re-chequeado…") que había
 *   fijado accent-soft para este mismo botón a partir de otra
 *   referencia — se le avisó al usuario de la contradicción entre
 *   ambas fuentes; por ahora sólo se corrigió el estado Default (el
 *   único que muestra esta referencia nueva), el botón del estado
 *   Scheduling y el de `PropertyQuickLookModal` se dejaron en
 *   accent-soft hasta confirmar si también hay que cambiarlos.
 * - **Specs (Dorm/Baños/m²) sin píldora ni íconos**: reusaban por error
 *   el mismo tratamiento oscuro con íconos (`Bed`/`Bath`/`Maximize`) de
 *   los badges superiores; la referencia las muestra en texto blanco
 *   plano directo sobre la foto. Corregido.
 * - **Grid/pin de la pila flotante sin círculo de fondo**: sólo el "+"
 *   lleva círculo sólido (verde); grilla y ubicación son ícono blanco
 *   con sombra directo sobre la foto, sin el círculo negro traslúcido
 *   que tenían los tres al principio.
 * - **Overflow precio/avatar/vistas**: no viene de la referencia sino
 *   del ancho angosto de la grilla de 3 columnas de Discovery — precios
 *   de venta largos (ej. US$2.980.000+) empujaban el avatar+vistas
 *   fuera de la tarjeta y el `overflow-hidden` del contenedor los
 *   recortaba. Precio bajado a `text-xl` (antes `text-2xl`, con
 *   `truncate` de resguardo) y grupo avatar+vistas marcado `shrink-0`;
 *   verificado contra el precio más alto del mock (US$3.800.000), ya
 *   entra completo.
 */
const SENT_PANEL_AUTOCLOSE_MS = 3500;

interface PropertyCardProps {
  property: Property;
  onRequestVisit: (propertyId: string, slot: AvailabilitySlot) => void;
  onCancelVisit?: (propertyId: string) => void;
  onToggleFavorite?: (propertyId: string) => void;
  isFavorite?: boolean;
  className?: string;
}

function PropertyCardInner({
  property,
  onRequestVisit,
  onCancelVisit,
  onToggleFavorite,
  isFavorite = false,
  className,
}: PropertyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [requestSent, setRequestSent] = useState<AvailabilitySlot | null>(null);
  // Arranca sin día seleccionado — el frame `property-card-booking-states`
  // de Figma muestra "SIN SELECCIONAR" como un paso propio (solo la fila de
  // días, sin fila de horarios, botón deshabilitado) antes de
  // "DÍA + HORA SELECCIONADOS". Antes preseleccionábamos la fecha
  // destacada/la primera al expandir, lo que saltaba ese paso.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // Panel "Solicitud enviada": se muestra al confirmar y se cierra solo
  // (`SENT_PANEL_AUTOCLOSE_MS`) volviendo a la tarjeta inicial, donde el CTA
  // pasa a ser "Solicitud enviada 🕐" — así la persona puede seguir
  // coordinando otras visitas sin quedar atrapada en el panel. Tocar ese
  // botón lo reabre (sin autocierre) para ver el estado o cancelar.
  const [showSentPanel, setShowSentPanel] = useState(false);
  const [sentAutoClose, setSentAutoClose] = useState(false);
  const [showQuickLook, setShowQuickLook] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const { tourUrl } = usePropertyMedia(property);

  function closeSentPanel() {
    setShowSentPanel(false);
    setSentAutoClose(false);
    setExpanded(false);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  useEffect(() => {
    if (!showSentPanel || !sentAutoClose) return;
    const id = setTimeout(closeSentPanel, SENT_PANEL_AUTOCLOSE_MS);
    return () => clearTimeout(id);
  }, [showSentPanel, sentAutoClose]);

  const statusLabel = property.operation === "venta" ? "VENTA" : "ALQUILER";
  const canConfirm = !!(selectedDate && selectedTime);

  function handlePrimaryAction() {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    if (canConfirm && selectedDate && selectedTime) {
      const slot = { date: selectedDate, time: selectedTime };
      setRequestSent(slot);
      setShowSentPanel(true);
      setSentAutoClose(true);
      onRequestVisit(property.id, slot);
    }
  }

  return (
    <div
      className={cn(
        // `isolate`: los overlays internos (badges, íconos, textos: `z-10`)
        // quedan contenidos en la tarjeta. Sin esto empataban el z-index de
        // la barra de filtros sticky de Discovery (`z-10`) y, al scrollear,
        // se pintaban POR ENCIMA de ella/del navbar.
        "isolate flex flex-col overflow-hidden rounded-card border border-buyer-border bg-buyer-surface transition-shadow hover:shadow-lg",
        className
      )}
    >
      {!expanded && !showSentPanel ? (
        /* Estado Default — full-bleed real: la foto llena TODA la tarjeta
           (sin aspect-ratio fijo, alto lo da el contenido) y absolutamente
           todo, botones incluidos, vive superpuesto sobre ella con
           gradiente — no hay franja blanca acá, ver corrección arriba. */
        <div
          className="relative flex w-full flex-col overflow-hidden rounded-card bg-buyer-text"
          style={{ minHeight: 520 }}
        >
          <PropertyMedia property={property} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25" />

          {/* Badges superiores — los 3 comparten el mismo fondo oscuro
              traslúcido; "VENTA" usa dot+texto en accent (antes fondo
              blanco + texto oscuro), y el de tiempo ahora lleva ícono de
              reloj (antes sólo texto). */}
          <div className="relative z-10 flex items-start justify-between gap-1.5 p-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {statusLabel}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white">
                <Box size={10} /> 3D Tour
              </span>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
              <Clock size={10} /> {timeAgo(property.createdAt)}
            </span>
          </div>

          {/* Acciones flotantes — corregidas contra la referencia: antes
              eran galería/mute/IA (`Images`/`Volume2`/`Zap`), la
              referencia real muestra grilla/ubicación/agregar. El "+"
              verde es ahora el toggle real de favorito (antes vivía junto
              al precio, ver más abajo). Ya no queda centrada en toda la
              altura de la foto, arranca más cerca del bloque de texto.
              Los primeros dos íconos van SIN círculo de fondo (solo el
              ícono blanco con sombra directo sobre la foto) — corregido:
              antes los tres llevaban el mismo círculo negro traslúcido,
              pero la referencia sólo le da fondo sólido (verde) al "+". */}
          <div className="absolute right-3 top-[46%] z-10 flex -translate-y-1/2 flex-col items-center gap-3">
            <button
              onClick={() => setShowQuickLook(true)}
              className="flex h-9 w-9 items-center justify-center text-white [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.6))]"
              aria-label="Ver más detalles"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              title="Próximamente: ver en el mapa"
              className="flex h-9 w-9 items-center justify-center text-white [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.6))]"
              aria-label="Ver ubicación en el mapa"
            >
              <MapPinned size={18} />
            </button>
            <button
              onClick={() => onToggleFavorite?.(property.id)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                isFavorite ? "bg-white text-accent" : "bg-accent text-black"
              )}
              aria-label="Marcar como favorito"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Contenido inferior superpuesto — ubicación/título/specs/precio
              y AHORA también los botones (antes vivían en la franja
              blanca separada, ver corrección arriba). */}
          <div className="relative z-10 mt-auto space-y-2 p-4 text-white">
            <p className="flex items-center gap-1 text-xs font-semibold text-accent">
              <MapPin size={11} /> {property.location.neighborhood}
            </p>
            <p className="line-clamp-2 font-display text-lg font-semibold leading-tight">
              {property.title}
            </p>
            {/* Specs — la referencia las muestra en texto plano blanco
                directo sobre la foto, SIN píldora oscura ni íconos (a
                diferencia de lo que había antes, que copiaba el
                tratamiento de los badges superiores). Corregido acá. */}
            <p className="text-sm font-medium text-white/90">
              {property.bedrooms} Dorm <span className="text-white/50">|</span>{" "}
              {property.bathrooms} Baños <span className="text-white/50">|</span>{" "}
              {property.characteristics.superficieCubierta} m²
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="min-w-0 truncate text-xl font-bold">
                {formatPrice(property.price, property.currency)}
              </p>
              {/* Antes era el toggle de favorito (corazón). La referencia
                  muestra un círculo simple + número, sin acción — se
                  reinterpretó como vistas, mismo criterio ya usado en
                  InterstitialCard.tsx (favoriteCount*3.4, placeholder
                  documentado ahí por no haber campo propio en el modelo
                  todavía). Es de solo lectura. */}
              <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white/90">
                <Eye size={14} /> {Math.round(property.favoriteCount * 3.4).toLocaleString("es-AR")}
              </span>
            </div>
            {/* Agente — pedido del usuario: "el ícono de agente con el
                nombre y la agencia, que se note". Antes sólo había un
                avatar de 24px suelto junto al precio, sin texto. Ahora
                es una fila propia (avatar 36px con indicador en línea +
                nombre en negrita + agencia) sobre un fondo oscuro
                traslúcido para que se lea sobre cualquier foto/video. Va
                en fila aparte, no al costado del precio, porque en el
                ancho angosto de la grilla de 3 columnas no entran
                precio + nombre + agencia + vistas en una sola línea. */}
            <div className="flex items-center gap-2.5 rounded-xl bg-black/50 p-2">
              <div className="relative h-9 w-9 shrink-0 rounded-full border-2 border-white/70 bg-buyer-border">
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
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black/60 bg-accent" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-white">{property.agent.name}</p>
                <p className="truncate text-xs text-white/75">Asesor/a {property.agent.agency}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShow3D(true)}
                className="flex flex-1 items-center justify-center rounded-xl border border-white/30 bg-white py-3 text-xs font-bold text-buyer-text"
              >
                Ver en 3D
              </button>
              {requestSent ? (
                // Ya hay una visita pedida en esta propiedad: el CTA pasa a
                // ser "Solicitud enviada" + reloj (mismo ámbar del pill
                // "Pendiente de confirmación", la excepción de color ya
                // documentada). Tocarlo reabre el panel con el estado y
                // "Cancelar".
                <button
                  onClick={() => {
                    setSentAutoClose(false);
                    setShowSentPanel(true);
                  }}
                  aria-label="Solicitud enviada — ver estado"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-status-amber-bg py-3 text-xs font-bold text-status-amber-text"
                >
                  <Clock size={13} /> Solicitud enviada
                </button>
              ) : (
                <button
                  onClick={handlePrimaryAction}
                  className="flex flex-1 items-center justify-center rounded-xl bg-accent py-3 text-xs font-bold text-black"
                >
                  Solicitar Visita
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Media zone — foto full-bleed, sólo badges superiores (estados
              Scheduling/Sent, layout sin cambios de esta corrección). */}
          <div className="relative aspect-[327/400] w-full overflow-hidden bg-buyer-text">
            <PropertyMedia property={property} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25" />

            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {statusLabel}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white">
                <Box size={10} /> 3D Tour
              </span>
            </div>
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
              <Clock size={10} /> {timeAgo(property.createdAt)}
            </span>
          </div>

          {/* Franja blanca — scheduling footer */}
          {!showSentPanel && (
            <div className="bg-white p-4">
              <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-buyer-text-faint">
                  <CalendarClock size={12} /> Agenda tu visita inmersiva
                </p>
                <button
                  onClick={() => setShowQuickLook(true)}
                  className="text-[11px] font-semibold text-accent"
                >
                  Ver más
                </button>
              </div>

              <DayTimeSelector
                slots={property.availability}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setSelectedTime(null);
                }}
                onSelectTime={setSelectedTime}
              />

              <div className="flex items-center gap-3 border-t border-buyer-border pt-3">
                <div className="relative h-11 w-11 shrink-0 rounded-full bg-buyer-border">
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
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-accent" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-buyer-text">
                    {property.agent.name}
                  </p>
                  <p className="truncate text-sm text-buyer-text-muted">
                    Asesor/a {property.agent.agency}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShow3D(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-buyer-border bg-white py-3 text-xs font-bold text-buyer-text"
                >
                  <Box size={13} /> Ver en 3D
                </button>
                <button
                  disabled={!canConfirm}
                  onClick={handlePrimaryAction}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-colors",
                    canConfirm
                      ? "bg-accent-soft text-black"
                      : "cursor-not-allowed bg-buyer-bg text-buyer-text-faint"
                  )}
                >
                  <CalendarClock size={13} /> Solicitar Visita
                </button>
              </div>
            </div>
          </div>
          )}
        </>
      )}

      {showSentPanel && requestSent && (
        <div className="flex flex-col items-center bg-white px-6 py-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-buyer-border">
            <Hourglass size={20} className="text-buyer-text-muted" />
          </div>
          <p className="text-base font-semibold text-buyer-text">Solicitud enviada</p>
          <p className="mt-1.5 text-xs text-buyer-text-muted">
            Tu agente {property.agent.name} recibirá una notificación por WhatsApp y confirmará tu
            visita a la brevedad.
          </p>
          <span className="mt-4 rounded-full bg-status-amber-bg px-3 py-1.5 text-xs font-semibold text-status-amber-text">
            Pendiente de confirmación
          </span>
          <button
            onClick={() => {
              // "Cancelar" anula la solicitud de verdad (VisitStatus →
              // "cancelada", spec §5.1), no es solo cerrar el panel — por
              // eso dispara `onCancelVisit` antes de resetear la UI local.
              onCancelVisit?.(property.id);
              setRequestSent(null);
              closeSentPanel();
            }}
            className="mt-4 text-xs font-semibold text-buyer-text-muted underline"
          >
            Cancelar
          </button>
          <button
            onClick={closeSentPanel}
            className="mt-2 text-xs font-semibold text-buyer-text-faint underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {show3D && (
        <Tour3DViewer
          title={property.title}
          tourUrl={tourUrl}
          onClose={() => setShow3D(false)}
        />
      )}

      {showQuickLook && (
        <PropertyQuickLookModal
          property={property}
          onClose={() => setShowQuickLook(false)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onRequestVisitClick={() => {
            setShowQuickLook(false);
            // Si ya hay una solicitud enviada, "Solicitar Visita" del Quick
            // Look muestra su estado en vez de abrir otro agendado.
            if (requestSent) {
              setSentAutoClose(false);
              setShowSentPanel(true);
            } else {
              setExpanded(true);
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * `memo`: Discovery re-renderiza todo el grid con cada tecla en el buscador o
 * al marcar un favorito; con handlers estables (useCallback en el padre) las
 * tarjetas cuyo `property`/`isFavorite` no cambió ya no se vuelven a renderizar.
 */
export const PropertyCard = memo(PropertyCardInner);
