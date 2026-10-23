"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  ChevronDown,
  Clock,
  ImageOff,
  Pencil,
  Share2,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { mockProperties, mockPropertyPerformance } from "@/lib/mock-data";
import { getListingStatus, daysSince } from "@/lib/property-status";
import { ConfirmListingModal } from "./ConfirmListingModal";
import { PropertyMediaModal } from "./PropertyMediaModal";
import type { Property, PropertyStatus } from "@/types";

/**
 * Propiedades (frame real `propiedades-table-view`, + el modal
 * `confirm-listing-modal` enviado junto) — tabla del catálogo de agt-4
 * con selección múltiple, y la interacción completa del aviso de
 * caducidad a los 20 días (spec §5.4, ver `lib/property-status.ts` para
 * la regla).
 *
 * - El estado de cada fila (columna ESTADO) sale de `getListingStatus()`,
 *   NO del `status` guardado en el mock — así que "publicada" puede
 *   mostrarse como ACTIVA / PENDIENTE DE CONFIRMACIÓN / PAUSADA según
 *   hace cuánto se actualizó, tal cual describió el usuario ("desde el
 *   momento que agregan cada propiedad tienen 20 días... luego se pausa
 *   la publicación"). El ícono de reloj al lado del pill ámbar
 *   "PENDIENTE DE CONFIRMACIÓN" abre `ConfirmListingModal` de verdad.
 * - "Sí, sigue disponible" resetea `lastUpdatedAt` a hoy (la propiedad
 *   vuelve a ACTIVA); "No, ya no está disponible" pasa su `status` real
 *   a `pausada`. Ambas acciones mutan el estado local de este componente
 *   (`properties`), no el mock global — recargar la página vuelve al
 *   estado original, mismo criterio que `MisVisitasPanel`.
 * - `?confirmar=<id>` en la URL (lo arma el link "Confirmar vigencia" de
 *   la alerta "att-2" en el Dashboard Home) abre este modal solo al
 *   entrar, para esa propiedad puntual.
 * - Buscador (por código o dirección) y paginación (8 por página) son
 *   reales — con 9 propiedades en el mock, la página 2 muestra la 9na de
 *   verdad. Los selects "Estado"/"Tipo" y "+ Nueva Propiedad" quedan
 *   decorativos (no hay editor de propiedad todavía, ver TRACKING.md).
 * - Selección múltiple real: la barra de acciones masivas aparece con
 *   ≥1 fila tildada. "Pausar seleccionadas" es real (pasa esas filas a
 *   `pausada`); "Eliminar seleccionadas" queda decorativo (acción
 *   destructiva sin backend, `title="Próximamente"`).
 * - "VISITAS"/"LEADS" son constantes ilustrativas (`mockPropertyPerformance`
 *   en `mock-data.ts`, no hay analítica por propiedad todavía);
 *   "ACTUALIZADA" sí se calcula de verdad desde `lastUpdatedAt`.
 */

const STATUS_STYLES: Record<PropertyStatus, { label: string; className: string }> = {
  publicada: { label: "ACTIVA", className: "bg-status-success/15 text-emerald-700" },
  borrador: { label: "BORRADOR", className: "bg-buyer-input-bg text-buyer-text-muted" },
  vencida: { label: "VENCIDA", className: "bg-status-red-bg text-status-red" },
  pendiente_confirmacion: {
    label: "PENDIENTE DE CONFIRMACIÓN",
    className: "bg-status-amber-bg text-status-amber-text",
  },
  pausada: { label: "PAUSADA", className: "bg-status-amber-bg text-status-amber-text" },
};

const TYPE_LABELS: Record<Property["type"], string> = {
  departamento: "DEPARTAMENTO",
  piso: "PISO",
  casa: "CASA",
  atico: "ÁTICO",
  estudio: "ESTUDIO",
  finca_rustica: "FINCA RÚSTICA",
  chalet: "CHALET",
  local: "LOCAL",
  oficina: "OFICINA",
  ph: "PH",
  otro: "OTRO",
};

const PAGE_SIZE = 8;

