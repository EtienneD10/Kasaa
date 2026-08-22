import type { Agent, AgentAttentionItem, BlockedSlot, Lead, Property, VisitRequest } from "@/types";

// Nota: hasta que exista backend, todas las pantallas leen de acá — ver
// TRACKING.md "Mock data en lib/mock-data.ts". Se amplió el set inicial
// (3 propiedades) a ~24 para poder poblar las secciones temáticas de
// Discovery (spec §3.3: "Destacadas" / "Recién publicadas" / "Cerca de tu
// última búsqueda", 8 tarjetas cada una) sin repetir contenido.

const agents: Agent[] = [
  {
    id: "agt-1",
    name: "María García",
    agency: "RE/MAX Elite",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
    phoneWhatsApp: "5491155551234",
    rating: 4.8,
    responseRateWithin2h: 94,
  },
  {
    id: "agt-2",
    name: "Diego Fernández",
    agency: "Century 21 Norte",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200",
    phoneWhatsApp: "5491155559876",
    rating: 4.6,
    responseRateWithin2h: 88,
  },
  {
    id: "agt-3",
    name: "Lucía Romero",
    agency: "Kasaa Partners",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200",
    phoneWhatsApp: "5491155554321",
    rating: 4.9,
    responseRateWithin2h: 97,
  },
  // Agente logueado del panel `/agente` (frame real `dashboard-home`) —
  // separado de agt-1/2/3 (que son agentes de propiedades del lado
  // comprador) porque el dashboard necesita su propio catálogo, sus
  // propias visitas de hoy y sus propias alertas, sin pisar el mock
  // existente. Nombre/agencia tomados literal del frame.
  {
    id: "agt-4",
    name: "María Rodríguez",
    agency: "Agencia Palermo Gold",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
    phoneWhatsApp: "5491155550001",
    rating: 4.8,
    responseRateWithin2h: 94, // = "Tasa de Respuesta" del dashboard
    role: "admin",
    permissions: { gestionarPropiedades: true, verPipelineCompleto: true, invitarAgentes: true },
  },
  // Resto del equipo de "Agencia Palermo Gold" — solo para la pantalla
  // "Equipo" (frame real `equipo-team`); no tienen catálogo propio en el
  // mock (no aparecen como `agent` de ninguna property ni firman
  // VisitRequest alguna), así que las columnas "Prop. Act."/"Leads" de esa
  // tabla son constantes ilustrativas por fila (ver `mockTeamStats` más
  // abajo), mismo criterio que `mockAgentDashboardStats`. Nota: "Gastón
  // Pérez" acá es un AGENTE del equipo, coincidencia de nombre con el
  // comprador "Gastón Pérez" de `mockAgentTodayVisits` (son personas
  // distintas en la ficción del producto) — ver TRACKING.md.
  {
    id: "agt-5",
    name: "Carlos Martínez",
    agency: "Agencia Palermo Gold",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    phoneWhatsApp: "5491155550002",
    responseRateWithin2h: 88,
    role: "agente",
    permissions: { gestionarPropiedades: true, verPipelineCompleto: false, invitarAgentes: false },
  },
  {
    id: "agt-6",
    name: "Sofía Lares",
    agency: "Agencia Palermo Gold",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
    phoneWhatsApp: "5491155550003",
    responseRateWithin2h: 91,
    role: "agente",
    permissions: { gestionarPropiedades: true, verPipelineCompleto: false, invitarAgentes: false },
  },
  {
    id: "agt-7",
    name: "Gastón Pérez",
    agency: "Agencia Palermo Gold",
    avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200",
    phoneWhatsApp: "5491155550004",
    responseRateWithin2h: 65,
    role: "agente",
    permissions: { gestionarPropiedades: true, verPipelineCompleto: false, invitarAgentes: false },
  },
];

/**
 * Miembros de "Agencia Palermo Gold" para la pantalla "Equipo" (frame
 * real `equipo-team`) — los únicos agentes del array `agents` que tienen
 * `role` seteado (agt-1/2/3 son agentes de propiedades del lado
 * comprador, sin rol de equipo). Orden: admin primero (María Rodríguez,
 * la logueada), después el resto tal cual aparecen en el frame.
 */
export const mockTeamMembers: Agent[] = agents.filter((a) => a.role);

/**
 * Stats por fila de la tabla "Equipo" (frame real `equipo-team`) —
 * "Prop. Act." y "Leads" quedan como constantes ilustrativas a propósito
 * (no hay backend de asignación de propiedades/leads por agente
 * individual todavía), igual que `mockAgentDashboardStats`. Ojo: la fila
 * de María Rodríguez muestra "12" propiedades activas acá, el mismo
 * número que `mockAgentDashboardStats.propiedadesActivas` (que es el
 * total de LA AGENCIA, no de ella individualmente) — es una
 * inconsistencia que ya traía el archivo de referencia entre este frame
 * y `dashboard-home` (los 5 properties reales del mock, p25-p29, no
 * alcanzarían para sumar 12+9+0+0=21), documentada en TRACKING.md en vez
 * de forzar una reconciliación inventando propiedades de más.
 */
export const mockTeamStats: Record<string, { propiedadesActivas: number; leads: number }> = {
  "agt-4": { propiedadesActivas: 12, leads: 28 },
  "agt-5": { propiedadesActivas: 9, leads: 11 },
  "agt-6": { propiedadesActivas: 0, leads: 14 },
  "agt-7": { propiedadesActivas: 0, leads: 0 },
};

const today = new Date();
const iso = (daysFromNow: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
};

interface Blueprint {
  id: string;
  code: string;
  title: string;
  operation: Property["operation"];
  type: Property["type"];
  price: number;
  currency: Property["currency"];
  neighborhood: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  superficieCubierta: number;
  photo?: string; // sin foto → propiedad "sin imágenes" (panel de agente, alerta de Atención Requerida)
  agent: Agent;
  favoriteCount: number;
  createdDaysAgo: number;
  updatedDaysAgo: number;
  availabilityDays: number[]; // offsets desde hoy
  esDesarrollo?: boolean;
  status?: Property["status"]; // default "publicada" si no se especifica
}

