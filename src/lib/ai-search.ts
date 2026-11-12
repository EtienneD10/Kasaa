import type { OperationType, PropertyAmenities, PropertyType } from "@/types";
import { mockProperties } from "@/lib/mock-data";
import type { AdvancedFilters } from "@/lib/discovery-filters";

/**
 * "Búsqueda IA" (decisión abierta #8, frame `desktop-discovery-ai-search`):
 * traduce texto libre ("depto luminoso pet friendly cerca de parques en
 * Gràcia hasta 400k") a filtros estructurados + chips descartables.
 *
 * NO es un modelo de lenguaje: es un intérprete por palabras clave sobre el
 * vocabulario de los filtros que ya existen (opción "funcional con campos
 * mock" que eligió el usuario). Lo que no reconoce no se descarta en
 * silencio — vuelve en `unmatched` y Discovery lo muestra ("Sin filtro para:
 * luminoso"). Cuando haya backend, esta función es el punto a reemplazar por
 * un LLM con la misma salida (`SearchInterpretation`).
 *
 * El resultado se aplica sobre el MISMO estado que el panel de Filtros
 * avanzados (no un estado paralelo), así el panel muestra tildado lo que se
 * interpretó y quitar un chip quita ese filtro de verdad.
 */

export interface AiChip {
  /** Identifica qué parte del estado representa — ver `removeChip`. */
  key: string;
  label: string;
}

export interface SearchInterpretation {
  query: string;
  filters: Partial<AdvancedFilters>;
  operation?: OperationType;
  /** Barrio o ciudad reconocido — se aplica como texto de búsqueda. */
  location?: string;
  chips: AiChip[];
  /** Palabras con contenido que no se pudieron mapear a ningún filtro. */
  unmatched: string[];
}

/** El estado de Discovery que la búsqueda IA lee y modifica. */
export interface DiscoveryQueryState {
  filters: AdvancedFilters;
  operation: OperationType | null;
  search: string;
}

