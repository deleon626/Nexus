import { NextRequest } from "next/server";

export const runtime = "edge";

// Backend AG-UI endpoint
const BACKEND_URL =
  process.env.NEXT_PUBLIC_NEXUS_BACKEND_URL || "http://localhost:8000";

// GET - Return agent information for AG-UI discovery
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

// POST - Proxy to AG-UI backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Debug: Log the request body
    console.log("AG-UI Request:", JSON.stringify(body, null, 2));

    // Forward request to AG-UI backend
    const response = await fetch(`${BACKEND_URL}/agui`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Forward error response
      const errorText = await response.text();
      console.error("AG-UI backend error:", response.status, errorText);
      return new Response(errorText, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Stream the SSE response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to AG-UI backend",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
