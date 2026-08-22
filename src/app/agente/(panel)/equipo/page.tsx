import { EquipoTeam } from "@/components/agent/EquipoTeam";

/**
 * `/agente/equipo` — Tu equipo (frame `equipo-team`). Gate por rol y
 * `AgentSidebar` en `layout.tsx` del route group `(panel)`.
 */
export default function AgentEquipoPage() {
  return <EquipoTeam />;
}
