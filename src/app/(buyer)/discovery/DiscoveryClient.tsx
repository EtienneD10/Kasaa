"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Sparkles,
  SlidersHorizontal,
  Map as MapIcon,
  LayoutGrid,
  X,
  Landmark,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PropertyCard } from "@/components/property/PropertyCard";
import { InterstitialCard } from "@/components/property/InterstitialCard";
import { ImmersiveFeed } from "@/components/property/ImmersiveFeed";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { AdvancedFiltersPanel } from "@/components/discovery/AdvancedFiltersPanel";
import { mockProperties, buildDiscoverySections, pickInterstitials } from "@/lib/mock-data";
import {
  applyAdvancedFilters,
  countActiveFilterGroups,
  EMPTY_ADVANCED_FILTERS,
  type AdvancedFilters,
} from "@/lib/discovery-filters";
import { formatPrice, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  applyInterpretation,
  interpretSearch,
  isChipActive,
  removeChip,
  type DiscoveryQueryState,
  type SearchInterpretation,
} from "@/lib/ai-search";
import type { AvailabilitySlot, OperationType, Property, PropertyType } from "@/types";

/**
 * Discovery — pantalla principal del comprador. Reconstruida a partir del
 * archivo real de Figma (frame `desktop-discovery-default-cards`), no solo
 * de la spec escrita — ver TRACKING.md para el detalle de lo que cambió.
 *
 * Filtro real (no decorativo) sobre `mockProperties`: operación (llega
 * como query param desde el Landing Gateway), tipo de vivienda (chips
 * rápidos + el panel de Filtros avanzados completo, ver
 * `lib/discovery-filters.ts`), apto crédito, y búsqueda de texto libre.
 * El usuario aclaró la distinción entre el buscador (palabra clave sobre
 * ubicación/título) y "Filtros avanzados" (controles estructurados para
 * filtrar a mano) — dejaron de ser decorativos.
 */

type QuickChipId = PropertyType | "apto_credito";

// Chips rápidos de tipo de vivienda — antes "Apartamento"/"Casa" eran los
// únicos funcionales y "Ático"/"Estudio"/"Finca Rústica"/"Piso" quedaban
// decorativos por falta de datos; con la taxonomía ampliada (ver
// TRACKING.md) ya filtran todos. Selección múltiple = OR (cualquiera de
// los tipos activos), no AND — antes el código de Apartamento/Casa tenía
// ese bug latente (elegir los dos a la vez vaciaba los resultados).
const QUICK_TYPE_CHIPS: { id: PropertyType; label: string }[] = [
  { id: "departamento", label: "Apartamento" },
  { id: "casa", label: "Casa" },
  { id: "atico", label: "Ático" },
  { id: "estudio", label: "Estudio" },
  { id: "finca_rustica", label: "Finca Rústica" },
  { id: "piso", label: "Piso" },
];

const SECTIONS_PER_PAGE = 3;
const NO_REQUESTS = new Map<string, AvailabilitySlot>();

