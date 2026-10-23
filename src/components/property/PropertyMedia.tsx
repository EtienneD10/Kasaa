"use client";

import { useEffect, useRef, useState } from "react";
import { Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePropertyMedia } from "@/lib/property-media";
import type { DroneStyle, Property } from "@/types";

/**
 * Fondo "vivo" de la tarjeta de propiedad (todos sus estados + hero del
 * Quick Look). Orden de prioridad:
 *
 * 1. Video representativo (`videoUrl`) — mudo, en loop, `playsInline`. Sólo
 *    reproduce mientras la tarjeta es visible en pantalla
 *    (IntersectionObserver) para no tener 24 videos corriendo a la vez en
 *    la grilla de Discovery. Si el archivo falla al cargar, cae al
 *    recorrido dron.
 * 2. Recorrido tipo dron simulado con las fotos (`DroneReel`) — NO es video
 *    real: anima las fotos con zoom/traslación cinematográfica según el
 *    estilo elegido (predeterminado: "Dron Kasaa"). Con varias fotos las
 *    encadena con fundido; con una sola hace ida y vuelta del movimiento.
 * 3. Sin fotos: placeholder.
 *
 * Es un fondo absoluto — el contenedor padre tiene que ser `relative` y
 * `overflow-hidden`.
 */

function LoopVideo({
  src,
  poster,
  onFail,
}: {
  src: string;
  poster?: string;
  onFail: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      onError={onFail}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

const DRONE_CLASS: Record<DroneStyle, string> = {
  kasaa: "drone-kasaa",
  orbita: "drone-orbita",
  ascenso: "drone-ascenso",
  panoramica: "drone-panoramica",
};

const PHOTO_DWELL_MS = 5500;
const MAX_REEL_PHOTOS = 4;

export function DroneReel({
  photos,
  style,
  alt,
}: {
  photos: string[];
  style: DroneStyle;
  alt: string;
}) {
  const reel = photos.slice(0, MAX_REEL_PHOTOS);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reel.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % reel.length), PHOTO_DWELL_MS);
    return () => clearInterval(id);
  }, [reel.length]);

  const single = reel.length === 1;

  return (
    <>
      {reel.map((src, i) => {
        const isActive = i === active;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            // Remontar al activarse reinicia el movimiento de cámara de esa foto.
            key={`${src}-${isActive ? "on" : "off"}`}
            src={src}
            alt={i === 0 ? alt : ""}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
              isActive ? "opacity-100" : "opacity-0",
              isActive && DRONE_CLASS[style]
            )}
            style={
              single
                ? { animationIterationCount: "infinite", animationDirection: "alternate" }
                : undefined
            }
          />
        );
      })}
    </>
  );
}

export function PropertyMedia({ property }: { property: Property }) {
  const { videoUrl, droneStyle } = usePropertyMedia(property);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (videoUrl && failedSrc !== videoUrl) {
    return (
      <LoopVideo
        src={videoUrl}
        poster={property.photos[0]}
        onFail={() => setFailedSrc(videoUrl)}
      />
    );
  }

  if (property.photos.length > 0) {
    return <DroneReel photos={property.photos} style={droneStyle} alt={property.title} />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center text-white/40">
      <Images size={20} className="mr-1" /> Sin fotos
    </div>
  );
}