const blueprints: Blueprint[] = [
  {
    id: "p1",
    code: "PG-0234",
    title: "Penthouse Vista Ciudad Exclusivo",
    operation: "venta",
    type: "departamento",
    price: 2450000,
    currency: "USD",
    neighborhood: "Palermo",
    city: "Barcelona",
    address: "Paseo de Gracia 2400",
    lat: 41.3917,
    lng: 2.1649,
    bedrooms: 4,
    bathrooms: 3,
    superficieCubierta: 210,
    photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    agent: agents[0],
    favoriteCount: 542,
    createdDaysAgo: -30,
    updatedDaysAgo: -2,
    availabilityDays: [0, 1, 3],
  },
  {
    id: "p2",
    code: "PG-0235",
    title: "Estudio de Artista Reformado",
    operation: "alquiler",
    type: "estudio",
    price: 1150,
    currency: "USD",
    neighborhood: "El Born",
    city: "Barcelona",
    address: "Gorriti 1200",
    lat: 41.3851,
    lng: 2.1811,
    bedrooms: 2,
    bathrooms: 1,
    superficieCubierta: 85,
    photo: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    agent: agents[0],
    favoriteCount: 210,
    createdDaysAgo: -15,
    updatedDaysAgo: -1,
    availabilityDays: [2],
  },
  {
    id: "p3",
    code: "PG-0236",
    title: "Ático Exclusivo con Terraza Privada",
    operation: "venta",
    type: "atico",
    price: 3800000,
    currency: "USD",
    neighborhood: "Diagonal Mar",
    city: "Barcelona",
    address: "Diagonal Mar 500",
    lat: 41.4036,
    lng: 2.2158,
    bedrooms: 5,
    bathrooms: 3,
    superficieCubierta: 310,
    photo: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
    agent: agents[1],
    favoriteCount: 542,
    createdDaysAgo: -40,
    updatedDaysAgo: -5,
    availabilityDays: [],
    esDesarrollo: true,
  },
  {
    id: "p4",
    code: "PG-0237",
    title: "Casa con Jardín en Zona Residencial",
    operation: "venta",
    type: "casa",
    price: 890000,
    currency: "USD",
    neighborhood: "Sarrià",
    city: "Barcelona",
    address: "Calle Anglí 45",
    lat: 41.3989,
    lng: 2.1226,
    bedrooms: 4,
    bathrooms: 2,
    superficieCubierta: 240,
    photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    agent: agents[2],
    favoriteCount: 318,
    createdDaysAgo: -3,
    updatedDaysAgo: -1,
    availabilityDays: [0, 2, 4],
  },
  {
    id: "p5",
    code: "PG-0238",
    title: "PH Luminoso con Patio Interno",
    operation: "alquiler",
    type: "ph",
    price: 980,
    currency: "USD",
    neighborhood: "Gràcia",
    city: "Barcelona",
    address: "Carrer de Verdi 88",
    lat: 41.4072,
    lng: 2.1533,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 120,
    photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    agent: agents[1],
    favoriteCount: 156,
    createdDaysAgo: -2,
    updatedDaysAgo: -2,
    availabilityDays: [1, 3],
  },
  {
    id: "p6",
    code: "PG-0239",
    title: "Departamento a Estrenar con Amenities",
    operation: "venta",
    type: "departamento",
    price: 415000,
    currency: "USD",
    neighborhood: "Poblenou",
    city: "Barcelona",
    address: "Rambla del Poblenou 150",
    lat: 41.4009,
    lng: 2.2027,
    bedrooms: 2,
    bathrooms: 2,
    superficieCubierta: 78,
    photo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    agent: agents[2],
    favoriteCount: 402,
    createdDaysAgo: -1,
    updatedDaysAgo: 0,
    availabilityDays: [0, 1, 2],
    esDesarrollo: true,
  },
  {
    id: "p7",
    code: "PG-0240",
    title: "Loft Industrial Reciclado",
    operation: "alquiler",
    type: "oficina",
    price: 1450,
    currency: "USD",
    neighborhood: "Poble Sec",
    city: "Barcelona",
    address: "Carrer de Blai 20",
    lat: 41.3745,
    lng: 2.1622,
    bedrooms: 1,
    bathrooms: 1,
    superficieCubierta: 95,
    photo: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    agent: agents[0],
    favoriteCount: 289,
    createdDaysAgo: -6,
    updatedDaysAgo: -1,
    availabilityDays: [2, 5],
  },
  {
    id: "p8",
    code: "PG-0241",
    title: "Casa Moderna con Piscina",
    operation: "venta",
    type: "casa",
    price: 1650000,
    currency: "USD",
    neighborhood: "Pedralbes",
    city: "Barcelona",
    address: "Avenida Pearson 12",
    lat: 41.3903,
    lng: 2.1128,
    bedrooms: 5,
    bathrooms: 4,
    superficieCubierta: 380,
    photo: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
    agent: agents[1],
    favoriteCount: 611,
    createdDaysAgo: -25,
    updatedDaysAgo: -3,
    availabilityDays: [0, 3],
  },
  {
    id: "p9",
    code: "PG-0242",
    title: "Local Comercial a la Calle",
    operation: "alquiler",
    type: "local",
    price: 2100,
    currency: "USD",
    neighborhood: "Eixample",
    city: "Barcelona",
    address: "Carrer d'Aragó 300",
    lat: 41.3927,
    lng: 2.1615,
    bedrooms: 0,
    bathrooms: 1,
    superficieCubierta: 140,
    photo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    agent: agents[2],
    favoriteCount: 74,
    createdDaysAgo: -12,
    updatedDaysAgo: -4,
    availabilityDays: [1],
  },
  {
    id: "p10",
    code: "PG-0243",
    title: "Dúplex con Vistas al Mar",
    operation: "venta",
    type: "piso",
    price: 1120000,
    currency: "USD",
    neighborhood: "Barceloneta",
    city: "Barcelona",
    address: "Passeig Marítim 60",
    lat: 41.3808,
    lng: 2.1925,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 160,
    photo: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800",
    agent: agents[0],
    favoriteCount: 478,
    createdDaysAgo: -4,
    updatedDaysAgo: 0,
    availabilityDays: [0, 1, 4],
  },
  {
    id: "p11",
    code: "PG-0244",
    title: "Departamento Familiar Reformado",
    operation: "alquiler",
    type: "departamento",
    price: 1300,
    currency: "USD",
    neighborhood: "Les Corts",
    city: "Barcelona",
    address: "Travessera de les Corts 200",
    lat: 41.3833,
    lng: 2.1272,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 105,
    photo: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    agent: agents[1],
    favoriteCount: 133,
    createdDaysAgo: -1,
    updatedDaysAgo: -1,
    availabilityDays: [2, 3],
  },
  {
    id: "p12",
    code: "PG-0245",
    title: "Casa Adosada en Barrio Tranquilo",
    operation: "venta",
    type: "casa",
    price: 620000,
    currency: "USD",
    neighborhood: "Horta",
    city: "Barcelona",
    address: "Carrer de Tajo 15",
    lat: 41.4322,
    lng: 2.1526,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 165,
    photo: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    agent: agents[2],
    favoriteCount: 201,
    createdDaysAgo: -8,
    updatedDaysAgo: -2,
    availabilityDays: [1, 2],
  },
  {
    id: "p13",
    code: "PG-0246",
    title: "Penthouse con Terraza 360°",
    operation: "venta",
    type: "atico",
    price: 2980000,
    currency: "USD",
    neighborhood: "Sant Gervasi",
    city: "Barcelona",
    address: "Carrer de Muntaner 400",
    lat: 41.4009,
    lng: 2.1442,
    bedrooms: 4,
    bathrooms: 3,
    superficieCubierta: 250,
    photo: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
    agent: agents[0],
    favoriteCount: 690,
    createdDaysAgo: -20,
    updatedDaysAgo: -6,
    availabilityDays: [0],
  },
  {
    id: "p14",
    code: "PG-0247",
    title: "Departamento Compacto cerca del Metro",
    operation: "alquiler",
    type: "departamento",
    price: 850,
    currency: "USD",
    neighborhood: "Sant Antoni",
    city: "Barcelona",
    address: "Carrer del Comte Borrell 100",
    lat: 41.3765,
    lng: 2.1614,
    bedrooms: 1,
    bathrooms: 1,
    superficieCubierta: 48,
    photo: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    agent: agents[1],
    favoriteCount: 97,
    createdDaysAgo: 0,
    updatedDaysAgo: 0,
    availabilityDays: [1, 2, 3],
  },
  {
    id: "p15",
    code: "PG-0248",
    title: "Villa con Jardín y Cochera Doble",
    operation: "venta",
    type: "chalet",
    price: 1980000,
    currency: "USD",
    neighborhood: "Tres Torres",
    city: "Barcelona",
    address: "Carrer d'Anglí 90",
    lat: 41.397,
    lng: 2.1211,
    bedrooms: 5,
    bathrooms: 4,
    superficieCubierta: 340,
    photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    agent: agents[2],
    favoriteCount: 455,
    createdDaysAgo: -18,
    updatedDaysAgo: -3,
    availabilityDays: [2, 4],
  },
  {
    id: "p16",
    code: "PG-0249",
    title: "PH a Estrenar con Balcón",
    operation: "venta",
    type: "ph",
    price: 340000,
    currency: "USD",
    neighborhood: "Poblenou",
    city: "Barcelona",
    address: "Carrer de Pallars 220",
    lat: 41.4021,
    lng: 2.1979,
    bedrooms: 2,
    bathrooms: 1,
    superficieCubierta: 68,
    photo: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    agent: agents[0],
    favoriteCount: 176,
    createdDaysAgo: -1,
    updatedDaysAgo: -1,
    availabilityDays: [0, 1],
    esDesarrollo: true,
  },
  {
    id: "p17",
    code: "PG-0250",
    title: "Departamento con Vista al Parque",
    operation: "alquiler",
    type: "piso",
    price: 1600,
    currency: "USD",
    neighborhood: "Eixample",
    city: "Barcelona",
    address: "Carrer de Còrsega 350",
    lat: 41.3969,
    lng: 2.1583,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 130,
    photo: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800",
    agent: agents[1],
    favoriteCount: 264,
    createdDaysAgo: -5,
    updatedDaysAgo: -1,
    availabilityDays: [1, 3, 5],
  },
  {
    id: "p18",
    code: "PG-0251",
    title: "Casa Minimalista de Diseño",
    operation: "venta",
    type: "chalet",
    price: 2350000,
    currency: "USD",
    neighborhood: "Sarrià",
    city: "Barcelona",
    address: "Carrer de Bertran 60",
    lat: 41.4029,
    lng: 2.1289,
    bedrooms: 4,
    bathrooms: 4,
    superficieCubierta: 290,
    photo: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800",
    agent: agents[2],
    favoriteCount: 512,
    createdDaysAgo: -22,
    updatedDaysAgo: -4,
    availabilityDays: [0, 2],
  },
  {
    id: "p19",
    code: "PG-0252",
    title: "Monoambiente Ideal Inversión",
    operation: "alquiler",
    type: "estudio",
    price: 700,
    currency: "USD",
    neighborhood: "El Raval",
    city: "Barcelona",
    address: "Carrer de la Riera Baixa 10",
    lat: 41.3803,
    lng: 2.1698,
    bedrooms: 1,
    bathrooms: 1,
    superficieCubierta: 38,
    photo: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800",
    agent: agents[0],
    favoriteCount: 88,
    createdDaysAgo: -2,
    updatedDaysAgo: -2,
    availabilityDays: [2],
  },
  {
    id: "p20",
    code: "PG-0253",
    title: "Ático Dúplex con Solárium",
    operation: "venta",
    type: "atico",
    price: 1340000,
    currency: "USD",
    neighborhood: "Gràcia",
    city: "Barcelona",
    address: "Carrer de Torrent de l'Olla 150",
    lat: 41.4041,
    lng: 2.1557,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 145,
    photo: "https://images.unsplash.com/photo-1499955085172-a104c9463ece?w=800",
    agent: agents[1],
    favoriteCount: 347,
    createdDaysAgo: -1,
    updatedDaysAgo: 0,
    availabilityDays: [0, 1, 3],
  },
  {
    id: "p21",
    code: "PG-0254",
    title: "Casa de Campo Restaurada",
    operation: "venta",
    type: "finca_rustica",
    price: 780000,
    currency: "USD",
    neighborhood: "Vallvidrera",
    city: "Barcelona",
    address: "Carretera de Vallvidrera 40",
    lat: 41.4142,
    lng: 2.1042,
    bedrooms: 4,
    bathrooms: 3,
    superficieCubierta: 220,
    photo: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800",
    agent: agents[2],
    favoriteCount: 229,
    createdDaysAgo: -9,
    updatedDaysAgo: -2,
    availabilityDays: [3],
  },
  {
    id: "p22",
    code: "PG-0255",
    title: "Departamento Premium con Cochera",
    operation: "alquiler",
    type: "departamento",
    price: 1900,
    currency: "USD",
    neighborhood: "Sant Gervasi",
    city: "Barcelona",
    address: "Carrer de Balmes 350",
    lat: 41.4046,
    lng: 2.1466,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 125,
    photo: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    agent: agents[0],
    favoriteCount: 198,
    createdDaysAgo: -3,
    updatedDaysAgo: -1,
    availabilityDays: [1, 2, 4],
  },
  {
    id: "p23",
    code: "PG-0256",
    title: "PH con Terraza y Parrilla",
    operation: "venta",
    type: "ph",
    price: 465000,
    currency: "USD",
    neighborhood: "Poble Sec",
    city: "Barcelona",
    address: "Carrer de Vila i Vilà 70",
    lat: 41.3733,
    lng: 2.1652,
    bedrooms: 2,
    bathrooms: 2,
    superficieCubierta: 90,
    photo: "https://images.unsplash.com/photo-1493809842364-3fa5124d3cf3?w=800",
    agent: agents[1],
    favoriteCount: 244,
    createdDaysAgo: -1,
    updatedDaysAgo: -1,
    availabilityDays: [0, 2],
  },
  {
    id: "p24",
    code: "PG-0257",
    title: "Local a Estrenar en Avenida Comercial",
    operation: "venta",
    type: "local",
    price: 590000,
    currency: "USD",
    neighborhood: "Eixample",
    city: "Barcelona",
    address: "Gran Via de les Corts Catalanes 500",
    lat: 41.3874,
    lng: 2.1462,
    bedrooms: 0,
    bathrooms: 1,
    superficieCubierta: 110,
    photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    agent: agents[2],
    favoriteCount: 61,
    createdDaysAgo: -14,
    updatedDaysAgo: -5,
    availabilityDays: [4],
  },
  // Catálogo de agt-4 (María Rodríguez) para el panel de agente
  // (`dashboard-home`) — geografía Buenos Aires (Palermo/San Telmo),
  // heredada literal del frame real aunque el resto del mock de
  // comprador esté ambientado en Barcelona; ver TRACKING.md.
  {
    id: "p25",
    code: "PG-0301",
    title: "Departamento con Vista al Parque",
    operation: "venta",
    type: "departamento",
    price: 450000,
    currency: "USD",
    neighborhood: "Palermo",
    city: "CABA",
    address: "Av. del Libertador 2400",
    lat: -34.5748,
    lng: -58.4174,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 140,
    photo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    agent: agents[3],
    favoriteCount: 128,
    createdDaysAgo: -25,
    // Exactamente 20 días sin actualizar — a propósito, para que
    // `getListingStatus()` (ver `lib/property-status.ts`) la muestre como
    // "Pendiente de confirmación" de verdad (frames reales
    // `propiedades-table-view` / `confirm-listing-modal`), no como
    // "publicada"/EN VENTA que mostraba antes en el Catálogo Activo del
    // Dashboard Home — ver TRACKING.md, es un cambio intencional sobre
    // una pantalla ya construida, no una regresión.
    updatedDaysAgo: -20,
    availabilityDays: [0, 1, 2],
    status: "publicada",
  },
  {
    id: "p26",
    code: "PG-0302",
    title: "Monoambiente Luminoso a Reciclar",
    operation: "venta",
    type: "departamento",
    price: 120000,
    currency: "USD",
    neighborhood: "Palermo",
    city: "CABA",
    address: "Gorriti 1200, 4° B",
    lat: -34.5875,
    lng: -58.4298,
    bedrooms: 1,
    bathrooms: 1,
    superficieCubierta: 45,
    photo: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    agent: agents[3],
    favoriteCount: 12,
    createdDaysAgo: -3,
    updatedDaysAgo: -3,
    availabilityDays: [],
    status: "borrador",
  },
  {
    id: "p27",
    code: "PG-0303",
    title: "Penthouse con Vistas Panorámicas",
    operation: "venta",
    type: "atico",
    price: 890000,
    currency: "USD",
    neighborhood: "Palermo",
    city: "CABA",
    address: "Soler 4500, Penthouse",
    lat: -34.5802,
    lng: -58.4243,
    bedrooms: 4,
    bathrooms: 3,
    superficieCubierta: 220,
    photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    agent: agents[3],
    favoriteCount: 301,
    createdDaysAgo: -60,
    updatedDaysAgo: -22,
    availabilityDays: [1],
    // `vencida` seteado a mano — es un estado terminal/manual, NO atado
    // al timer de 20 días de `getListingStatus()` (ese es
    // `pendiente_confirmacion` → `pausada`, ver `lib/property-status.ts`
    // y p25/p31 en este mismo archivo). Antes de agregar esa regla
    // derivada el comentario acá decía "+20 días sin confirmar vigencia",
    // pero eso describe mejor a `pendiente_confirmacion` — se corrige
    // para no mezclar los dos conceptos.
    status: "vencida",
  },
  {
    id: "p28",
    code: "PG-0304",
    title: "Departamento a Reciclar en Palermo",
    operation: "venta",
    type: "departamento",
    price: 310000,
    currency: "USD",
    neighborhood: "Palermo",
    city: "CABA",
    address: "Humboldt 1900",
    lat: -34.5827,
    lng: -58.4361,
    bedrooms: 2,
    bathrooms: 1,
    superficieCubierta: 95,
    // sin foto todavía — dispara la alerta "Propiedad sin imágenes"
    agent: agents[3],
    favoriteCount: 4,
    createdDaysAgo: -2,
    updatedDaysAgo: -2,
    availabilityDays: [0],
    // Corregido de "publicada" a "borrador" (frame real
    // `propiedades-table-view`, fila "Humboldt 1900" → pill gris
    // "BORRADOR", igual que "Gorriti 1200") — tiene más sentido además:
    // una propiedad sin fotos todavía no debería poder estar publicada
    // de verdad. No afecta el Catálogo Activo del Dashboard Home (nunca
    // mostró p28) ni la alerta "Propiedad sin imágenes" (es por falta de
    // fotos, no depende del status).
    status: "borrador",
  },
  {
    id: "p29",
    code: "PG-0305",
    title: "PH a Estrenar con Patio",
    operation: "venta",
    type: "ph",
    price: 265000,
    currency: "USD",
    neighborhood: "San Telmo",
    city: "CABA",
    address: "Defensa 900",
    lat: -34.6212,
    lng: -58.3731,
    bedrooms: 2,
    bathrooms: 1,
    superficieCubierta: 80,
    photo: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    agent: agents[3],
    favoriteCount: 67,
    createdDaysAgo: -10,
    updatedDaysAgo: -1,
    availabilityDays: [0, 1],
    status: "publicada",
  },
  // p30-p33: resto del catálogo de agt-4 para completar las 8 filas de
  // la primera página de "Propiedades" (frame real
  // `propiedades-table-view`) — p25/p26/p27/p28 ya cubrían las primeras
  // 4 filas, estas 4 son nuevas.
  {
    id: "p30",
    code: "PG-0306",
    title: "Departamento con Balcón Terraza",
    operation: "venta",
    type: "departamento",
    price: 385000,
    currency: "USD",
    neighborhood: "Recoleta",
    city: "CABA",
    address: "Av. Santa Fe 4400, 3° amb",
    lat: -34.5895,
    lng: -58.4021,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 130,
    photo: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800",
    agent: agents[3],
    favoriteCount: 54,
    createdDaysAgo: -35,
    // Igual que p25: exactamente en el umbral de 20 días para que
    // `getListingStatus()` la muestre como "Pendiente de confirmación"
    // de verdad (2ª fila con este estado en el frame real).
    updatedDaysAgo: -20,
    availabilityDays: [1, 2],
    status: "publicada",
  },
  {
    id: "p31",
    code: "PG-0307",
    title: "Casa con Patio en Belgrano",
    operation: "venta",
    type: "casa",
    price: 520000,
    currency: "USD",
    neighborhood: "Belgrano",
    city: "CABA",
    address: "Juramento 1500",
    lat: -34.5623,
    lng: -58.4567,
    bedrooms: 3,
    bathrooms: 2,
    superficieCubierta: 180,
    photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    agent: agents[3],
    favoriteCount: 33,
    createdDaysAgo: -50,
    // Más allá del umbral + el período de gracia (`PAUSE_GRACE_DAYS` en
    // `lib/property-status.ts`) — `getListingStatus()` la muestra
    // "Pausada" de verdad, sin necesidad de setear `status: "pausada"`
    // a mano (queda como demostración de que la propiedad se pausa SOLA
    // si el agente nunca responde al aviso de los 20 días).
    updatedDaysAgo: -30,
    availabilityDays: [],
    status: "publicada",
  },
  {
    id: "p32",
    code: "PG-0308",
    title: "Departamento Luminoso a Estrenar",
    operation: "venta",
    type: "departamento",
    price: 410000,
    currency: "USD",
    neighborhood: "Recoleta",
    city: "CABA",
    address: "Av. Callao 1000",
    lat: -34.5958,
    lng: -58.3927,
    bedrooms: 2,
    bathrooms: 2,
    superficieCubierta: 92,
    photo: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    agent: agents[3],
    favoriteCount: 89,
    createdDaysAgo: -4,
    updatedDaysAgo: -2,
    availabilityDays: [0, 2],
    status: "publicada",
  },
  {
    id: "p33",
    code: "PG-0309",
    title: "Local Comercial a la Calle",
    operation: "venta",
    type: "local",
    price: 275000,
    currency: "USD",
    neighborhood: "Belgrano",
    city: "CABA",
    address: "Cabildo 2000, Local 3",
    lat: -34.5615,
    lng: -58.4562,
    bedrooms: 0,
    bathrooms: 1,
    superficieCubierta: 60,
    photo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    agent: agents[3],
    favoriteCount: 8,
    createdDaysAgo: -40,
    updatedDaysAgo: -18,
    availabilityDays: [],
    // `vencida` explícito (mismo criterio que p27) — no atado al timer
    // de 20 días.
    status: "vencida",
  },
  {
    // Agregada para Agenda (frame `agent-agenda-screen`) — la visita de
    // Laura Gómez del jueves referencia "Loft Núñez", un barrio/tipo que
    // no existía todavía entre p25-p33. En vez de reusar una propiedad
    // de otro barrio bajo un nombre corto que no le corresponde, se
    // agregó esta propiedad nueva para que la referencia sea honesta.
    id: "p34",
    code: "PG-0310",
    title: "Loft a Nuevo en Núñez",
    operation: "venta",
    type: "departamento",
    price: 195000,
    currency: "USD",
    neighborhood: "Núñez",
    city: "CABA",
    address: "Ávalos 2200",
    lat: -34.5461,
    lng: -58.4623,
    bedrooms: 1,
    bathrooms: 1,
    superficieCubierta: 48,
    photo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    agent: agents[3],
    favoriteCount: 19,
    createdDaysAgo: -8,
    updatedDaysAgo: -6,
    availabilityDays: [3, 4],
    status: "publicada",
  },
];

