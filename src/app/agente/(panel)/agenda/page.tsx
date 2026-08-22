import { AgentAgenda } from "@/components/agent/AgentAgenda";

/**
 * `/agente/agenda` — Agenda (frame `agent-agenda-screen` + "Flujo de
 * Resolución de Conflictos"). Gate por rol y `AgentSidebar` en
 * `layout.tsx` del route group `(panel)`.
 */
export default function AgentAgendaPage() {
  return <AgentAgenda />;
}
