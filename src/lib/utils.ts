import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string) {
  const symbol = currency === "USD" ? "US$" : currency === "EUR" ? "€" : "$";
  return `${symbol}${price.toLocaleString("es-AR")}`;
}

/** "Hace 2h" / "Hace 3d" — badge de timestamp en PropertyCard (spec §3.4). */
export function timeAgo(isoDate: string) {
  const days = Math.max(
    0,
    Math.round((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
  );
  if (days <= 0) return "Hace 2h";
  if (days === 1) return "Hace 1d";
  if (days < 7) return `Hace ${days}d`;
  return `Hace ${Math.round(days / 7)}sem`;
}
