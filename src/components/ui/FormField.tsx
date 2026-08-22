import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Input con label uppercase chico + fondo gris relleno (sin borde) —
 * patrón repetido en Login/Registro comprador, Registro de agente y Login
 * de agente en el Figma real (antes usábamos placeholder-only sobre fondo
 * blanco con borde, que no es como está diseñado).
 */
export function FormField({
  label,
  className,
  ...inputProps
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-buyer-text-muted">
        {label}
      </span>
      <input
        {...inputProps}
        className={cn(
          "w-full rounded-control bg-buyer-input-bg px-4 py-3 text-sm text-buyer-text outline-none placeholder:text-buyer-text-faint focus:ring-2 focus:ring-accent",
          className
        )}
      />
    </label>
  );
}
