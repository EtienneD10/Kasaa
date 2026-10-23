"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { DroneStyle, Property } from "@/types";

/**
 * Medios "ricos" de cada propiedad: video representativo, estilo de
 * recorrido tipo dron y enlace al recorrido 3D (Matterport u otro).
 *
 * No hay backend todavía, así que lo que el agente carga en
 * `PropertyMediaModal` (panel Propiedades) se guarda en este contexto en
 * memoria, montado en el layout raíz — por eso un cambio hecho en el panel
 * del agente se ve en Discovery SI se navega con links internos (no con
 * recarga completa, que reinicia el estado — mismo criterio que
 * `AuthProvider`/`MisVisitasPanel`). Cuando haya API, este contexto es el
 * único lugar que hay que reemplazar.
 */

export interface PropertyMediaOverride {
  videoUrl?: string;
  droneStyle?: DroneStyle;
  tourUrl?: string;
}

export const DEFAULT_DRONE_STYLE: DroneStyle = "kasaa";

export const DRONE_STYLES: {
  id: DroneStyle;
  label: string;
  description: string;
}[] = [
  {
    id: "kasaa",
    label: "Dron Kasaa",
    description: "Predeterminado — avance suave con leve deriva, como un dron entrando a la propiedad.",
  },
  {
    id: "orbita",
    label: "Órbita",
    description: "Giro lateral alrededor de la propiedad, de izquierda a derecha.",
  },
  {
    id: "ascenso",
    label: "Ascenso",
    description: "Subida vertical que revela la fachada y el entorno.",
  },
  {
    id: "panoramica",
    label: "Panorámica",
    description: "Paneo amplio y lento para mostrar el ancho del espacio.",
  },
];

/** Solo https — el enlace termina dentro de un `<iframe>`, así que se
 * rechazan otros esquemas (`javascript:`, `data:`, http plano). */
export function isValidTourUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

interface PropertyMediaContextValue {
  overrides: Record<string, PropertyMediaOverride>;
  setMedia: (propertyId: string, media: PropertyMediaOverride) => void;
}

const PropertyMediaContext = createContext<PropertyMediaContextValue | null>(null);

export function PropertyMediaProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, PropertyMediaOverride>>({});

  const setMedia = useCallback((propertyId: string, media: PropertyMediaOverride) => {
    setOverrides((prev) => ({ ...prev, [propertyId]: media }));
  }, []);

  const value = useMemo(() => ({ overrides, setMedia }), [overrides, setMedia]);

  return <PropertyMediaContext.Provider value={value}>{children}</PropertyMediaContext.Provider>;
}

export function usePropertyMediaStore() {
  const ctx = useContext(PropertyMediaContext);
  if (!ctx) throw new Error("usePropertyMediaStore debe usarse dentro de <PropertyMediaProvider>");
  return ctx;
}

/** Medios efectivos de una propiedad: lo cargado por el agente pisa lo del mock. */
export function usePropertyMedia(property: Property): Required<Pick<PropertyMediaOverride, "droneStyle">> &
  PropertyMediaOverride {
  const { overrides } = usePropertyMediaStore();
  const o = overrides[property.id];
  return {
    videoUrl: o ? o.videoUrl : property.videoUrl,
    tourUrl: o ? o.tourUrl : property.tourUrl,
    droneStyle: (o ? o.droneStyle : property.droneStyle) ?? DEFAULT_DRONE_STYLE,
  };
}