function toProperty(bp: Blueprint, index: number): Property {
  return {
    id: bp.id,
    code: bp.code,
    title: bp.title,
    operation: bp.operation,
    type: bp.type,
    price: bp.price,
    currency: bp.currency,
    location: {
      address: bp.address,
      neighborhood: bp.neighborhood,
      city: bp.city,
      lat: bp.lat,
      lng: bp.lng,
    },
    bedrooms: bp.bedrooms,
    bathrooms: bp.bathrooms,
    characteristics: {
      antiguedad: index % 4 === 0 ? "a_estrenar" : index % 4 === 1 ? "1_5" : index % 4 === 2 ? "6_15" : "16_30",
      orientacion: index % 2 === 0 ? ["norte"] : ["sur", "oeste"],
      piso: bp.type === "casa" ? undefined : (index % 15) + 1,
      totalPisos: bp.type === "casa" ? undefined : (index % 15) + 3,
      ascensor: bp.type !== "casa",
      expensas: bp.type === "casa" ? undefined : 60 + (index % 8) * 30,
      disposicion: index % 3 === 0 ? "frente" : index % 3 === 1 ? "contrafrente" : "interno",
      cochera: index % 3 === 0 ? "incluida" : index % 3 === 1 ? "opcional" : "no_tiene",
      superficieCubierta: bp.superficieCubierta,
      superficieDescubierta: bp.type === "casa" ? Math.round(bp.superficieCubierta * 0.3) : undefined,
      estadoConservacion:
        index % 4 === 0 ? "a_estrenar" : index % 4 === 1 ? "muy_bueno" : index % 4 === 2 ? "bueno" : "a_refaccionar",
    },
    financing: {
      aptoCreditoBancario: index % 2 === 0,
      bancosParticipantes: index % 2 === 0 ? ["Banco Nación", "Santander"] : undefined,
      esDesarrollo: !!bp.esDesarrollo,
      anticipoPorcentaje: bp.esDesarrollo ? 30 : undefined,
      cuotas: bp.esDesarrollo ? 36 : undefined,
      plazoEntrega: bp.esDesarrollo ? "Dic 2027" : undefined,
      ajusteCuotas: bp.esDesarrollo ? "fijo_usd" : undefined,
    },
    // "ESTADO DE VIDA" del panel de Filtros avanzados — sin backend
    // todavía, así que se derivan de forma determinística (índice + tipo/
    // barrio) en vez de random, para que los resultados sean estables
    // entre renders.
    amenities: {
      petFriendly: index % 3 !== 0,
      balcon: bp.type !== "local" && bp.type !== "oficina" && index % 2 === 0,
      piscina:
        (bp.type === "casa" || bp.type === "chalet" || bp.type === "finca_rustica") &&
        index % 2 === 0,
      vistaAlMar: ["Barceloneta", "Diagonal Mar"].includes(bp.neighborhood) || index % 6 === 0,
      cercaDeParques: index % 4 !== 3,
      cercaDeMetro: bp.type !== "finca_rustica" && index % 3 !== 2,
    },
    photos: bp.photo ? [bp.photo] : [],
    status: bp.status ?? "publicada",
    agent: bp.agent,
    favoriteCount: bp.favoriteCount,
    availability: bp.availabilityDays.map((d, i) => ({
      date: iso(d),
      time: ["10:00", "11:30", "15:00", "17:00", "18:30"][i % 5],
      isFeatured: i === 0 && bp.favoriteCount > 400,
    })),
    lastUpdatedAt: iso(bp.updatedDaysAgo),
    createdAt: iso(bp.createdDaysAgo),
  };
}

