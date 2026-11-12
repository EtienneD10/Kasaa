"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";

/**
 * Gate de sesión para acciones de comprador (hoy: agendar visita).
 *
 * `requireBuyer(action)` ejecuta `action` en el momento si hay sesión de
 * comprador; si no (invitado, o sesión de agente), abre el recuadro de
 * inicio de sesión y la ejecuta recién cuando la persona entra — por
 * ejemplo, se abre la agenda de la tarjeta que había tocado. Si cierra el
 * recuadro sin entrar, la acción se descarta.
 *
 * Montado en el layout raíz (dentro de `AuthProvider`) para que lo usen la
 * tarjeta, el Quick Look y el Feed inmersivo sin pasar props.
 */
interface LoginGateValue {
  requireBuyer: (action: () => void, context?: { propertyTitle?: string }) => void;
}

const LoginGateContext = createContext<LoginGateValue | null>(null);

interface PendingAction {
  action: () => void;
  propertyTitle?: string;
}

export function LoginGateProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const [pending, setPending] = useState<PendingAction | null>(null);

  const requireBuyer = useCallback<LoginGateValue["requireBuyer"]>(
    (action, context) => {
      if (role === "comprador") action();
      else setPending({ action, propertyTitle: context?.propertyTitle });
    },
    [role]
  );

  const close = useCallback(() => setPending(null), []);

  const value = useMemo(() => ({ requireBuyer }), [requireBuyer]);

  return (
    <LoginGateContext.Provider value={value}>
      {children}
      {pending && (
        <LoginRequiredModal
          propertyTitle={pending.propertyTitle}
          signedInAsAgent={role === "agente"}
          onClose={close}
          onSuccess={() => {
            setPending(null);
            pending.action();
          }}
        />
      )}
    </LoginGateContext.Provider>
  );
}

export function useLoginGate() {
  const ctx = useContext(LoginGateContext);
  if (!ctx) throw new Error("useLoginGate debe usarse dentro de <LoginGateProvider>");
  return ctx;
}
