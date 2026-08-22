import type { Property, PropertyAmenities, PropertyCharacteristics, PropertyType } from "@/types";

/**
 * Estado + lógica del panel de Filtros avanzados (frame
 * `desktop-discovery-ai-search + advanced-filters-panel`). Separado de
 * `DiscoveryClient`/`AdvancedFiltersPanel` para que la función de filtrado
 * sea una función pura testeable, y para no inflar más esos componentes.
 *
 * "Búsqueda IA" (el textarea al final del panel) NO arma estos campos
 * automáticamente todavía — interpretar texto libre en filtros
 * estructurados es la misma feature pendiente que los chips descartables
 * de la franja "Resultados para tu búsqueda" en Discovery (ver
 * TRACKING.md). Acá el textarea por ahora solo alimenta el mismo buscador
 * de texto libre que ya existe.
 */
export interface AdvancedFilters {
  types: PropertyType[];
  priceMin: number | null;
  priceMax: number | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  bedrooms: number | null; // 5 = "5+"
  bathrooms: number | null; // 2 = "2+"
  amenities: (keyof PropertyAmenities)[];
  antiguedad: PropertyCharacteristics["antiguedad"][];
  orientacion: PropertyCharacteristics["orientacion"][number][];
  pisoMin: number | null;
  soloConAscensor: boolean;
  expensasMax: number | null;
  disposicion: PropertyCharacteristics["disposicion"][];
  cochera: PropertyCharacteristics["cochera"][];
  estadoConservacion: PropertyCharacteristics["estadoConservacion"][];
  aptoCreditoBancario: boolean;
  conDesarrollo: boolean;
}

export const EMPTY_ADVANCED_FILTERS: AdvancedFilters = {
  types: [],
  priceMin: null,
  priceMax: null,
  surfaceMin: null,
  surfaceMax: null,
  bedrooms: null,
  bathrooms: null,
  amenities: [],
  antiguedad: [],
  orientacion: [],
  pisoMin: null,
  soloConAscensor: false,
  expensasMax: null,
  disposicion: [],
  cochera: [],
  estadoConservacion: [],
  aptoCreditoBancario: false,
  conDesarrollo: false,
};

/** Cuenta grupos con al menos un valor activo — es lo que muestra el badge
 * del botón "Filtros avanzados" y el subtítulo "N filtros activos". */
export function countActiveFilterGroups(f: AdvancedFilters): number {
  const groups: boolean[] = [
    f.types.length > 0,
    f.priceMin !== null || f.priceMax !== null,
    f.surfaceMin !== null || f.surfaceMax !== null,
    f.bedrooms !== null,
    f.bathrooms !== null,
    f.amenities.length > 0,
    f.antiguedad.length > 0,
    f.orientacion.length > 0,
    f.pisoMin !== null,
    f.soloConAscensor,
    f.expensasMax !== null,
    f.disposicion.length > 0,
    f.cochera.length > 0,
    f.estadoConservacion.length > 0,
    f.aptoCreditoBancario,
    f.conDesarrollo,
  ];
  return groups.filter(Boolean).length;
}

export function applyAdvancedFilters(properties: Property[], f: AdvancedFilters): Property[] {
  return properties.filter((p) => {
    if (f.types.length && !f.types.includes(p.type)) return false;
    if (f.priceMin !== null && p.price < f.priceMin) return false;
    if (f.priceMax !== null && p.price > f.priceMax) return false;
    if (f.surfaceMin !== null && p.characteristics.superficieCubierta < f.surfaceMin) return false;
    if (f.surfaceMax !== null && p.characteristics.superficieCubierta > f.surfaceMax) return false;
    if (f.bedrooms !== null) {
      const matches = f.bedrooms >= 5 ? p.bedrooms >= 5 : p.bedrooms === f.bedrooms;
      if (!matches) return false;
    }
    if (f.bathrooms !== null) {
      const matches = f.bathrooms >= 2 ? p.bathrooms >= 2 : p.bathrooms === f.bathrooms;
      if (!matches) return false;
    }
    if (f.amenities.length && !f.amenities.every((a) => p.amenities[a])) return false;
    if (f.antiguedad.length && !f.antiguedad.includes(p.characteristics.antiguedad)) return false;
    if (
      f.orientacion.length &&
      !f.orientacion.some((o) => p.characteristics.orientacion.includes(o))
    )
      return false;
    if (f.pisoMin !== null && (p.characteristics.piso ?? 0) < f.pisoMin) return false;
    if (f.soloConAscensor && !p.characteristics.ascensor) return false;
    if (f.expensasMax !== null && (p.characteristics.expensas ?? 0) > f.expensasMax) return false;
    if (f.disposicion.length && !f.disposicion.includes(p.characteristics.disposicion))
      return false;
    if (f.cochera.length && !f.cochera.includes(p.characteristics.cochera)) return false;
    if (
      f.estadoConservacion.length &&
      !f.estadoConservacion.includes(p.characteristics.estadoConservacion)
    )
      return false;
    if (f.aptoCreditoBancario && !p.financing.aptoCreditoBancario) return false;
    if (f.conDesarrollo && !p.financing.esDesarrollo) return false;
    return true;
  });
}