export const mockProperties: Property[] = blueprints.map(toProperty);

export const mockPropertyById = new Map(mockProperties.map((p) => [p.id, p]));

// --- Agrupaciones para Discovery (spec §3.3) -------------------------------
// "Destacadas": mayor favoriteCount. "Recién publicadas": createdAt más
// reciente. "Cerca de tu última búsqueda": simula personalización tomando
// un barrio de referencia (Eixample) + alrededores — hasta que exista
// backend/búsqueda real, es una selección fija representativa. Se agregan
// dos secciones extra ("Ideal para invertir" / "Con financiamiento
// propio") que solo se revelan detrás del botón "Ver más propiedades",
// para poder demostrar la paginación explícita que pide la spec (auto-
// carga las primeras 3 secciones, después botón).
//
// Reciben `properties` como parámetro (en vez de ser un valor fijo) para
// que Discovery pueda recalcularlas sobre el subconjunto ya filtrado por
// los chips/búsqueda — así una combinación de filtros muy restrictiva
// puede efectivamente vaciar todas las secciones y disparar el estado
// vacío (spec §3.3).

const nearbyNeighborhoods = new Set([
  "Eixample",
  "Gràcia",
  "El Born",
  "El Raval",
  "Sant Antoni",
  "Poble Sec",
]);

