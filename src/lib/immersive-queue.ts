import type { Property } from "@/types";

/**
 * Cola de similares del Feed inmersivo (spec §3.6): "estilo Netflix (mismo
 * área, precio, tipo — no el orden crudo del grid), generada dinámicamente
 * al entrar". Funciones puras, mismo espíritu que `agenda.ts` /
 * `property-status.ts`.
 *
 * La cola NO es una lista fija armada de entrada: arranca con la propiedad
 * elegida y se va extendiendo a medida que la persona avanza, siempre a
 * partir de la ÚLTIMA propiedad vista (si pasaste de un depto en Gràcia a
 * un ático en Eixample, lo que sigue se parece al ático). Cuando el pool se
 * agota, vuelve a meter las vistas hace más tiempo ("loop interno", spec
 * §6) en vez de cortar el feed.
 */

export interface QueueItem {
  property: Property;
  /** Por qué entró a la cola — se muestra como pill ("Mismo barrio"). Sin
   * valor en la primera (la que eligió la persona) y en las recicladas. */
  reason?: string;
}

/** Cuántas sugerencias nuevas se agregan cada vez que la cola se acorta. */
export const QUEUE_BATCH = 4;

function priceCloseness(a: Property, b: Property) {
  // Solo comparable dentro de la misma moneda y operación (un alquiler
  // mensual en EUR contra una venta en USD no dice nada).
  if (a.currency !== b.currency || a.operation !== b.operation) return 0;
  const ratio = Math.min(a.price, b.price) / Math.max(a.price, b.price);
  return ratio; // 1 = mismo precio, → 0 cuanto más lejos
}

/**
 * Puntaje de similitud. Pesos elegidos a mano (no hay datos de uso para
 * aprenderlos): misma operación es casi obligatorio (quien busca alquilar
 * no quiere ver ventas), después barrio, tipo y precio.
 */
export function similarityScore(base: Property, candidate: Property) {
  let score = 0;
  if (candidate.operation === base.operation) score += 4;
  if (candidate.location.neighborhood === base.location.neighborhood) score += 3;
  else if (candidate.location.city === base.location.city) score += 1;
  if (candidate.type === base.type) score += 2;
  score += 2 * priceCloseness(base, candidate);
  if (Math.abs(candidate.bedrooms - base.bedrooms) <= 1) score += 0.5;
  return score;
}

/** Motivo principal, para el pill de cada slide. */
export function similarityReason(base: Property, candidate: Property): string {
  if (candidate.location.neighborhood === base.location.neighborhood) return "Mismo barrio";
  if (candidate.type === base.type) return "Mismo tipo";
  if (priceCloseness(base, candidate) >= 0.75) return "Precio similar";
  return "Te puede interesar";
}

/**
 * Próximas `count` propiedades a agregar después de `base`, sacadas de
 * `pool` y excluyendo las que ya están en `queue`. Si no alcanzan, recicla
 * las que se vieron hace más tiempo (las primeras de la cola), sin repetir
 * ninguna de las últimas `count` para que no se sienta como un rebote.
 */
export function nextSimilar(
  base: Property,
  pool: Property[],
  queue: QueueItem[],
  count = QUEUE_BATCH
): QueueItem[] {
  const queued = new Set(queue.map((q) => q.property.id));
  const fresh = pool
    .filter((p) => !queued.has(p.id))
    .map((p) => ({ p, score: similarityScore(base, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ p }) => ({ property: p, reason: similarityReason(base, p) }));

  if (fresh.length >= count || pool.length <= 1) return fresh;

  // Pool agotado: loop interno con las vistas hace más tiempo.
  const recent = new Set(queue.slice(-count).map((q) => q.property.id));
  const picked = new Set(fresh.map((f) => f.property.id));
  const recycled: QueueItem[] = [];
  for (const item of queue) {
    if (fresh.length + recycled.length >= count) break;
    const id = item.property.id;
    if (recent.has(id) || picked.has(id) || id === base.id) continue;
    picked.add(id);
    recycled.push({ property: item.property });
  }
  return [...fresh, ...recycled];
}

/** Cola inicial al entrar al feed: la elegida + el primer lote de similares. */
export function buildInitialQueue(start: Property, pool: Property[]): QueueItem[] {
  const first: QueueItem[] = [{ property: start }];
  return [...first, ...nextSimilar(start, pool, first)];
}
