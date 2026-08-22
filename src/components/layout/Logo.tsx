import { cn } from "@/lib/utils";

/**
 * Wordmark de Kasaa — logo real (archivo entregado por el usuario, no una
 * aproximación en CSS/texto como la versión anterior de este componente).
 * Es una "k" verde neón con un mini-glifo de ventana 2x2 + "asaa" en negro
 * bold, mismo peso/tracking.
 *
 * `public/kasaa-logo.png` / `public/kasaa-logo-dark.png` se generaron a
 * partir del archivo fuente (`public/kasaa-logo-source.jpg`, exportado
 * sobre fondo claro) quitándole el fondo (key por brillo/saturación,
 * bordes con antialiasing real, no un recorte duro) y recoloreando la
 * palabra "asaa" a blanco para la variante oscura — el verde de la "k" se
 * mantiene igual en ambas (matchea el token `--color-accent` #00ff66 casi
 * exacto, así que no hace falta forzarlo). No había una segunda versión
 * del archivo para fondo oscuro, así que la variante dark es una
 * recoloreada, no un asset entregado — si el usuario tiene el original
 * en blanco, se puede reemplazar `kasaa-logo-dark.png` directo.
 */
export function Logo({
  className,
  dark = false,
}: {
  className?: string;
  /** Sobre fondo oscuro (panel de agente, hero de Landing) */
  dark?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- mismo criterio que el resto de la app: sin next/image, ver otros usos de <img>
    <img
      src={dark ? "/kasaa-logo-dark.png" : "/kasaa-logo.png"}
      alt="Kasaa"
      className={cn("h-7 w-auto select-none", className)}
    />
  );
}