export interface DiscoverySection {
  id: string;
  title: string;
  subtitle: string;
  properties: Property[];
}

export function buildDiscoverySections(properties: Property[]): DiscoverySection[] {
  const byFavorites = [...properties].sort((a, b) => b.favoriteCount - a.favoriteCount);
  const byRecency = [...properties].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const byNearby = properties.filter((p) => nearbyNeighborhoods.has(p.location.neighborhood));
  const byPriceAsc = [...properties].sort((a, b) => a.price - b.price);
  const developments = properties.filter((p) => p.financing.esDesarrollo);

  const sections: DiscoverySection[] = [
    {
      id: "destacadas",
      title: "Propiedades destacadas en Barcelona",
      subtitle: "Selección curada por nuestro equipo",
      properties: byFavorites.slice(0, 8),
    },
    {
      id: "recientes",
      title: "Recién publicadas",
      subtitle: "Últimas 24 horas",
      properties: byRecency.slice(0, 8),
    },
    {
      id: "cerca-de-tu-busqueda",
      title: "Cerca de tu última búsqueda",
      subtitle: "Basado en Paseo de Gracia, Barcelona",
      properties: byNearby.slice(0, 8),
    },
    {
      id: "ideal-invertir",
      title: "Ideal para invertir",
      subtitle: "Las opciones más accesibles del momento",
      properties: byPriceAsc.slice(0, 8),
    },
    {
      id: "financiamiento-propio",
      title: "Con financiamiento propio",
      subtitle: "Desarrollos con planes de pago directos del desarrollador",
      properties: developments.slice(0, 8),
    },
  ];

  return sections.filter((s) => s.properties.length > 0);
}

