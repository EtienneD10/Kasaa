import { MapPinOff, SlidersHorizontal, X } from "lucide-react";

/**
 * Estado vacío de Discovery — spec §3.3, dos variantes:
 * 1. "filtros-restrictivos": la combinación de chips activos no matchea
 *    ninguna propiedad — se listan como pills removibles.
 * 2. "zona-sin-cobertura": la búsqueda de texto no matchea ninguna
 *    ubicación conocida.
 */
interface ActiveFilter {
  id: string;
  label: string;
}

interface FiltrosRestrictivosProps {
  variant: "filtros-restrictivos";
  activeFilters: ActiveFilter[];
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
}

interface ZonaSinCoberturaProps {
  variant: "zona-sin-cobertura";
  query: string;
  onClearSearch: () => void;
}

type DiscoveryEmptyStateProps = FiltrosRestrictivosProps | ZonaSinCoberturaProps;

export function DiscoveryEmptyState(props: DiscoveryEmptyStateProps) {
  if (props.variant === "filtros-restrictivos") {
    const { activeFilters, onRemoveFilter, onClearAll } = props;
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-buyer-border bg-buyer-surface px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-buyer-bg">
          <SlidersHorizontal size={22} className="text-buyer-text-muted" />
        </div>
        <h3 className="font-display text-xl font-semibold text-buyer-text">
          No encontramos propiedades con esos filtros
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-buyer-text-muted">
          Probá sacando alguno de los filtros activos para ver más resultados.
        </p>

        {activeFilters.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => onRemoveFilter(f.id)}
                className="flex items-center gap-1.5 rounded-pill border border-buyer-border bg-white px-3 py-1.5 text-sm text-buyer-text hover:border-buyer-text"
              >
                {f.label} <X size={13} className="text-buyer-text-faint" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClearAll}
          className="mt-6 rounded-control bg-accent px-5 py-2.5 text-sm font-bold text-black hover:brightness-95"
        >
          Limpiar todos los filtros
        </button>
      </div>
    );
  }

  const { query, onClearSearch } = props;
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-buyer-border bg-buyer-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-buyer-bg">
        <MapPinOff size={22} className="text-buyer-text-muted" />
      </div>
      <h3 className="font-display text-xl font-semibold text-buyer-text">
        Todavía no tenemos cobertura en &ldquo;{query}&rdquo;
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-buyer-text-muted">
        Estamos sumando propiedades e inmobiliarias en nuevas zonas todo el
        tiempo. Mientras tanto, mirá lo que tenemos disponible.
      </p>
      <button
        onClick={onClearSearch}
        className="mt-6 rounded-control bg-accent px-5 py-2.5 text-sm font-bold text-black hover:brightness-95"
      >
        Ver todas las propiedades
      </button>
    </div>
  );
}
