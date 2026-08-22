"use client";

import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  countActiveFilterGroups,
  EMPTY_ADVANCED_FILTERS,
  type AdvancedFilters,
} from "@/lib/discovery-filters";
import type { PropertyAmenities, PropertyCharacteristics, PropertyType } from "@/types";

/**
 * Panel de Filtros avanzados — reconstruido a partir del frame real de
 * Figma (`desktop-discovery-ai-search + advanced-filters-panel`). Estaba
 * decorativo (botón con tooltip "Próximamente") desde el rediseño de
 * Discovery; el usuario aclaró la distinción con el buscador de texto:
 * la barra de búsqueda del Header interpreta palabras clave, este panel
 * es para filtrar "a mano" con controles estructurados. Ver
 * `lib/discovery-filters.ts` para el estado y la lógica de filtrado, y
 * TRACKING.md para el detalle de qué campos de datos se agregaron para
 * soportarlo (tipos de vivienda más finos, amenities).
 *
 * El textarea "Búsqueda IA" del final NO arma estos filtros
 * automáticamente — ver comentario en `discovery-filters.ts`.
 *
 * Se abre con un fondo con blur (backdrop) + el panel deslizándose desde
 * el margen izquierdo hacia adentro, pedido explícitamente por el
 * usuario. El componente queda siempre montado (`DiscoveryClient` ya no
 * lo renderiza condicionalmente) y `open` controla la animación vía
 * clases — así hay transición tanto al abrir como al cerrar; si se
 * desmontara con `showAdvancedFilters && <...>` el cierre sería
 * instantáneo, sin tiempo de reproducir la transición de salida.
 */
interface AdvancedFiltersPanelProps {
  open: boolean;
  filters: AdvancedFilters;
  onChange: (next: AdvancedFilters) => void;
  onClose: () => void;
  resultCount: number;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onApplySearch: () => void;
}

const TYPE_OPTIONS: { id: PropertyType; label: string }[] = [
  { id: "departamento", label: "Apartamento" },
  { id: "casa", label: "Casa" },
  { id: "piso", label: "Piso" },
  { id: "estudio", label: "Estudio" },
  { id: "finca_rustica", label: "Finca Rústica" },
  { id: "chalet", label: "Chalet" },
  { id: "local", label: "Local" },
  { id: "oficina", label: "Oficina" },
];

const AMENITY_OPTIONS: { id: keyof PropertyAmenities; label: string }[] = [
  { id: "petFriendly", label: "Pet friendly" },
  { id: "balcon", label: "Con balcón" },
  { id: "piscina", label: "Piscina" },
  { id: "vistaAlMar", label: "Vista al mar" },
  { id: "cercaDeParques", label: "Cerca de parques" },
  { id: "cercaDeMetro", label: "Cerca de metro" },
];

const ANTIGUEDAD_OPTIONS: { id: PropertyCharacteristics["antiguedad"]; label: string }[] = [
  { id: "a_estrenar", label: "A estrenar" },
  { id: "1_5", label: "1-5 años" },
  { id: "6_15", label: "6-15 años" },
  { id: "16_30", label: "16-30 años" },
  { id: "30_mas", label: "+30 años" },
];

const ORIENTACION_OPTIONS: { id: PropertyCharacteristics["orientacion"][number]; label: string }[] = [
  { id: "norte", label: "Norte" },
  { id: "sur", label: "Sur" },
  { id: "este", label: "Este" },
  { id: "oeste", label: "Oeste" },
  { id: "combinada", label: "Combinada" },
];

const DISPOSICION_OPTIONS: { id: PropertyCharacteristics["disposicion"]; label: string }[] = [
  { id: "frente", label: "Frente" },
  { id: "contrafrente", label: "Contrafrente" },
  { id: "interno", label: "Interno" },
];

const COCHERA_OPTIONS: { id: PropertyCharacteristics["cochera"]; label: string }[] = [
  { id: "incluida", label: "Incluida" },
  { id: "opcional", label: "Opcional" },
  { id: "no_tiene", label: "No incluida" },
];

const ESTADO_OPTIONS: { id: PropertyCharacteristics["estadoConservacion"]; label: string }[] = [
  { id: "a_estrenar", label: "A estrenar" },
  { id: "muy_bueno", label: "Muy bueno" },
  { id: "bueno", label: "Bueno" },
  { id: "a_refaccionar", label: "A refaccionar" },
];

const PRICE_MAX = 4_000_000;
const SURFACE_MAX = 400;
const PISO_MAX = 20;
const EXPENSAS_MAX = 500;