// Tarjetas interstitial (formato 21:9, badge "DESTACADO") insertadas entre
// secciones — máx. 1 cada 2 secciones, spec §3.3.
export function pickInterstitials(properties: Property[]): Property[] {
  const byFavorites = [...properties].sort((a, b) => b.favoriteCount - a.favoriteCount);
  return [byFavorites[0], byFavorites[2], byFavorites[4]].filter(Boolean) as Property[];
}

/**
 * "También te puede interesar" del Quick Look modal (frame
 * `desktop-discovery-default-cards + account-dropdown-menu`) — mismo
 * barrio primero, después mismo tipo, excluyendo la propiedad actual.
 * Sin backend todavía, así que sale de `mockProperties` completo (no del
 * subconjunto filtrado de Discovery) para tener siempre resultados.
 */
export function relatedProperties(property: Property, limit = 5): Property[] {
  const sameNeighborhood = mockProperties.filter(
    (p) => p.id !== property.id && p.location.neighborhood === property.location.neighborhood
  );
  const sameType = mockProperties.filter(
    (p) => p.id !== property.id && p.type === property.type && p.location.neighborhood !== property.location.neighborhood
  );
  return [...sameNeighborhood, ...sameType].slice(0, limit);
}

/**
 * "Mis Visitas" del Header comprador (frame `desktop-discovery-default-
 * cards + panel-mis-visitas`) — sin backend todavía, así que arranca de
 * un set fijo de `VisitRequest` mock en vez de derivarse de acciones
 * reales de "Solicitar Visita" en `PropertyCard` (esas hoy solo hacen
 * `console.log`, ver TODO en `DiscoveryClient.requestVisit`). El panel
 * mismo mantiene su propia copia mutable en memoria (useState) para que
 * confirmar/reagendar/cancelar se sienta real dentro de la sesión.
 */
export const mockVisitRequests: VisitRequest[] = [
  {
    id: "vr-1",
    propertyId: "p1",
    buyerName: "Camila Ríos",
    buyerPhone: "+34 600 111 222",
    requestedAt: iso(-2),
    slot: { date: iso(1), time: "17:30" },
    status: "aceptada",
    respondedAt: iso(-1),
    originChannel: "app",
  },
  {
    id: "vr-2",
    propertyId: "p8",
    buyerName: "Camila Ríos",
    buyerPhone: "+34 600 111 222",
    requestedAt: iso(-1),
    slot: { date: iso(3), time: "11:30" },
    status: "aceptada",
    respondedAt: iso(0),
    originChannel: "app",
  },
  {
    id: "vr-3",
    propertyId: "p13",
    buyerName: "Camila Ríos",
    buyerPhone: "+34 600 111 222",
    requestedAt: iso(0),
    slot: { date: iso(2), time: "18:30" },
    status: "pendiente",
    originChannel: "app",
  },
  {
    id: "vr-4",
    propertyId: "p18",
    buyerName: "Camila Ríos",
    buyerPhone: "+34 600 111 222",
    requestedAt: iso(0),
    slot: { date: iso(4), time: "10:00" },
    status: "pendiente",
    originChannel: "app",
  },
  {
    id: "vr-5",
    propertyId: "p3",
    buyerName: "Camila Ríos",
    buyerPhone: "+34 600 111 222",
    requestedAt: iso(-6),
    slot: { date: iso(-3), time: "15:00" },
    status: "cancelada",
    respondedAt: iso(-5),
    originChannel: "app",
  },
];

/**
 * Dashboard Home del panel de agente (frame real `dashboard-home`) —
 * separado de `mockVisitRequests` (que es del lado comprador, ligado a
 * "Camila Ríos") porque acá el punto de vista es el inverso: visitas que
 * agt-4 (María Rodríguez) recibió sobre SU catálogo (p25-p29). Las
 * primeras 4 son las que arma el "Timeline del Día"; `avr-5` (Pedro
 * Muñoz) es la que está por vencer en "Atención Requerida" — no aparece
 * en el Timeline, tampoco aparecía ahí en el frame real.
 */