export function DiscoveryClient() {
  const searchParams = useSearchParams();
  const operationParam = searchParams.get("operation") as OperationType | null;

  const [operation, setOperation] = useState<OperationType | null>(operationParam);
  const [activeChips, setActiveChips] = useState<Set<QuickChipId>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "mapa">("grid");
  const [visibleSectionCount, setVisibleSectionCount] = useState(SECTIONS_PER_PAGE);
  const [advFilters, setAdvFilters] = useState<AdvancedFilters>(EMPTY_ADVANCED_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Solicitudes de visita enviadas en esta sesión, por propiedad — compartidas
  // entre las tarjetas de la grilla y el Feed inmersivo (sin backend todavía).
  const [requestedVisits, setRequestedVisits] = useState<Map<string, AvailabilitySlot>>(
    () => new Map()
  );
  // Feed inmersivo (spec §3.6): overlay sobre Discovery, que queda montado
  // debajo — "Volver a resultados" conserva scroll y filtros.
  const [feedStart, setFeedStart] = useState<Property | null>(null);
  // Las solicitudes son del comprador logueado: sin sesión (o tras cerrar
  // sesión) no se muestran — agendar pide iniciar sesión (`useLoginGate`).
  const { role } = useAuth();
  const visibleRequests = role === "comprador" ? requestedVisits : NO_REQUESTS;
  // Búsqueda IA (decisión abierta #8): última interpretación del texto
  // libre. Sus filtros viven en el estado normal (advFilters/operation/
  // appliedSearch) — esto sólo guarda la query y los chips para la franja.
  const [aiSearch, setAiSearch] = useState<SearchInterpretation | null>(null);

  function toggleChip(id: QuickChipId) {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setVisibleSectionCount(SECTIONS_PER_PAGE);
  }

  // Handlers estables (useCallback) para que `PropertyCard` (memo) no se
  // re-renderice entera con cada tecla en el buscador.
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const requestVisit = useCallback((propertyId: string, slot: AvailabilitySlot) => {
    // TODO: POST /api/visits — crea VisitRequest en estado "pendiente",
    // dispara WhatsApp al agente y arranca el timer de 2hs. Ver spec §5.1.
    console.log("Visit requested", propertyId, slot);
    setRequestedVisits((prev) => new Map(prev).set(propertyId, slot));
  }, []);

  const cancelVisit = useCallback((propertyId: string) => {
    // TODO: PATCH /api/visits/:id — pasa el VisitRequest real a estado
    // "cancelada" (spec §5.1) y para el timer de 2hs si seguía corriendo.
    // "Cancelar" en el estado Sent de `PropertyCard` anula la solicitud
    // de verdad, no es solo cerrar el panel — ver comentario ahí.
    console.log("Visit cancelled", propertyId);
    setRequestedVisits((prev) => {
      const next = new Map(prev);
      next.delete(propertyId);
      return next;
    });
  }, []);

  const closeFeed = useCallback(() => setFeedStart(null), []);

  // --- Filtro por chips (operación + tipo + apto crédito) ------------------
  const activeTypeChips = useMemo(
    () => [...activeChips].filter((id): id is PropertyType => id !== "apto_credito"),
    [activeChips]
  );

  const chipFiltered = useMemo(() => {
    return mockProperties.filter((p) => {
      if (operation && p.operation !== operation) return false;
      if (activeTypeChips.length && !activeTypeChips.includes(p.type)) return false;
      if (activeChips.has("apto_credito") && !p.financing.aptoCreditoBancario) return false;
      return true;
    });
  }, [operation, activeChips, activeTypeChips]);

  // --- Filtro por búsqueda de texto (ubicación) -----------------------------
  const searchFiltered = useMemo(() => {
    if (!appliedSearch.trim()) return chipFiltered;
    const q = appliedSearch.trim().toLowerCase();
    return chipFiltered.filter(
      (p) =>
        p.location.neighborhood.toLowerCase().includes(q) ||
        p.location.city.toLowerCase().includes(q) ||
        p.location.address.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
    );
  }, [chipFiltered, appliedSearch]);

  // --- Filtros avanzados (panel completo) -----------------------------------
  // El botón "Filtros avanzados" del Header/barra de chips era decorativo
  // (title="Próximamente") — el usuario mandó el frame real
  // (`desktop-discovery-ai-search + advanced-filters-panel`) y aclaró que
  // es un mecanismo aparte del buscador de texto: acá se filtra "a mano"
  // con controles estructurados. Ver `lib/discovery-filters.ts`.
  const advancedFiltered = useMemo(
    () => applyAdvancedFilters(searchFiltered, advFilters),
    [searchFiltered, advFilters]
  );
  const activeAdvancedCount = countActiveFilterGroups(advFilters);

  const sections = useMemo(() => buildDiscoverySections(advancedFiltered), [advancedFiltered]);
  const interstitials = useMemo(() => pickInterstitials(advancedFiltered), [advancedFiltered]);

  // --- Búsqueda IA ------------------------------------------------------------
  const queryState: DiscoveryQueryState = {
    filters: advFilters,
    operation,
    search: appliedSearch,
  };

  function setQueryState(next: DiscoveryQueryState) {
    setAdvFilters(next.filters);
    setOperation(next.operation);
    setAppliedSearch(next.search);
  }

  /** Quita del estado lo que había agregado la interpretación anterior. */
  function withoutPreviousAi(state: DiscoveryQueryState) {
    if (!aiSearch) return state;
    return aiSearch.chips
      .filter((c) => isChipActive(state, c, aiSearch))
      .reduce((s, c) => removeChip(s, c.key), state);
  }

  // Header (Enter / ✦) y textarea "Búsqueda IA" del panel usan esto.
  function runSearch(text: string) {
    setVisibleSectionCount(SECTIONS_PER_PAGE);
    const base = withoutPreviousAi(queryState);
    const query = text.trim();
    const interp = query ? interpretSearch(query) : null;
    if (!interp || interp.chips.length === 0) {
      // Nada estructurado reconocido: búsqueda de texto como antes (puede
      // terminar en el estado vacío "zona sin cobertura").
      setQueryState({ ...base, search: query });
      setAiSearch(null);
      return;
    }
    setQueryState(applyInterpretation(base, interp));
    setAiSearch(interp);
  }

  function removeAiChip(key: string) {
    setQueryState(removeChip(queryState, key));
  }

  function clearAiSearch() {
    setQueryState(withoutPreviousAi(queryState));
    setAiSearch(null);
    setSearchInput("");
  }

  // Chips todavía vigentes (se pueden haber quitado a mano desde el panel).
  const activeAiChips = aiSearch
    ? aiSearch.chips.filter((c) => isChipActive(queryState, c, aiSearch))
    : [];
  const showAiStrip = !!aiSearch && activeAiChips.length > 0;

  const activeFilterPills = [
    // Con la franja de búsqueda IA visible, la operación y el resumen de
    // filtros avanzados ya están representados por sus chips.
    ...(operation && !showAiStrip
      ? [{ id: "operation", label: operation === "venta" ? "En venta" : "En alquiler" }]
      : []),
    ...QUICK_TYPE_CHIPS.filter((c) => activeChips.has(c.id)).map((c) => ({
      id: c.id,
      label: c.label,
    })),
    ...(activeAdvancedCount > 0 && !showAiStrip
      ? [
          {
            id: "advanced",
            label: `${activeAdvancedCount} filtro${activeAdvancedCount === 1 ? "" : "s"} avanzado${activeAdvancedCount === 1 ? "" : "s"}`,
          },
        ]
      : []),
  ];
  // El estado vacío "filtros restrictivos" necesita poder quitar cualquier
  // cosa, incluidos los chips de la búsqueda IA.
  const emptyStatePills = [
    ...activeAiChips.map((c) => ({ id: `ai:${c.key}`, label: c.label })),
    ...activeFilterPills,
  ];

  function removeFilter(id: string) {
    if (id.startsWith("ai:")) removeAiChip(id.slice(3));
    else if (id === "operation") setOperation(null);
    else if (id === "advanced") setAdvFilters(EMPTY_ADVANCED_FILTERS);
    else
      setActiveChips((prev) => {
        const next = new Set(prev);
        next.delete(id as QuickChipId);
        return next;
      });
  }

  function clearAllFilters() {
    setOperation(null);
    setActiveChips(new Set());
    setAdvFilters(EMPTY_ADVANCED_FILTERS);
    if (aiSearch) {
      setAiSearch(null);
      setAppliedSearch("");
      setSearchInput("");
    }
  }

  // "Restrictivos" cubre tanto los chips rápidos como el panel avanzado —
  // conceptualmente es el mismo estado vacío (spec §3.3): el problema son
  // los FILTROS, no el texto buscado (eso es "zona-sin-cobertura" abajo).
  const showFiltrosRestrictivos =
    chipFiltered.length === 0 ||
    (searchFiltered.length > 0 && advancedFiltered.length === 0 && activeAdvancedCount > 0);
  const showZonaSinCobertura =
    !showFiltrosRestrictivos && appliedSearch.trim() && searchFiltered.length === 0;

  const visibleSections = sections.slice(0, visibleSectionCount);
  const hasMoreSections = sections.length > visibleSectionCount;

  return (
    <div className="min-h-screen bg-buyer-bg">
      <Header
        centerSlot={
          <div className="mx-auto flex h-12 max-w-[480px] items-center gap-2.5 rounded-pill bg-buyer-input-bg px-4">
            <MapPin size={17} className="shrink-0 text-buyer-text-faint" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch(searchInput);
              }}
              placeholder="Buscar en tu zona, ciudad o código postal"
              aria-label="Buscar propiedades"
              className="w-full bg-transparent text-sm outline-none placeholder:text-buyer-text-faint"
            />
            <button
              onClick={() => runSearch(searchInput)}
              aria-label="Buscar con IA"
              title="Describí lo que buscás: zona, tipo, presupuesto, mascotas…"
              className="shrink-0 text-accent"
            >
              <Sparkles size={16} />
            </button>
          </div>
        }
      />

      <div className="sticky top-20 z-10 border-b border-buyer-border bg-buyer-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-8 py-3">
          {QUICK_TYPE_CHIPS.map((chip) => {
            const active = activeChips.has(chip.id);
            return (
              <button
                key={chip.id}
                onClick={() => toggleChip(chip.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-pill border px-3.5 py-2 text-sm transition-colors",
                  active
                    ? "border-2 border-accent bg-white font-bold text-buyer-text"
                    : "border-buyer-border bg-white text-buyer-text hover:border-buyer-text"
                )}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                {chip.label}
              </button>
            );
          })}
          <button
            onClick={() => toggleChip("apto_credito")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-pill border px-3.5 py-2 text-sm transition-colors",
              activeChips.has("apto_credito")
                ? "border-2 border-accent bg-white font-bold text-buyer-text"
                : "border-buyer-border bg-white text-buyer-text hover:border-buyer-text"
            )}
          >
            <Landmark size={14} className="text-buyer-text-muted" /> Apto crédito
          </button>

          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-pill border border-buyer-border bg-white px-3.5 py-2 text-sm text-buyer-text hover:border-buyer-text"
          >
            <SlidersHorizontal size={15} /> Filtros avanzados
            {activeAdvancedCount > 0 && (
              <span className="ml-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {activeAdvancedCount}
              </span>
            )}
          </button>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 pb-3">
          <p className="text-sm text-buyer-text-muted">
            {advancedFiltered.length} propiedades encontradas en Barcelona
          </p>
          <div className="flex items-center gap-1 rounded-pill border border-buyer-border p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "grid"
                  ? "border border-buyer-border bg-white text-buyer-text"
                  : "text-buyer-text-muted"
              )}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              onClick={() => setViewMode("mapa")}
              className={cn(
                "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "mapa"
                  ? "border border-buyer-border bg-white text-buyer-text"
                  : "text-buyer-text-muted"
              )}
            >
              <MapIcon size={14} /> Mapa
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-8 py-8">
        {showAiStrip && aiSearch && (
          <div className="mb-6 rounded-card border border-accent/40 bg-accent-tint p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-buyer-text-muted">
                  <Sparkles size={12} className="text-accent" /> Resultados para tu búsqueda
                </p>
                <p className="mt-1 truncate font-display text-lg font-semibold text-buyer-text">
                  &ldquo;{aiSearch.query}&rdquo;
                </p>
              </div>
              <button
                onClick={clearAiSearch}
                className="shrink-0 text-xs font-semibold text-buyer-text-muted underline"
              >
                Limpiar búsqueda
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeAiChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => removeAiChip(chip.key)}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="flex items-center gap-1.5 rounded-pill border border-buyer-border bg-white px-3 py-1.5 text-xs font-medium text-buyer-text hover:border-buyer-text"
                >
                  {chip.key === "location" && <MapPin size={11} className="text-accent" />}
                  {chip.label} <X size={11} className="text-buyer-text-faint" />
                </button>
              ))}
            </div>
            {aiSearch.unmatched.length > 0 && (
              <p className="mt-2.5 text-xs text-buyer-text-faint">
                Sin filtro para: {aiSearch.unmatched.join(", ")} — probá con los{" "}
                <button
                  onClick={() => setShowAdvancedFilters(true)}
                  className="font-semibold text-buyer-text-muted underline"
                >
                  Filtros avanzados
                </button>
                .
              </p>
            )}
          </div>
        )}

        {activeFilterPills.length > 0 && !showFiltrosRestrictivos && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeFilterPills.map((f) => (
              <button
                key={f.id}
                onClick={() => removeFilter(f.id)}
                className="flex items-center gap-1.5 rounded-pill border border-buyer-border bg-white px-2.5 py-1 text-xs text-buyer-text"
              >
                {f.label} <X size={11} className="text-buyer-text-faint" />
              </button>
            ))}
          </div>
        )}

        {showFiltrosRestrictivos ? (
          <DiscoveryEmptyState
            variant="filtros-restrictivos"
            activeFilters={emptyStatePills}
            onRemoveFilter={removeFilter}
            onClearAll={clearAllFilters}
          />
        ) : viewMode === "mapa" ? (
          <MapaPlaceholder count={advancedFiltered.length} />
        ) : showZonaSinCobertura ? (
          <DiscoveryEmptyState
            variant="zona-sin-cobertura"
            query={appliedSearch}
            onClearSearch={() => {
              setSearchInput("");
              setAppliedSearch("");
            }}
          />
        ) : (
          <div className="flex flex-col">
            {visibleSections.map((section, i) => (
              <div key={section.id}>
                <section className={i === 0 ? "" : "mt-16"}>
                  <h2 className="font-display text-2xl font-semibold text-buyer-text">
                    {section.title}
                  </h2>
                  <p className="mb-6 mt-1 text-sm text-buyer-text-muted">{section.subtitle}</p>
                  {/* items-start: una tarjeta que se expande (agendar visita) crece SOLA;
                      con el stretch por defecto estiraba a todas las de su fila y
                      las demás quedaban con un hueco blanco, como si también
                      estuvieran abiertas. */}
                  <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {section.properties.map((property) => (
                      <PropertyCard
                        key={`${section.id}-${property.id}`}
                        property={property}
                        isFavorite={favorites.has(property.id)}
                        requestedSlot={visibleRequests.get(property.id) ?? null}
                        onToggleFavorite={toggleFavorite}
                        onRequestVisit={requestVisit}
                        onCancelVisit={cancelVisit}
                        onOpenImmersive={setFeedStart}
                      />
                    ))}
                  </div>
                </section>

                {/* Interstitial cada 2 secciones, spec §3.3 */}
                {i % 2 === 1 && interstitials[Math.floor(i / 2)] && (
                  <div className="mt-16">
                    <InterstitialCard property={interstitials[Math.floor(i / 2)]} />
                  </div>
                )}
              </div>
            ))}

            {hasMoreSections && (
              <div className="mt-16 flex justify-center">
                <button
                  onClick={() => setVisibleSectionCount((n) => n + SECTIONS_PER_PAGE)}
                  className="rounded-control border border-buyer-border bg-buyer-surface px-6 py-3 text-sm font-semibold text-buyer-text hover:border-buyer-text"
                >
                  Ver más propiedades
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Montado siempre (no `showAdvancedFilters && <...>`) para que el
          backdrop con blur y el slide-in/out del panel tengan tiempo de
          animar — `open` controla la transición vía clases. */}
      <AdvancedFiltersPanel
        open={showAdvancedFilters}
        filters={advFilters}
        onChange={setAdvFilters}
        onClose={() => setShowAdvancedFilters(false)}
        resultCount={advancedFiltered.length}
        searchDraft={searchInput}
        onSearchDraftChange={setSearchInput}
        onApplySearch={() => {
          runSearch(searchInput);
          setShowAdvancedFilters(false);
        }}
      />

      {feedStart && (
        <ImmersiveFeed
          startProperty={feedStart}
          pool={advancedFiltered}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          requestedVisits={visibleRequests}
          onRequestVisit={requestVisit}
          onCancelVisit={cancelVisit}
          onClose={closeFeed}
        />
      )}
    </div>
  );
}

/**
 * Vista Mapa — spec §3.3: "split screen (lista + mapa interactivo), pines
 * con clustering, preview flotante al click". Placeholder mínimo (lista
 * real, mapa pendiente) — queda como próximo ítem en TRACKING.md, requiere
 * elegir proveedor de mapas (Mapbox/Google Maps/MapLibre).
 */
function MapaPlaceholder({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-card border border-buyer-border bg-buyer-surface p-4 md:grid-cols-[360px_1fr]">
      <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
        {mockProperties.slice(0, count || 6).map((p) => (
          <div key={p.id} className="flex gap-3 rounded-control border border-buyer-border p-2">
            {/* alt="" — el título ya se repite como texto al lado */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.photos[0]}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg bg-buyer-border/40 object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-buyer-text">{p.title}</p>
              <p className="text-xs text-buyer-text-muted">{p.location.neighborhood}</p>
              <p className="text-sm font-bold text-buyer-text">
                {formatPrice(p.price, p.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-control bg-buyer-bg text-center">
        <MapIcon size={28} className="mb-3 text-buyer-text-faint" />
        <p className="text-sm font-semibold text-buyer-text">Mapa interactivo — próximamente</p>
        <p className="mt-1 max-w-xs text-xs text-buyer-text-muted">
          Clustering de pines y preview flotante al click (spec §3.3). Falta
          elegir proveedor de mapas.
        </p>
      </div>
    </div>
  );
}