export function AdvancedFiltersPanel({
  open,
  filters,
  onChange,
  onClose,
  resultCount,
  searchDraft,
  onSearchDraftChange,
  onApplySearch,
}: AdvancedFiltersPanelProps) {
  const activeCount = countActiveFilterGroups(filters);

  function toggleInList<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop con blur — separado del panel para poder animar cada
          uno con su propia transición (fade vs. slide). */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filtros avanzados"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-full max-w-sm flex-col overflow-y-auto border-r border-buyer-border bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-buyer-border bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-buyer-text">Filtros avanzados</h2>
            <p className="text-xs text-buyer-text-muted">
              {activeCount} filtro{activeCount === 1 ? "" : "s"} activo{activeCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="flex h-8 w-8 items-center justify-center rounded-full text-buyer-text-muted hover:bg-buyer-bg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-5 py-5">
          <Section title="Tipo de vivienda">
            <ChipGroup
              options={TYPE_OPTIONS}
              selected={filters.types}
              onToggle={(id) => onChange({ ...filters, types: toggleInList(filters.types, id) })}
            />
          </Section>

          <Section title="Precio">
            <DualRange
              min={0}
              max={PRICE_MAX}
              step={10_000}
              valueMin={filters.priceMin}
              valueMax={filters.priceMax}
              format={(v) => formatPrice(v, "USD")}
              onChangeMin={(v) => onChange({ ...filters, priceMin: v })}
              onChangeMax={(v) => onChange({ ...filters, priceMax: v })}
            />
          </Section>

          <Section title="Superficie">
            <DualRange
              min={0}
              max={SURFACE_MAX}
              step={5}
              valueMin={filters.surfaceMin}
              valueMax={filters.surfaceMax}
              format={(v) => `${v} m²`}
              onChangeMin={(v) => onChange({ ...filters, surfaceMin: v })}
              onChangeMax={(v) => onChange({ ...filters, surfaceMax: v })}
            />
          </Section>

          <Section title="Habitaciones y baños">
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs text-buyer-text-muted">Habitaciones</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        onChange({ ...filters, bedrooms: filters.bedrooms === n ? null : n })
                      }
                      className={cn(
                        "flex h-8 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition-colors",
                        filters.bedrooms === n
                          ? "border-buyer-text bg-buyer-text text-white"
                          : "border-buyer-border text-buyer-text hover:border-buyer-text"
                      )}
                    >
                      {n === 5 ? "5+" : n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs text-buyer-text-muted">Baños</p>
                <div className="flex gap-1.5">
                  {[1, 2].map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        onChange({ ...filters, bathrooms: filters.bathrooms === n ? null : n })
                      }
                      className={cn(
                        "flex h-8 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition-colors",
                        filters.bathrooms === n
                          ? "border-buyer-text bg-buyer-text text-white"
                          : "border-buyer-border text-buyer-text hover:border-buyer-text"
                      )}
                    >
                      {n === 2 ? "2+" : n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Estado de vida">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {AMENITY_OPTIONS.map((opt) => (
                <Checkbox
                  key={opt.id}
                  checked={filters.amenities.includes(opt.id)}
                  onChange={() =>
                    onChange({ ...filters, amenities: toggleInList(filters.amenities, opt.id) })
                  }
                  label={opt.label}
                />
              ))}
            </div>
          </Section>

          <Section title="Más características">
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs text-buyer-text-muted">Antigüedad</p>
                <ChipGroup
                  options={ANTIGUEDAD_OPTIONS}
                  selected={filters.antiguedad}
                  onToggle={(id) =>
                    onChange({ ...filters, antiguedad: toggleInList(filters.antiguedad, id) })
                  }
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs text-buyer-text-muted">Orientación</p>
                <ChipGroup
                  options={ORIENTACION_OPTIONS}
                  selected={filters.orientacion}
                  onToggle={(id) =>
                    onChange({ ...filters, orientacion: toggleInList(filters.orientacion, id) })
                  }
                />
              </div>
              <div>
                <p className="mb-1.5 flex items-center justify-between text-xs text-buyer-text-muted">
                  <span>Piso</span>
                  <span>{filters.pisoMin === null ? "Cualquiera" : `Desde piso ${filters.pisoMin}`}</span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={PISO_MAX}
                  value={filters.pisoMin ?? 0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({ ...filters, pisoMin: v === 0 ? null : v });
                  }}
                  className="w-full accent-accent"
                />
              </div>
              <Checkbox
                checked={filters.soloConAscensor}
                onChange={() => onChange({ ...filters, soloConAscensor: !filters.soloConAscensor })}
                label="Con ascensor"
              />
              <div>
                <p className="mb-1.5 flex items-center justify-between text-xs text-buyer-text-muted">
                  <span>Expensas máximas</span>
                  <span>
                    {filters.expensasMax === null ? "Sin límite" : `Hasta ${formatPrice(filters.expensasMax, "USD")}/mes`}
                  </span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={EXPENSAS_MAX}
                  step={10}
                  value={filters.expensasMax ?? EXPENSAS_MAX}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({ ...filters, expensasMax: v === EXPENSAS_MAX ? null : v });
                  }}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          </Section>

          <Section title="Disposición">
            <ChipGroup
              options={DISPOSICION_OPTIONS}
              selected={filters.disposicion}
              onToggle={(id) =>
                onChange({ ...filters, disposicion: toggleInList(filters.disposicion, id) })
              }
            />
          </Section>

          <Section title="Cochera">
            <ChipGroup
              options={COCHERA_OPTIONS}
              selected={filters.cochera}
              onToggle={(id) => onChange({ ...filters, cochera: toggleInList(filters.cochera, id) })}
            />
          </Section>

          <Section title="Estado">
            <ChipGroup
              options={ESTADO_OPTIONS}
              selected={filters.estadoConservacion}
              onToggle={(id) =>
                onChange({
                  ...filters,
                  estadoConservacion: toggleInList(filters.estadoConservacion, id),
                })
              }
            />
          </Section>

          <Section title="Financiamiento">
            <div className="space-y-2">
              <Checkbox
                checked={filters.aptoCreditoBancario}
                onChange={() =>
                  onChange({ ...filters, aptoCreditoBancario: !filters.aptoCreditoBancario })
                }
                label="Apto crédito bancario"
              />
              <Checkbox
                checked={filters.conDesarrollo}
                onChange={() => onChange({ ...filters, conDesarrollo: !filters.conDesarrollo })}
                label="Con plan de desarrollista"
              />
              {filters.conDesarrollo && (
                <p className="text-[11px] text-buyer-text-faint">
                  Solo propiedades que participan en un plan de financiamiento directo del
                  desarrollista.
                </p>
              )}
            </div>
          </Section>

          <Section title="Búsqueda IA">
            <textarea
              value={searchDraft}
              onChange={(e) => onSearchDraftChange(e.target.value)}
              placeholder="Describí lo que estás buscando — ej. '3 ambientes con balcón cerca de Paseo de Gracia'"
              rows={3}
              className="w-full resize-none rounded-xl bg-buyer-input-bg p-3 text-sm text-buyer-text outline-none placeholder:text-buyer-text-faint focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={onApplySearch}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-accent"
            >
              <Sparkles size={13} /> Aplicar a la búsqueda
            </button>
          </Section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-buyer-border bg-white px-5 py-4">
          <button
            onClick={() => onChange(EMPTY_ADVANCED_FILTERS)}
            className="text-xs font-semibold text-buyer-text-muted underline"
          >
            Limpiar filtros
          </button>
          <button
            onClick={onClose}
            className="rounded-control bg-accent px-5 py-2.5 text-sm font-bold text-black transition-transform hover:brightness-95"
          >
            Ver {resultCount} propiedades
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-buyer-border pb-5 last:border-0 last:pb-0">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-buyer-text-faint">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ChipGroup<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: { id: T; label: string }[];
  selected: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-buyer-text bg-buyer-text text-white"
                : "border-buyer-border text-buyer-text hover:border-buyer-text"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-buyer-text">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-accent" />
      {label}
    </label>
  );
}