export const mockAgentTodayVisits: VisitRequest[] = [
  {
    id: "avr-1",
    propertyId: "p25",
    buyerName: "Carlos Martínez",
    buyerPhone: "+54 9 11 5555-0101",
    requestedAt: iso(-1),
    slot: { date: iso(0), time: "10:00" },
    status: "aceptada",
    respondedAt: iso(-1),
    originChannel: "app",
  },
  {
    id: "avr-2",
    propertyId: "p26",
    buyerName: "Gastón Pérez",
    buyerPhone: "+54 9 11 5555-0102",
    requestedAt: iso(0),
    slot: { date: iso(0), time: "11:30" },
    status: "pendiente",
    originChannel: "app",
  },
  {
    id: "avr-3",
    propertyId: "p27",
    buyerName: "Sofía Loren",
    buyerPhone: "+54 9 11 5555-0103",
    requestedAt: iso(-1),
    slot: { date: iso(0), time: "15:30" },
    status: "aceptada",
    respondedAt: iso(-1),
    originChannel: "app",
  },
  {
    id: "avr-4",
    propertyId: "p28",
    buyerName: "Pedro Gómez",
    buyerPhone: "+54 9 11 5555-0104",
    requestedAt: iso(-1),
    slot: { date: iso(0), time: "17:00" },
    status: "cancelada",
    respondedAt: iso(0),
    originChannel: "app",
  },
  // Visita "a punto de vencer" de la alerta — el timer real de 2hs (spec
  // §5.1) no está implementado todavía (ver TRACKING.md, backend
  // pendiente), así que el "vence en 18 minutos" de la alerta es texto
  // fijo, no calculado a partir de `requestedAt`.
  {
    id: "avr-5",
    propertyId: "p29",
    buyerName: "Pedro Muñoz",
    buyerPhone: "+54 9 11 5555-0105",
    requestedAt: iso(0),
    slot: { date: iso(0), time: "19:00" },
    status: "pendiente",
    originChannel: "app",
  },
];

export const mockAgentAttentionItems: AgentAttentionItem[] = [
  {
    id: "att-1",
    severity: "critico",
    icon: "reloj",
    title: "1 Visita a punto de vencer",
    body: "La solicitud de Pedro Muñoz para PH San Telmo vence en 18 minutos.",
    ctaLabel: "Responder ahora",
  },
  {
    id: "att-2",
    severity: "critico",
    icon: "publicaciones",
    title: "3 Publicaciones necesitan confirmar",
    body: "3 propiedades llevan +20 días publicadas sin confirmar vigencia.",
    ctaLabel: "Confirmar vigencia",
  },
  {
    id: "att-3",
    severity: "atencion",
    icon: "visita",
    title: "1 Visita sin confirmar",
    body: "Gastón Pérez solicitó visitar Gorriti 1200 para las 15:30 hs.",
    ctaLabel: "Gestionar",
  },
  {
    id: "att-4",
    severity: "info",
    icon: "fotos",
    title: "Propiedad sin imágenes",
    body: "Humboldt 1900 fue creada pero no cuenta con fotografías.",
    ctaLabel: "Subir",
  },
];

/**
 * Stats del Dashboard Home que no se pueden derivar 100% de otros mocks
 * sin construir todavía un Pipeline de leads completo (ver TRACKING.md,
 * "Panel de agente — pendiente") — se dejan como constantes ilustrativas
 * a propósito, mismo criterio que el resto del prototipo para números
 * que necesitarían backend real. `tasaRespuesta` sí se deriva de verdad
 * (`agt-4.responseRateWithin2h`), no es una constante suelta.
 */
export const mockAgentDashboardStats = {
  propiedadesActivas: 12,
  visitasDelMes: 28,
  visitasConfirmadas: 18,
  visitasPendientes: 7,
  visitasCanceladas: 3,
  leadsActivos: 15,
  leadsNuevos: 3,
};

/**
 * Métricas por fila de "Propiedades" (frame real `propiedades-table-view`,
 * columnas VISITAS/LEADS) — constantes ilustrativas, mismo criterio que
 * `mockTeamStats` (no hay backend de analítica por propiedad todavía).
 */
export const mockPropertyPerformance: Record<string, { visitas: number; leads: number }> = {
  p25: { visitas: 12, leads: 4 },
  p26: { visitas: 3, leads: 1 },
  p27: { visitas: 45, leads: 6 },
  p28: { visitas: 2, leads: 0 },
  p29: { visitas: 9, leads: 2 },
  p30: { visitas: 18, leads: 3 },
  p31: { visitas: 5, leads: 1 },
  p32: { visitas: 27, leads: 5 },
  p33: { visitas: 10, leads: 0 },
};

/** Sentinel de `Lead.assignedAgentId` para leads que todavía no tienen
 * agente asignado — usado por el banner amarillo "Tenés N leads sin
 * asignar" de la pantalla "Equipo" (frame real `equipo-team`). No se
 * modeló como campo opcional en `Lead` para no tener que chequear
 * `undefined` en todos los otros lugares que ya asumen que todo lead
 * tiene agente (ej. "Pipeline de Leads", que solo lista los de agt-4). */
export const UNASSIGNED_AGENT_ID = "sin-asignar";

/**
 * Pipeline de Leads del panel de agente (frame real `pipeline-kanban`) —
 * los 6 estados mapean directo a `LeadStage`; el frame solo muestra una
 * columna "Cerrado" (no separa ganado/perdido), así que se usa
 * `cerrado_ganado` para todos los leads cerrados de este mock — no hay
 * ningún lead en `cerrado_perdido` todavía (columna igual soportada por
 * el board, simplemente vacía).
 *
 * "Hace X" en las tarjetas se calcula en la UI a partir de
 * `lastActivityAt` (día completo, no hay granularidad de horas en el
 * mock — mismo criterio que `createdAt`/`lastUpdatedAt` del resto del
 * archivo), así que no se guarda el texto "hace 2 horas" del frame tal
 * cual, se aproxima a "Hoy".
 *
 * Los 2 últimos (`lead-8`, `lead-9`) NO tienen agente asignado
 * (`UNASSIGNED_AGENT_ID`) — no aparecen en este Pipeline (que es la
 * cartera de agt-4), solo alimentan el contador real de "leads sin
 * asignar" de la pantalla "Equipo".
 */
