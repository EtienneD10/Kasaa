import { AgentDashboardHome } from "@/components/agent/AgentDashboardHome";

/**
 * `/agente` — Dashboard Home real (frame `dashboard-home`). El gate por
 * rol y el `AgentSidebar` viven en `layout.tsx` de este mismo route group
 * `(panel)`, ver ese archivo.
 */
export default function AgentDashboardPage() {
  return <AgentDashboardHome />;
}
