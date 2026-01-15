# Dojo Setup for Nexus AG-UI

This directory contains the AG-UI Dojo frontend for Nexus QC data entry.

## Quick Setup

```bash
# 1. Install dependencies
cd typescript-sdk
pnpm install

# 2. Build Agno integration
cd ../integrations/agno
pnpm run build

# 3. Configure environment
cd ../../apps/dojo
export AGNO_URL=http://localhost:9001

# 4. Start Dojo
pnpm run dev
```

## Configuration for Nexus

Edit `apps/dojo/src/agents.ts` to add Nexus QC agent:

```typescript
{
  id: "nexus-qc",
  agents: async () => {
    return {
      qc_agent: new AgnoAgent({
        url: `${envVars.agnoUrl}/agui`,
      }),
    };
  },
}
```

## Features

Dojo provides a ready-to-use frontend with:
- Chat interface with message history
- Image upload support
- Tool execution display
- Custom event rendering
- Session management
- Schema-aware confirmation modals (via Custom Events)

## More Information

- AG-UI Protocol: https://docs.ag-ui.com/
- Agno Integration: https://docs.agno.com/agent-os/interfaces/ag-ui/introduction