function DualRange({
  min,
  max,
  step,
  valueMin,
  valueMax,
  format,
  onChangeMin,
  onChangeMax,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number | null;
  valueMax: number | null;
  format: (v: number) => string;
  onChangeMin: (v: number | null) => void;
  onChangeMax: (v: number | null) => void;
}) {
  const vMin = valueMin ?? min;
  const vMax = valueMax ?? max;
  const pctMin = ((vMin - min) / (max - min)) * 100;
  const pctMax = ((vMax - min) / (max - min)) * 100;

  return (
    <div>
      <div className="dual-range">
        <div className="dual-range-track" />
        <div
          className="dual-range-fill"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={vMin}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), vMax);
            onChangeMin(v === min ? null : v);
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={vMax}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), vMin);
            onChangeMax(v === max ? null : v);
          }}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1">
          <p className="mb-1 text-[10px] text-buyer-text-faint">Mínimo</p>
          <div className="rounded-lg border border-buyer-border px-2.5 py-1.5 text-xs text-buyer-text">
            {format(vMin)}
          </div>
        </div>
        <div className="flex-1">
          <p className="mb-1 text-[10px] text-buyer-text-faint">Máximo</p>
          <div className="rounded-lg border border-buyer-border px-2.5 py-1.5 text-xs text-buyer-text">
            {vMax >= max ? `${format(vMax)}+` : format(vMax)}
          </div>
        </div>
      </div>
    </div>
  );
}
