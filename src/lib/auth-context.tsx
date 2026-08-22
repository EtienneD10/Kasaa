"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "@/types";

/**
 * Mock de autenticación — SOLO front-end, sin persistencia real.
 *
 * TRACKING.md tiene como decisión abierta #2 qué proveedor de auth usar
 * (NextAuth / Clerk / propio). Hasta que se resuelva, este contexto simula
 * los 3 estados de header que pide la spec §2 (no autenticado / comprador /
 * agente) para poder construir y probar el resto de las pantallas. El
 * estado vive en memoria (se pierde al refrescar) — reemplazar `login` /
 * `logout` por llamadas reales al proveedor elegido, manteniendo la misma
 * forma de `AuthContextValue` para no tener que tocar los componentes que
 * ya la consumen (Header, Login, etc).
 */

export interface MockAuthUser {
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  /** Solo rol agente — nombre de la inmobiliaria, se muestra en el
   * sidebar del panel de agente. */
  agency?: string;
}

interface AuthContextValue {
  role: UserRole | null;
  user: MockAuthUser | null;
  pendingVisitsCount: number;
  unreadNotificationsCount: number;
  login: (role: UserRole, user?: MockAuthUser) => void;
  logout: () => void;
  /** Actualiza campos sueltos del usuario logueado — usado por el drawer
   * de Configuración ("Guardar cambios"). Solo en memoria, como el resto
   * del mock. */
  updateUser: (patch: Partial<MockAuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_USERS: Record<UserRole, MockAuthUser> = {
  comprador: { name: "Camila Ríos", email: "camila.rios@email.com", phone: "+34 612 345 678" },
  agente: {
    name: "María Rodríguez",
    email: "maria.rodriguez@email.com",
    phone: "+54 9 11 5555-0001",
    agency: "Agencia Palermo Gold",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<MockAuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      user,
      // Valores de ejemplo para los badges del header — reemplazar por
      // datos reales (VisitRequest[] / Notification[]) cuando exista API.
      pendingVisitsCount: role === "comprador" ? 2 : 0,
      unreadNotificationsCount: role === "comprador" ? 3 : 0,
      login: (nextRole, nextUser) => {
        setRole(nextRole);
        // Mergea sobre el default en vez de reemplazarlo entero: los
        // forms de login solo piden nombre/email (a veces ninguno), así
        // que campos que no piden (agency, phone, avatarUrl) caen a un
        // valor de ejemplo razonable en vez de quedar undefined —
        // importante para el sidebar del panel de agente, que siempre
        // necesita mostrar algo en "agencia".
        setUser(nextUser ? { ...DEFAULT_USERS[nextRole], ...nextUser } : DEFAULT_USERS[nextRole]);
      },
      logout: () => {
        setRole(null);
        setUser(null);
      },
      updateUser: (patch) => {
        setUser((prev) => (prev ? { ...prev, ...patch } : prev));
      },
    }),
    [role, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
