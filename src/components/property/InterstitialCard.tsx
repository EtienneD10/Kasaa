import { Eye, CalendarClock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types";

/**
 * Tarjeta interstitial — spec §3.3, reconstruida a partir del frame real
 * de Figma (`property-card-c`, dentro de `desktop-discovery-default-cards`).
 * Formato horizontal ancho (≈21:5, más elongado que un simple 21:9), badge
 * "DESTACADO" + "VENTA/ALQUILER", caption "Destacado hoy" (no un botón de
 * play — no hay reproducción de video real todavía), y un botón circular
 * de CTA en vez de un link de texto.
 *
 * `views` es un placeholder derivado de favoriteCount — el modelo
 * `Property` todavía no trackea vistas reales (no hay backend, ver
 * TRACKING.md).
 */
export function InterstitialCard({ property }: { property: Property }) {
  const statusLabel = property.operation === "venta" ? "VENTA" : "ALQUILER";
  const views = Math.round(property.favoriteCount * 3.4);

  return (
    <div className="relative aspect-[21/5] w-full overflow-hidden rounded-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={property.photos[0]}
        alt={property.title}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

      <div className="absolute left-5 top-5 flex items-center gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-buyer-text">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {statusLabel}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-black">
          ★ DESTACADO
        </span>
      </div>

      <span className="absolute right-5 top-5 flex items-center gap-1 text-[11px] font-medium text-white/80">
        <span className="h-1.5 w-1.5 rounded-full border border-white/60" /> Destacado hoy
      </span>

      <div className="absolute inset-x-5 bottom-5 flex flex-col justify-end gap-1.5 text-white sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-accent">{property.location.neighborhood}</p>
          <p className="mt-0.5 font-display text-xl font-semibold sm:text-2xl">
            {property.title}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-lg font-bold sm:text-xl">
              {formatPrice(property.price, property.currency)}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] backdrop-blur-sm">
              {property.bedrooms} Dorm · {property.bathrooms} Baños ·{" "}
              {property.characteristics.superficieCubierta} m²
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/40 bg-buyer-border">
            {property.agent.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={property.agent.avatarUrl}
                alt={property.agent.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-white/80">
            <Eye size={13} /> {views.toLocaleString("es-AR")}
          </span>
          <button
            title="Próximamente: agendar visita"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black"
            aria-label="Agendar visita"
          >
            <CalendarClock size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
