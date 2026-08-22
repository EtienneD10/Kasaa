import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

/**
 * Landing Gateway — reconstruida a partir del frame real de Figma
 * (`landing-mosaic-desktop`, node 483:124), no de una interpretación libre
 * de la spec §3.1. Diferencias contra la versión anterior: sin pill
 * "Búsqueda con IA" (no está en el diseño), header minimal (solo logo +
 * selector de idioma decorativo — ni "Iniciar sesión" ni "Anunciar
 * propiedad" aparecen acá, a diferencia del resto de la app compradora),
 * copy distinto, link con flecha, caption de copyright.
 *
 * "Mosaico de video en vivo de fondo (grid de propiedades reproduciéndose,
 * dimmed)": sin archivos de video reales todavía (`videoUrl` queda como
 * campo del tipo `Property` para cuando haya CDN de streaming — ver
 * TRACKING.md, decisión abierta #3), así que el mosaico usa fotos fijas
 * con un shimmer sutil. Fotos curadas aparte de `mock-data.ts` — el
 * Figma usa fotografía editorial cálida/dorada bien distinta del stock de
 * las tarjetas de propiedad, así que se usa un set propio acá.
 */
const MOSAIC_PHOTOS = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=600",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600",
  "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
  "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600",
  "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600",
  "https://images.unsplash.com/photo-1499955085172-a104c9463ece?w=600",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600",
  "https://images.unsplash.com/photo-1600566752734-2a0cd332f956?w=600",
  "https://images.unsplash.com/photo-1600121848594-31396b3ec36c?w=600",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Mosaico de fondo */}
      <div className="absolute inset-0 grid grid-cols-3 gap-0.5 sm:grid-cols-4 lg:grid-cols-7">
        {MOSAIC_PHOTOS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + i}
            src={src}
            alt=""
            aria-hidden
            className="mosaic-cell h-full w-full object-cover"
            style={{ animationDelay: `${(i % 6) * 0.7}s` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/50" />

      {/* Header minimal — solo logo + selector de idioma, spec de Figma
          (no comparte el Header global de Discovery/Login en esta pantalla) */}
      <header className="absolute inset-x-0 top-0 z-10 flex h-20 items-center justify-between px-8">
        <Logo dark />
        <span
          title="Próximamente: selector de idioma"
          className="rounded-pill bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
        >
          ES
        </span>
      </header>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Cientos de hogares.
          <br />
          Un solo lugar.
        </h1>
        <p className="mt-4 max-w-md text-base text-white/80">
          Recorré propiedades en video real y coordiná tu visita al instante.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/discovery?operation=venta"
            className="rounded-control bg-accent px-8 py-3.5 text-sm font-bold text-black transition-transform hover:scale-[1.02]"
          >
            Comprar
          </Link>
          <Link
            href="/discovery?operation=alquiler"
            className="rounded-control border border-white/70 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Alquilar
          </Link>
        </div>

        <Link
          href="/discovery"
          className="mt-5 flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
        >
          o explorá todas las propiedades <ArrowRight size={14} />
        </Link>
      </main>

      <p className="absolute inset-x-0 bottom-6 z-10 text-center text-xs text-white/50">
        © 2026 Kasaa · Propiedades exclusivas en España
      </p>
    </div>
  );
}
