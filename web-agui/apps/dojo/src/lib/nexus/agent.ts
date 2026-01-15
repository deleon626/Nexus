/**
 * Agent client for Nexus AG-UI integration.
 * Handles communication with the Agno backend via AG-UI protocol.
 */

export interface NexusAgentConfig {
  backendUrl?: string;
  agentId?: string;
}

/**
 * Create a Nexus agent client for AG-UI communication.
 * This integrates with CopilotKit for SSE-based agent communication.
 */
export function createNexusAgent(config: NexusAgentConfig = {}) {
  const {
    backendUrl = process.env.NEXT_PUBLIC_NEXUS_BACKEND_URL || 'http://localhost:9001',
    agentId = 'qc-assistant',
  } = config;

  return {
    /**
     * Get the AG-UI endpoint URL for this agent.
     */
    getAguiUrl: () => `${backendUrl}/agui`,

    /**
     * Get the agent ID.
     */
    getAgentId: () => agentId,

    /**
     * Get the full runtime URL for CopilotKit integration.
     */
    getRuntimeUrl: () => `/api/copilotkit/nexus`,
  };
}

// Singleton instance
export const nexusAgent = createNexusAgent();