// --- Normalización -----------------------------------------------------------

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/m²/g, "m2")
    .replace(/[¿?¡!,;:()"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NUMBER_WORDS: Record<string, string> = {
  un: "1",
  una: "1",
  uno: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  cinco: "5",
  seis: "6",
};

/** "500k" / "500 mil" / "1,5 millones" / "450.000" → número. */
function parseAmount(raw: string, unit?: string) {
  let n = raw;
  if (/^\d{1,3}(\.\d{3})+$/.test(n)) n = n.replace(/\./g, "");
  n = n.replace(",", ".");
  let value = Number(n);
  if (!Number.isFinite(value)) return null;
  if (unit && /^(k|mil)$/.test(unit)) value *= 1_000;
  if (unit && /^(m|millon|millones|palos?)$/.test(unit)) value *= 1_000_000;
  return Math.round(value);
}

function formatAmount(n: number) {
  return n.toLocaleString("es-AR");
}

// --- Vocabulario ---------------------------------------------------------------

const TYPE_LABEL: Record<PropertyType, string> = {
  departamento: "Apartamento",
  piso: "Piso",
  casa: "Casa",
  atico: "Ático",
  estudio: "Estudio",
  finca_rustica: "Finca Rústica",
  chalet: "Chalet",
  local: "Local",
  oficina: "Oficina",
  ph: "PH",
  otro: "Otro",
};

// Orden importa: "finca rústica"/"casa de campo" antes que "casa", y
// "apto" solo como tipo si no es "apto crédito".
const TYPE_RULES: { re: RegExp; type: PropertyType }[] = [
  { re: /\b(finca rustica|finca|rustica|casa de campo|masia)\b/, type: "finca_rustica" },
  { re: /\b(monoambientes?|estudios?|lofts?)\b/, type: "estudio" },
  { re: /\b(aticos?|penthouses?|duplex)\b/, type: "atico" },
  { re: /\b(deptos?|departamentos?|apartamentos?|aptos?(?! credito)|dptos?)\b/, type: "departamento" },
  { re: /\b(chalets?|villas?)\b/, type: "chalet" },
  { re: /\b(casas?)\b/, type: "casa" },
  { re: /\b(locales?|local comercial)\b/, type: "local" },
  { re: /\b(oficinas?)\b/, type: "oficina" },
  { re: /\bph\b/, type: "ph" },
  { re: /\b(pisos?)\b/, type: "piso" },
];

const AMENITY_LABEL: Record<keyof PropertyAmenities, string> = {
  petFriendly: "Pet Friendly",
  balcon: "Con balcón",
  piscina: "Piscina",
  vistaAlMar: "Vista al mar",
  cercaDeParques: "Cerca de parques",
  cercaDeMetro: "Cerca del metro",
};

const AMENITY_RULES: { re: RegExp; amenity: keyof PropertyAmenities }[] = [
  { re: /\b(pet ?friendly|mascotas?|perros?|gatos?)\b/, amenity: "petFriendly" },
  { re: /\b(balcon(es)?|terrazas?)\b/, amenity: "balcon" },
  { re: /\b(piscinas?|pileta)\b/, amenity: "piscina" },
  { re: /\b(vistas? al mar|frente al mar|vista mar|playa)\b/, amenity: "vistaAlMar" },
  { re: /\b(parques?|plazas?|espacios? verdes?)\b/, amenity: "cercaDeParques" },
  { re: /\b(metro|subte|transporte publico)\b/, amenity: "cercaDeMetro" },
];

const OPERATION_RULES: { re: RegExp; op: OperationType }[] = [
  { re: /\b(en alquiler|alquiler(es)?|alquilar|alquilo|para alquilar|renta|rentar)\b/, op: "alquiler" },
  { re: /\b(en venta|venta|comprar|compra|para comprar)\b/, op: "venta" },
];

// Palabras de relleno que no deberían aparecer como "sin filtro para".
const STOPWORDS = new Set(
  "busco buscando quiero queria necesito estoy un una uno unos unas de del con en el la los las y o para que a al cerca zona mi me por muy algo tipo propiedad propiedades lugar donde sea ideal lindo linda bonito bonita barrio barrios ciudad hasta desde mas menos maximo minimo precio presupuesto sin tenga tener hay".split(
    " "
  )
);

/** Barrios y ciudades del catálogo, normalizados, más largos primero. */
const LOCATIONS = (() => {
  const names = new Map<string, string>();
  for (const p of mockProperties) {
    names.set(normalize(p.location.neighborhood), p.location.neighborhood);
    names.set(normalize(p.location.city), p.location.city);
  }
  return [...names.entries()].sort((a, b) => b[0].length - a[0].length);
})();

// --- Intérprete ----------------------------------------------------------------

export function interpretSearch(query: string): SearchInterpretation {
  let text = ` ${normalize(query)} `.replace(
    /\b(un|una|uno|dos|tres|cuatro|cinco|seis)\b(?=\s*(dorm|hab|amb|ban|cuart))/g,
    (w) => NUMBER_WORDS[w]
  );
  const filters: Partial<AdvancedFilters> = {};
  const chips: AiChip[] = [];
  let operation: OperationType | undefined;
  let location: string | undefined;

  /** Si `re` matchea, la saca del texto (para no re-interpretarla) y la devuelve. */
  function take(re: RegExp) {
    const m = text.match(re);
    if (m) text = text.replace(m[0], " ");
    return m;
  }
  const addType = (t: PropertyType) => {
    if (filters.types?.includes(t)) return;
    filters.types = [...(filters.types ?? []), t];
    chips.push({ key: `type:${t}`, label: TYPE_LABEL[t] });
  };

  // Ubicación primero (algunos barrios contienen palabras del vocabulario,
  // ej. "Poble Sec", "Diagonal Mar").
  for (const [norm, display] of LOCATIONS) {
    if (take(new RegExp(`\\b${norm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`))) {
      location = display;
      chips.push({ key: "location", label: display });
      break;
    }
  }

  for (const { re, op } of OPERATION_RULES) {
    if (take(re)) {
      operation = op;
      chips.push({ key: "operation", label: op === "venta" ? "En venta" : "En alquiler" });
      break;
    }
  }

  // Superficie antes que precio: "más de 100 m2" no es un precio.
  const surf = take(/\b(?:(mas de|desde|minimo|al menos|hasta|menos de|maximo)\s*)?(\d+)\s*(?:m2|mts2?|metros(?: cuadrados)?)\b/);
  if (surf) {
    const n = Number(surf[2]);
    if (surf[1] && /hasta|menos|maximo/.test(surf[1])) {
      filters.surfaceMax = n;
      chips.push({ key: "surfaceMax", label: `Hasta ${n} m²` });
    } else {
      filters.surfaceMin = n;
      chips.push({ key: "surfaceMin", label: `Desde ${n} m²` });
    }
  }

  const CURRENCY = "(?:us\\$|u\\$s|usd|u\\$d|€|eur|euros?|dolares?|\\$)?";
  const AMOUNT = `${CURRENCY}\\s*(\\d[\\d.,]*)\\s*(k|mil|m|millon|millones|palos?)?\\b\\s*${CURRENCY}`;
  const maxPrice = take(new RegExp(`\\b(?:hasta|menos de|maximo|max|no mas de|tope(?: de)?)\\s*(?:de\\s*)?${AMOUNT}`));
  if (maxPrice) {
    const n = parseAmount(maxPrice[1], maxPrice[2]);
    if (n) {
      filters.priceMax = n;
      chips.push({ key: "priceMax", label: `Hasta ${formatAmount(n)}` });
    }
  }
  const minPrice = take(new RegExp(`\\b(?:desde|mas de|minimo|a partir de)\\s*(?:de\\s*)?${AMOUNT}`));
  if (minPrice) {
    const n = parseAmount(minPrice[1], minPrice[2]);
    if (n) {
      filters.priceMin = n;
      chips.push({ key: "priceMin", label: `Desde ${formatAmount(n)}` });
    }
  }

  const beds = take(/\b(\d+)\s*(?:dormitorios?|dorm\.?|habitaciones?|hab\.?|cuartos?|recamaras?)/);
  if (beds) {
    const n = Math.min(Number(beds[1]), 5);
    filters.bedrooms = n;
    chips.push({ key: "bedrooms", label: n >= 5 ? "5+ dorm." : `${n} dorm.` });
  }
  const amb = take(/\b(\d+)\s*amb(?:ientes?|\.)?\b/);
  if (amb && filters.bedrooms === undefined) {
    // Convención rioplatense: N ambientes = N-1 dormitorios; 1 ambiente = estudio.
    const n = Number(amb[1]);
    if (n <= 1) addType("estudio");
    else {
      filters.bedrooms = Math.min(n - 1, 5);
      chips.push({ key: "bedrooms", label: `${n} ambientes` });
    }
  }
  const baths = take(/\b(\d+)\s*banos?\b/);
  if (baths) {
    const n = Math.min(Number(baths[1]), 2);
    filters.bathrooms = n;
    chips.push({ key: "bathrooms", label: n >= 2 ? "2+ baños" : "1 baño" });
  }

  // Piso alto / piso N antes que "piso" como tipo de vivienda.
  const floor = take(/\b(?:piso (\d+)|(\d+)\s*(?:o|°|º)?\s*piso|piso alto|pisos altos)\b/);
  if (floor) {
    const n = Number(floor[1] ?? floor[2] ?? 5);
    filters.pisoMin = n;
    chips.push({ key: "pisoMin", label: floor[1] || floor[2] ? `Desde piso ${n}` : "Piso alto" });
  }

  for (const { re, type } of TYPE_RULES) if (take(re)) addType(type);

  for (const { re, amenity } of AMENITY_RULES) {
    if (take(re) && !filters.amenities?.includes(amenity)) {
      filters.amenities = [...(filters.amenities ?? []), amenity];
      chips.push({ key: `amenity:${amenity}`, label: AMENITY_LABEL[amenity] });
    }
  }

  if (take(/\b(con )?ascensor\b/)) {
    filters.soloConAscensor = true;
    chips.push({ key: "ascensor", label: "Con ascensor" });
  }
  if (take(/\b(cochera|garage|garaje|estacionamiento|parking)\b/)) {
    filters.cochera = ["incluida"];
    chips.push({ key: "cochera", label: "Con cochera" });
  }
  if (take(/\b(a estrenar|obra nueva|nuevos?|nuevas?)\b/)) {
    filters.antiguedad = ["a_estrenar"];
    chips.push({ key: "antiguedad", label: "A estrenar" });
  }
  if (take(/\b(apto credito|credito|hipoteca(ble|rio)?|financiacion bancaria)\b/)) {
    filters.aptoCreditoBancario = true;
    chips.push({ key: "credito", label: "Apto crédito" });
  }
  if (take(/\b(financiacion|financiamiento|en cuotas|cuotas|desarrollo|en pozo|pozo)\b/)) {
    filters.conDesarrollo = true;
    chips.push({ key: "desarrollo", label: "Con financiación" });
  }

  const unmatched = text
    .split(" ")
    .map((w) => w.replace(/[^a-z0-9ñ]/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  return { query, filters, operation, location, chips, unmatched: [...new Set(unmatched)] };
}

// --- Aplicar / quitar sobre el estado de Discovery ---------------------------

const union = <T>(a: T[], b: T[] = []) => [...new Set([...a, ...b])];

/** Suma lo interpretado al estado actual (listas se unen, valores se pisan). */
export function applyInterpretation(
  state: DiscoveryQueryState,
  interp: SearchInterpretation
): DiscoveryQueryState {
  const f = state.filters;
  const p = interp.filters;
  return {
    operation: interp.operation ?? state.operation,
    search: interp.location ?? "",
    filters: {
      ...f,
      ...p,
      types: union(f.types, p.types),
      amenities: union(f.amenities, p.amenities),
      antiguedad: union(f.antiguedad, p.antiguedad),
      cochera: union(f.cochera, p.cochera),
    },
  };
}

/** Quita del estado lo que representa un chip (la "x" del chip). */
export function removeChip(state: DiscoveryQueryState, key: string): DiscoveryQueryState {
  const f = { ...state.filters };
  const [kind, value] = key.split(":");
  switch (kind) {
    case "operation":
      return { ...state, operation: null };
    case "location":
      return { ...state, search: "" };
    case "type":
      f.types = f.types.filter((t) => t !== value);
      break;
    case "amenity":
      f.amenities = f.amenities.filter((a) => a !== value);
      break;
    case "bedrooms":
    case "bathrooms":
    case "priceMin":
    case "priceMax":
    case "surfaceMin":
    case "surfaceMax":
    case "pisoMin":
      f[kind] = null;
      break;
    case "ascensor":
      f.soloConAscensor = false;
      break;
    case "cochera":
      f.cochera = f.cochera.filter((c) => c !== "incluida");
      break;
    case "antiguedad":
      f.antiguedad = f.antiguedad.filter((a) => a !== "a_estrenar");
      break;
    case "credito":
      f.aptoCreditoBancario = false;
      break;
    case "desarrollo":
      f.conDesarrollo = false;
      break;
  }
  return { ...state, filters: f };
}

/** ¿Sigue vigente el chip? (se pudo haber quitado a mano desde el panel). */
export function isChipActive(
  state: DiscoveryQueryState,
  chip: AiChip,
  interp: SearchInterpretation
): boolean {
  const f = state.filters;
  const [kind, value] = chip.key.split(":");
  switch (kind) {
    case "operation":
      return state.operation === interp.operation;
    case "location":
      return state.search === interp.location;
    case "type":
      return f.types.includes(value as PropertyType);
    case "amenity":
      return f.amenities.includes(value as keyof PropertyAmenities);
    case "bedrooms":
    case "bathrooms":
    case "priceMin":
    case "priceMax":
    case "surfaceMin":
    case "surfaceMax":
    case "pisoMin":
      return f[kind] !== null && f[kind] === interp.filters[kind];
    case "ascensor":
      return f.soloConAscensor;
    case "cochera":
      return f.cochera.includes("incluida");
    case "antiguedad":
      return f.antiguedad.includes("a_estrenar");
    case "credito":
      return f.aptoCreditoBancario;
    case "desarrollo":
      return f.conDesarrollo;
    default:
      return false;
  }
}

/** Tags sugeridos del textarea "Búsqueda IA" (spec §3.8). */
export const SUGGESTED_AI_TAGS = [
  "Pet friendly",
  "Cerca del metro",
  "Con piscina",
  "A estrenar",
  "Con cochera",
  "Apto crédito",
];