function relativeDays(iso: string) {
  const days = daysSince(iso);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

function formatPrice(p: Property) {
  return `${p.currency === "USD" ? "US$" : p.currency} ${p.price.toLocaleString("es-AR")}`;
}

export function PropertiesTable() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<Property[]>(() =>
    mockProperties.filter((p) => p.agent.id === "agt-4")
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Auto-abre el modal si se llegó desde el link "Confirmar vigencia" del
  // Dashboard Home (`?confirmar=<id>`) — se lee una sola vez como valor
  // inicial (lazy initializer), no en un efecto: `searchParams` no va a
  // cambiar de nuevo mientras el usuario interactúa con la tabla, así que
  // no hace falta seguir sincronizándolo después del primer render.
  const [modalPropertyId, setModalPropertyId] = useState<string | null>(() =>
    searchParams.get("confirmar")
  );
  // Editor de medios (video / estilo dron / enlace 3D) — ver PropertyMediaModal.
  const [mediaPropertyId, setMediaPropertyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) => p.code.toLowerCase().includes(q) || p.location.address.toLowerCase().includes(q)
    );
  }, [properties, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageProperties = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const modalProperty = properties.find((p) => p.id === modalPropertyId) ?? null;
  const mediaProperty = properties.find((p) => p.id === mediaPropertyId) ?? null;

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelected((prev) => {
      const allSelected = pageProperties.every((p) => prev.has(p.id));
      const next = new Set(prev);
      pageProperties.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  }

  function updateProperty(id: string, patch: Partial<Property>) {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function handleConfirmAvailable() {
    if (!modalProperty) return;
    updateProperty(modalProperty.id, {
      status: "publicada",
      lastUpdatedAt: new Date().toISOString().split("T")[0],
    });
    setModalPropertyId(null);
  }

  function handleMarkUnavailable() {
    if (!modalProperty) return;
    updateProperty(modalProperty.id, { status: "pausada" });
    setModalPropertyId(null);
  }

  function pauseSelected() {
    setProperties((prev) =>
      prev.map((p) => (selected.has(p.id) ? { ...p, status: "pausada" } : p))
    );
    setSelected(new Set());
  }

  return (
    <div className="flex-1 overflow-y-auto bg-agent-bg">
      <header className="flex items-center justify-between border-b border-agent-border bg-white px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-buyer-text">Propiedades</h1>
          <p className="mt-0.5 text-sm text-buyer-text-muted">
            Gestioná tu catálogo activo, seleccioná varias o revisá el historial de cambios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Próximamente: Actualizar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-buyer-text-muted hover:bg-agent-bg"
          >
            <RefreshCw size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            title="Próximamente"
            className="flex items-center gap-2 rounded-control border border-agent-border px-3 py-2 text-sm font-semibold text-buyer-text"
          >
            {user?.name}
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      <main className="px-8 py-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por código, dirección o..."
            className="w-64 rounded-control border border-agent-border bg-white px-3.5 py-2 text-sm outline-none placeholder:text-buyer-text-faint"
          />
          <button
            type="button"
            title="Próximamente"
            className="flex items-center gap-1.5 rounded-control border border-agent-border bg-white px-3.5 py-2 text-sm font-medium text-buyer-text-muted"
          >
            Estado <ChevronDown size={14} />
          </button>
          <button
            type="button"
            title="Próximamente"
            className="flex items-center gap-1.5 rounded-control border border-agent-border bg-white px-3.5 py-2 text-sm font-medium text-buyer-text-muted"
          >
            Tipo <ChevronDown size={14} />
          </button>
          <button
            type="button"
            title="Próximamente: Editor de propiedad"
            className="ml-auto rounded-control bg-accent px-4 py-2 text-sm font-bold text-black transition-transform hover:brightness-95"
          >
            + Nueva Propiedad
          </button>
        </div>

        <div className="overflow-x-auto rounded-card border border-agent-border bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-agent-border bg-buyer-bg text-[11px] font-bold uppercase tracking-wide text-buyer-text-faint">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={pageProperties.length > 0 && pageProperties.every((p) => selected.has(p.id))}
                    onChange={toggleSelectAllOnPage}
                    className="accent-accent"
                  />
                </th>
                <th className="px-2 py-2.5">Foto</th>
                <th className="px-2 py-2.5">Código</th>
                <th className="px-2 py-2.5">Propiedad / Ubicación</th>
                <th className="px-2 py-2.5">Tipo</th>
                <th className="px-2 py-2.5">Estado</th>
                <th className="px-2 py-2.5">Precio</th>
                <th className="px-2 py-2.5">Visitas</th>
                <th className="px-2 py-2.5">Leads</th>
                <th className="px-2 py-2.5">Actualizada</th>
                <th className="px-2 py-2.5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageProperties.map((p) => {
                const listingStatus = getListingStatus(p);
                const style = STATUS_STYLES[listingStatus];
                const perf = mockPropertyPerformance[p.id];
                const isSelected = selected.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b border-agent-border last:border-b-0",
                      isSelected && "bg-status-success/10"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(p.id)}
                        className="accent-accent"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-buyer-input-bg">
                        {p.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.photos[0]}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-buyer-text-faint">
                            <ImageOff size={14} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs text-buyer-text-muted">{p.code}</td>
                    <td className="px-2 py-3">
                      <p className="max-w-[220px] truncate font-semibold text-buyer-text">
                        {p.location.address}
                      </p>
                      <p className="text-xs text-buyer-text-faint">
                        {p.location.neighborhood}, {p.location.city}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="rounded-pill border border-buyer-border px-2 py-0.5 text-[10px] font-bold text-buyer-text-muted">
                        {TYPE_LABELS[p.type]}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-pill px-2 py-1 text-[10px] font-bold leading-tight",
                            style.className
                          )}
                        >
                          {style.label}
                        </span>
                        {listingStatus === "pendiente_confirmacion" && (
                          <button
                            type="button"
                            aria-label="Confirmar vigencia"
                            onClick={() => setModalPropertyId(p.id)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-amber text-white"
                          >
                            <Clock size={11} strokeWidth={2.25} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 font-semibold text-buyer-text">{formatPrice(p)}</td>
                    <td className="px-2 py-3 text-buyer-text-muted">{perf?.visitas ?? 0}</td>
                    <td className="px-2 py-3 text-buyer-text-muted">{perf?.leads ?? 0}</td>
                    <td className="px-2 py-3 text-xs text-buyer-text-faint">
                      {relativeDays(p.lastUpdatedAt)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Editar medios: video, estilo dron y recorrido 3D"
                          aria-label="Editar medios"
                          onClick={() => setMediaPropertyId(p.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-buyer-text-muted hover:bg-buyer-bg"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          title="Próximamente: Compartir"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-buyer-text-muted hover:bg-buyer-bg"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          type="button"
                          title="Próximamente"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-buyer-text-muted hover:bg-buyer-bg"
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageProperties.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-buyer-text-faint">
                    No encontramos propiedades para &quot;{search}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-buyer-text-faint">
            Mostrando {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} a{" "}
            {Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} propiedades
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-control border border-agent-border px-3 py-1.5 text-xs font-semibold text-buyer-text-muted disabled:opacity-40"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "h-7 w-7 rounded-control text-xs font-bold",
                  n === page ? "bg-accent text-black" : "text-buyer-text-muted hover:bg-buyer-bg"
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-control border border-agent-border px-3 py-1.5 text-xs font-semibold text-buyer-text-muted disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </main>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-30 mx-auto flex w-fit items-center gap-3 rounded-pill border border-agent-border bg-white px-4 py-2.5 shadow-2xl">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-buyer-text">
            <span className="h-2 w-2 rounded-full bg-status-success" /> {selected.size} seleccionadas
          </span>
          <button
            type="button"
            onClick={pauseSelected}
            className="rounded-control border border-agent-border px-3 py-1.5 text-xs font-bold text-buyer-text hover:bg-buyer-bg"
          >
            Pausar seleccionadas
          </button>
          <button
            type="button"
            title="Próximamente"
            className="rounded-control border border-status-red px-3 py-1.5 text-xs font-bold text-status-red hover:bg-status-red-bg"
          >
            Eliminar seleccionadas
          </button>
          <button
            type="button"
            aria-label="Cerrar selección"
            onClick={() => setSelected(new Set())}
            className="flex h-6 w-6 items-center justify-center rounded-full text-buyer-text-faint hover:bg-buyer-bg"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {mediaProperty && (
        <PropertyMediaModal
          key={mediaProperty.id}
          property={mediaProperty}
          onClose={() => setMediaPropertyId(null)}
        />
      )}

      {modalProperty && (
        <ConfirmListingModal
          property={modalProperty}
          onClose={() => setModalPropertyId(null)}
          onConfirmAvailable={handleConfirmAvailable}
          onMarkUnavailable={handleMarkUnavailable}
        />
      )}
    </div>
  );
}