export const mockLeads: Lead[] = [
  {
    id: "lead-1",
    buyerName: "Facundo Díaz",
    buyerPhone: "+54 9 11 5555-0201",
    propertyId: "p25",
    stage: "nuevo_lead",
    lastActivityAt: iso(0),
    highIntent: true,
    assignedAgentId: "agt-4",
  },
  {
    id: "lead-2",
    buyerName: "Lucía Fernández",
    buyerPhone: "+54 9 11 5555-0202",
    propertyId: "p28",
    stage: "nuevo_lead",
    lastActivityAt: iso(-1),
    assignedAgentId: "agt-4",
  },
  {
    id: "lead-3",
    buyerName: "Javier Ortega",
    buyerPhone: "+54 9 11 5555-0203",
    propertyId: "p26",
    stage: "contactado",
    lastActivityAt: iso(-3),
    assignedAgentId: "agt-4",
  },
  {
    id: "lead-4",
    buyerName: "Gastón Martínez",
    buyerPhone: "+54 9 11 5555-0204",
    propertyId: "p27",
    stage: "visita_agendada",
    lastActivityAt: iso(-1),
    highIntent: true,
    assignedAgentId: "agt-4",
  },
  {
    id: "lead-5",
    buyerName: "Esteban Rossi",
    buyerPhone: "+54 9 11 5555-0205",
    propertyId: "p29",
    stage: "visita_realizada",
    lastActivityAt: iso(-4),
    assignedAgentId: "agt-4",
  },
  {
    id: "lead-6",
    buyerName: "Agustina Cortez",
    buyerPhone: "+54 9 11 5555-0206",
    propertyId: "p26",
    stage: "negociacion",
    lastActivityAt: iso(-2),
    highIntent: true,
    assignedAgentId: "agt-4",
  },
  {
    id: "lead-7",
    buyerName: "Nerea Silva",
    buyerPhone: "+54 9 11 5555-0207",
    propertyId: "p27",
    stage: "cerrado_ganado",
    lastActivityAt: iso(-6),
    assignedAgentId: "agt-4",
  },
  {
    id: "lead-8",
    buyerName: "Martina Suárez",
    buyerPhone: "+54 9 11 5555-0208",
    propertyId: "p25",
    stage: "nuevo_lead",
    lastActivityAt: iso(0),
    assignedAgentId: UNASSIGNED_AGENT_ID,
  },
  {
    id: "lead-9",
    buyerName: "Diego Ramos",
    buyerPhone: "+54 9 11 5555-0209",
    propertyId: "p29",
    stage: "nuevo_lead",
    lastActivityAt: iso(-1),
    assignedAgentId: UNASSIGNED_AGENT_ID,
  },
];

/**
 * Visitas de la semana para Agenda (frame `agent-agenda-screen`) —
 * separado de `mockAgentTodayVisits` (que es sólo el Timeline del Día
 * del Dashboard Home, acotado a "hoy"). Acá se necesita una semana
 * completa para poblar el calendario Lun–Dom.
 *
 * El frame real etiquetaba las columnas "LUN 11 … DOM 17", pero esas
 * fechas no corresponden a ningún año real (11 ago no cae lunes en
 * 2026 ni en ningún año cercano) — es una semana de ejemplo del diseño,
 * no una fecha fija. Para que Agenda funcione de verdad en cualquier
 * momento (mismo criterio que el resto del mock: `iso(offset)` relativo
 * a "hoy"), se reprodujo la MISMA estructura relativa al día actual: la
 * columna "hoy" del frame es un jueves, y casualmente hoy también cae
 * jueves — así que el mapeo es Lun=-3, Mar=-2, Mié=-1, Jue=0 (hoy),
 * Vie=+1, Sáb=+2, Dom=+3. Si se corre este prototipo otro día de la
 * semana, la etiqueta "Hoy" del calendario simplemente cae en otra
 * columna, pero la distribución Lun→Dom de las visitas se mantiene.
 *
 * Teléfonos de Ana García y Pedro Muñoz copiados tal cual del frame
 * "Flujo de Resolución de Conflictos" (son los únicos dos legibles con
 * certeza en las referencias) — el resto de los teléfonos de esta lista
 * son inventados, mismo criterio que el resto del mock.
 */
export const mockAgentWeekVisits: VisitRequest[] = [
  {
    id: "avw-1",
    propertyId: "p25",
    buyerName: "María López",
    buyerPhone: "+54 9 11 5555-0301",
    requestedAt: iso(-4),
    slot: { date: iso(-3), time: "10:00", durationMinutes: 45 },
    status: "aceptada",
    respondedAt: iso(-4),
    originChannel: "app",
  },
  {
    id: "avw-2",
    propertyId: "p31",
    buyerName: "Juan Pérez",
    buyerPhone: "+54 9 11 5555-0302",
    requestedAt: iso(-3),
    slot: { date: iso(-3), time: "15:00", durationMinutes: 30 },
    status: "pendiente",
    originChannel: "app",
  },
  {
    id: "avw-3",
    propertyId: "p29",
    buyerName: "Ana García",
    buyerPhone: "+54 11 4444-5678",
    requestedAt: iso(-3),
    slot: { date: iso(-2), time: "09:00", durationMinutes: 45 },
    status: "aceptada",
    respondedAt: iso(-3),
    originChannel: "app",
  },
  {
    id: "avw-4",
    propertyId: "p32",
    buyerName: "Carlos Ruiz",
    buyerPhone: "+54 9 11 5555-0303",
    requestedAt: iso(-2),
    slot: { date: iso(-2), time: "11:00", durationMinutes: 30 },
    status: "pendiente",
    originChannel: "app",
  },
  {
    id: "avw-5",
    propertyId: "p31",
    buyerName: "Sofía Martín",
    buyerPhone: "+54 9 11 5555-0304",
    requestedAt: iso(-2),
    slot: { date: iso(-1), time: "14:00", durationMinutes: 45 },
    status: "cancelada",
    respondedAt: iso(-1),
    originChannel: "app",
  },
  {
    id: "avw-6",
    propertyId: "p34",
    buyerName: "Laura Gómez",
    buyerPhone: "+54 9 11 5555-0305",
    requestedAt: iso(0),
    slot: { date: iso(0), time: "16:00", durationMinutes: 30 },
    status: "pendiente",
    originChannel: "app",
  },
  // Las dos siguientes son el conflicto del frame "Flujo de Resolución de
  // Conflictos" — mismo día, mismo horario, misma propiedad. Ver
  // `lib/agenda.ts::findConflictGroups()`.
  {
    id: "avw-7",
    propertyId: "p29",
    buyerName: "Ana García",
    buyerPhone: "+54 11 4444-5678",
    requestedAt: iso(0),
    slot: { date: iso(1), time: "09:00", durationMinutes: 45 },
    status: "pendiente",
    originChannel: "app",
  },
  {
    id: "avw-8",
    propertyId: "p29",
    buyerName: "Pedro Muñoz",
    buyerPhone: "+54 11 3333-9012",
    requestedAt: iso(0),
    slot: { date: iso(1), time: "09:00", durationMinutes: 45 },
    status: "pendiente",
    originChannel: "app",
  },
];

/**
 * Horario bloqueado a mano por el agente (frame `agent-agenda-screen`,
 * bloque "No disponible" del jueves) — semilla inicial; los que arma el
 * usuario con el botón "Bloquear horario" se agregan en memoria del lado
 * del componente (`AgentAgenda.tsx`), no acá.
 */
export const mockAgentBlockedSlots: BlockedSlot[] = [
  {
    id: "blk-1",
    date: iso(0),
    startTime: "13:00",
    endTime: "14:00",
    reason: "No disponible",
  },
];
