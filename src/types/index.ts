// Kasaa — tipos centrales. Ver kasaa-spec-completa.md §3–§5.

export type OperationType = "venta" | "alquiler";

export type PropertyStatus =
  | "borrador"
  | "publicada"
  | "pausada"
  | "pendiente_confirmacion" // regla de 20 días, spec §5.4
  | "vencida";

export type VisitStatus =
  | "pendiente" // timer de 2hs corriendo, spec §5.1
  | "aceptada"
  | "cancelada"
  | "vencida_sin_respuesta";

export type LeadStage =
  | "nuevo_lead"
  | "contactado"
  | "visita_agendada"
  | "visita_realizada"
  | "negociacion"
  | "cerrado_ganado"
  | "cerrado_perdido";

export type UserRole = "comprador" | "agente";

export interface Agent {
  id: string;
  name: string;
  agency: string;
  avatarUrl?: string;
  phoneWhatsApp: string;
  rating?: number;
  responseRateWithin2h?: number; // % — spec §5.1, métrica clave del dashboard
  /** Solo se usa en la pantalla "Equipo" del panel de agente (frame real
   * `equipo-team`) — rol dentro de la agencia. Los agentes de propiedades
   * del lado comprador (agt-1/2/3) no lo necesitan, por eso es opcional. */
  role?: "admin" | "agente";
  /** Permisos granulares de "Equipo" (frame real `equipo-team`, sección
   * "Permisos y Roles") — 3 toggles fijos que vio el frame, no un sistema
   * de permisos genérico. Opcional por el mismo motivo que `role`. */
  permissions?: {
    gestionarPropiedades: boolean;
    verPipelineCompleto: boolean;
    invitarAgentes: boolean;
  };
}

export interface PropertyCharacteristics {
  antiguedad: "a_estrenar" | "1_5" | "6_15" | "16_30" | "30_mas";
  orientacion: ("norte" | "sur" | "este" | "oeste" | "combinada")[];
  piso?: number;
  totalPisos?: number;
  ascensor: boolean;
  expensas?: number;
  disposicion: "frente" | "contrafrente" | "interno";
  cochera: "incluida" | "opcional" | "no_tiene";
  superficieCubierta: number;
  superficieDescubierta?: number;
  estadoConservacion: "a_estrenar" | "muy_bueno" | "bueno" | "a_refaccionar";
}

export interface PropertyFinancing {
  aptoCreditoBancario: boolean;
  bancosParticipantes?: string[];
  esDesarrollo: boolean;
  anticipoPorcentaje?: number;
  cuotas?: number;
  plazoEntrega?: string;
  ajusteCuotas?: "fijo_usd" | "ajustable_indice" | "otro";
}

export interface AvailabilitySlot {
  date: string; // ISO date
  time: string; // "HH:mm"
  isFeatured?: boolean; // "Fecha Destacada" — spec §5.5
  durationMinutes?: number; // usado por VisitRequest.slot en Agenda; default 45 si falta
}

// Taxonomía ampliada para el panel de Filtros avanzados (frame
// `desktop-discovery-ai-search + advanced-filters-panel`) — el chip "TIPO
// DE VIVIENDA" ahí tiene 8 opciones (Apartamento/Casa/Piso/Estudio/Finca
// Rústica/Chalet/Local/Oficina), más finas que las 5 originales. Se
// mantiene "ph" (no aparece en ese chip set, es un tipo de vivienda
// típico de Argentina que había en la primera versión) para no perder
// datos existentes; simplemente no es seleccionable desde los chips.
export type PropertyType =
  | "departamento"
  | "piso"
  | "casa"
  | "atico"
  | "estudio"
  | "finca_rustica"
  | "chalet"
  | "local"
  | "oficina"
  | "ph"
  | "otro";

// "ESTADO DE VIDA" del panel de Filtros avanzados — amenities/lifestyle
// que no tenían campo propio en el modelo (por eso los chips "Pet
// Friendly"/"Cerca de parques"/etc. del estado de búsqueda con IA en
// Discovery quedaban decorativos). Ver TRACKING.md, sección "Rediseño
// 2026-08", para el detalle de qué se agregó y por qué.
export interface PropertyAmenities {
  petFriendly: boolean;
  balcon: boolean;
  piscina: boolean;
  vistaAlMar: boolean;
  cercaDeParques: boolean;
  cercaDeMetro: boolean;
}

export interface Property {
  id: string;
  code: string; // ej. "PG-0234" — spec §5.6
  title: string;
  operation: OperationType;
  type: PropertyType;
  price: number;
  currency: "USD" | "ARS" | "EUR";
  location: {
    address: string;
    neighborhood: string;
    city: string;
    lat: number;
    lng: number;
  };
  bedrooms: number;
  bathrooms: number;
  characteristics: PropertyCharacteristics;
  financing: PropertyFinancing;
  amenities: PropertyAmenities;
  photos: string[];
  videoUrl?: string;
  status: PropertyStatus;
  agent: Agent;
  favoriteCount: number;
  availability: AvailabilitySlot[];
  lastUpdatedAt: string;
  createdAt: string;
}

export interface VisitRequest {
  id: string;
  propertyId: string;
  buyerName: string;
  buyerPhone: string;
  requestedAt: string; // timestamp — arranca el timer de 2hs
  slot: AvailabilitySlot;
  status: VisitStatus;
  respondedAt?: string;
  originChannel: "app" | "whatsapp_social"; // spec §5.6 / registro manual
}

export interface Lead {
  id: string;
  buyerName: string;
  buyerPhone: string;
  propertyId: string;
  stage: LeadStage;
  lastActivityAt: string;
  highIntent?: boolean;
  assignedAgentId: string;
  notes?: string;
}

// "Atención Requerida" del Dashboard Home de agente (spec §5.1, frame
// real `dashboard-home`) — no es una entidad de negocio propia, es una
// agregación de UI sobre varias fuentes (visitas por vencer, propiedades
// sin confirmar vigencia, propiedades sin fotos, etc.), así que se
// modela suelta en vez de forzarla dentro de Property/VisitRequest.
export type AgentAttentionSeverity = "critico" | "atencion" | "info";

export interface AgentAttentionItem {
  id: string;
  severity: AgentAttentionSeverity;
  icon: "reloj" | "publicaciones" | "visita" | "fotos";
  title: string;
  body: string;
  ctaLabel: string;
}

// Horario que el agente bloquea a mano desde Agenda (frame
// `agent-agenda-screen`, botón "Bloquear horario") — no es una visita,
// es simplemente un hueco marcado como no disponible en el calendario.
export interface BlockedSlot {
  id: string;
  date: string; // ISO date
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  reason?: string;
}
