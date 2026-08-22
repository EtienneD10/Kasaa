import { PipelineKanban } from "@/components/agent/PipelineKanban";

/**
 * `/agente/pipeline` — Pipeline de Leads (frame `pipeline-kanban`). Gate
 * por rol y `AgentSidebar` en `layout.tsx` del route group `(panel)`.
 */
export default function AgentPipelinePage() {
  return <PipelineKanban />;
}
