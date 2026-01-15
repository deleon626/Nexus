export const runtime = 'edge';

// GET /api/copilotkit/nexus/info - Return agent information for CopilotKit discovery
// CopilotKit expects agents as a map/object, not an array
export async function GET() {
  return Response.json({
    version: "0.2.0",
    agents: {
      qc_assistant: {
        name: "qc_assistant",
        className: "AgnoAgent",
        description: "QC Assistant for manufacturing operations",
      },
    },
    audioFileTranscriptionEnabled: false,
  });
}
