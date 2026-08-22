import { PropertiesTable } from "@/components/agent/PropertiesTable";

/**
 * `/agente/propiedades` — Propiedades (frame `propiedades-table-view` +
 * `confirm-listing-modal`). Gate por rol y `AgentSidebar` en `layout.tsx`
 * del route group `(panel)`.
 */
export default function AgentPropiedadesPage() {
  return <PropertiesTable />;
}
