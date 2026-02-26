---
phase: 01-foundation-auth
plan: 04
type: execute
wave: 2
depends_on: ["01-foundation-auth-01"]
files_modified:
  - src/lib/convex.ts
  - src/lib/clerk.ts
  - src/App.tsx
  - src/main.tsx
autonomous: true
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
user_setup:
  - service: clerk
    why: "Authentication and user management"
    env_vars:
      - name: VITE_CLERK_PUBLISHABLE_KEY
        source: "Clerk Dashboard -> API Keys -> Publishable Key"
    dashboard_config:
      - task: "Create Clerk application"
        location: "Clerk Dashboard -> Create Application"
  - service: convex
    why: "Backend database and real-time queries"
    env_vars:
      - name: VITE_CONVEX_URL
        source: "Convex Dashboard -> Project Settings -> Deployment URL"
    dashboard_config:
      - task: "Create Convex project"
        location: "Convex Dashboard -> New Project"
      - task: "Enable Clerk authentication"
        location: "Convex Dashboard -> Project Settings -> Auth"

must_haves:
  truths:
    - "ClerkProvider wraps the app with publishable key from env"
    - "ConvexProviderWithClerk bridges auth tokens to Convex backend"
    - "User can sign in via Clerk (full-page redirect per user decision)"
    - "Authenticated state is accessible via useAuth() hook"
  artifacts:
    - path: "src/lib/convex.ts"
      provides: "Convex client initialization"
      contains: "new ConvexReactClient"
      exports: ["convex"]
    - path: "src/lib/clerk.ts"
      provides: "Clerk client configuration"
      contains: "publishableKey"
      exports: ["publishableKey", clerkPubKey]
    - path: "src/App.tsx"
      provides: "Root component with Clerk and Convex providers"
      contains: "ClerkProvider, ConvexProviderWithClerk"
    - path: "src/main.tsx"
      provides: "Entry point with provider setup"
      contains: "StrictMode"
  key_links:
    - from: "src/App.tsx"
      to: "src/lib/convex.ts"
      via: "ConvexReactClient import"
      pattern: "import.*convex.*from.*convex"
    - from: "src/App.tsx"
      to: "Clerk"
      via: "ClerkProvider and ConvexProviderWithClerk"
      pattern: "ClerkProvider.*ConvexProviderWithClerk"

---

<objective>
Integrate Clerk authentication and Convex backend using the official Convex + Clerk integration pattern. Wrap the app with providers, initialize clients, and enable auth token bridging from Clerk to Convex.

Purpose: AUTH-01 requires Clerk sign-in, AUTH-02 requires role-based access, and AUTH-03 requires organization data isolation. This plan establishes the auth infrastructure that all protected routes and data queries will depend on.

Output: ClerkProvider configured, Convex client initialized, ConvexProviderWithClerk bridging auth tokens, sign-in flow accessible.
</object>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-auth/01-RESEARCH.md

# Research patterns to follow:
# - ConvexProviderWithClerk from convex/react-clerk for auth bridging
# - ClerkProvider with publishableKey from env
# - useAuth() hook from @clerk/clerk-react
# - Full-page redirect to Clerk sign-in (per user decision)
</context>

<tasks>

<task type="auto">
  <name>Initialize Convex client</name>
  <files>src/lib/convex.ts</files>
  <action>
Create **src/lib/convex.ts** with Convex client initialization:

```typescript
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL environment variable is not set");
}

export const convex = new ConvexReactClient(convexUrl);
```

This follows the standard Convex client initialization pattern. The URL is loaded from environment variables for configuration flexibility.
  </action>
  <verify>grep -q "ConvexReactClient" src/lib/convex.ts && grep -q "export const convex" src/lib/convex.ts</verify>
  <done>Convex client initialized with environment-based URL</done>
</task>

<task type="auto">
  <name>Initialize Clerk client configuration</name>
  <files>src/lib/clerk.ts</files>
  <action>
Create **src/lib/clerk.ts** with Clerk configuration:

```typescript
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY environment variable is not set");
}

export const publishableKey = clerkPubKey;
```

This exports the Clerk publishable key for use in ClerkProvider. Separating configuration from component setup makes testing and mocking easier.
  </action>
  <verify>grep -q "VITE_CLERK_PUBLISHABLE_KEY" src/lib/clerk.ts && grep -q "export" src/lib/clerk.ts</verify>
  <done>Clerk configuration exported from lib module</done>
</task>

<task type="auto">
  <name>Wrap app with Clerk and Convex providers</name>
  <files>src/App.tsx, src/main.tsx</files>
  <action>
Update **src/App.tsx** to wrap the application with both providers:

```tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "./lib/convex";
import { publishableKey } from "./lib/clerk";

function App() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">Nexus QC Forms</h1>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <p className="text-muted-foreground">Loading...</p>
          </main>
        </div>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default App;
```

Update **src/main.tsx** to ensure proper provider nesting:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

The provider nesting order is critical: ClerkProvider must wrap ConvexProviderWithClerk, which passes the auth token to Convex. This follows the official Clerk + Convex integration pattern.
  </action>
  <verify>grep -q "ClerkProvider" src/App.tsx && grep -q "ConvexProviderWithClerk" src/App.tsx && grep -q "useAuth" src/App.tsx</verify>
  <done>App wrapped with auth providers in correct order</done>
</task>

</tasks>

<verification>
After completing all tasks:

1. Set environment variables in .env.local:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (from Clerk Dashboard)
   VITE_CONVEX_URL=https://...convex.cloud (from Convex Dashboard)
   ```
2. Run `npm run dev`
3. Verify app loads without console errors
4. Check that Clerk elements would be available (currently no auth UI, but providers are initialized)
5. Verify no TypeScript errors: `npx tsc --noEmit`
6. Check browser console for any Convex or Clerk initialization errors

Note: Sign-in UI will be added in Plan 05 (Protected Routing). This plan only establishes the provider infrastructure.
</verification>

<success_criteria>
- Convex client initialized with environment URL
- Clerk publishable key loaded from environment
- App wrapped with ClerkProvider and ConvexProviderWithClerk
- useAuth hook passed to ConvexProviderWithClerk for token bridging
- No TypeScript or runtime errors
- Environment variables documented and required
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-auth/01-foundation-auth-04-SUMMARY.md` with:
- Provider setup details
- Environment variable configuration
- Clerk + Convex integration pattern used
- Next steps: Plan 05 (Protected routing with sign-in)
</output>
