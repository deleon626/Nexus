---
phase: 01-foundation-auth
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - vite.config.ts
  - tsconfig.json
  - tsconfig.app.json
  - tsconfig.node.json
  - index.html
  - src/main.tsx
  - src/App.tsx
  - src/vite-env.d.ts
  - tailwind.config.js
  - src/index.css
  - .env.example
autonomous: true
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - OFFL-01
  - OFFL-02
  - OFFL-03
  - OFFL-04
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

must_haves:
  truths:
    - "Vite dev server starts without errors"
    - "React app renders at http://localhost:5173"
    - "Tailwind CSS classes work (e.g., className='text-red-500')"
    - "shadcn/ui is configured and can add components"
    - "TypeScript compiles without type errors"
  artifacts:
    - path: "package.json"
      provides: "Project dependencies and scripts"
      contains: "@vitejs/plugin-react, @clerk/clerk-react, convex, dexie, @tanstack/react-query, vite-plugin-pwa, react-router"
    - path: "vite.config.ts"
      provides: "Vite plugins and path aliases"
      contains: "VitePWA, alias: '@'"
    - path: "src/App.tsx"
      provides: "Root React component"
      min_lines: 5
    - path: "tailwind.config.js"
      provides: "Tailwind configuration"
      contains: "content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']"
  key_links:
    - from: "vite.config.ts"
      to: "tailwind.config.js"
      via: "@tailwindcss/vite plugin"
      pattern: "@tailwindcss/vite"
    - from: "src/main.tsx"
      to: "src/App.tsx"
      via: "React render"
      pattern: "createRoot.*App"

---

<objective>
Initialize the Vite + React + TypeScript project with all required dependencies for Phase 1: Vite build system, React framework, Tailwind CSS + shadcn/ui for styling, Clerk for authentication, Convex for backend, Dexie.js for offline storage, TanStack Query for server state, vite-plugin-pwa for PWA functionality, and React Router v7 for routing.

Purpose: This is the foundational project setup that all subsequent plans depend on. Without these dependencies and configurations, no features can be implemented.

Output: Working Vite dev server, configured Tailwind CSS, shadcn/ui ready to add components, all dependencies installed in package.json.
</objective>

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
# - Vite React TypeScript template (standard setup)
# - Tailwind CSS + shadcn/ui installation via CLI
# - Path alias configuration (@/ -> ./src)
</context>

<tasks>

<task type="auto">
  <name>Initialize Vite project with React + TypeScript</name>
  <files>package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, index.html, src/main.tsx, src/App.tsx, src/vite-env.d.ts</files>
  <action>
Create Vite project using the React TypeScript template:

```bash
npm create vite@latest . -- --template react-ts
```

If the command fails because directory is not empty, create these files manually following the standard Vite React TypeScript template structure:

1. **package.json** - Create with:
   - `name: "nexus"`
   - `type: "module"`
   - `scripts`: `dev`, `build`, `preview`, `check-types`
   - `devDependencies`: `@vitejs/plugin-react`, `vite`, `typescript`, `@types/react`, `@types/react-dom`
   - `dependencies`: `react`, `react-dom`

2. **vite.config.ts** - Create with:
   ```ts
   import react from '@vitejs/plugin-react'
   import path from "path"

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "./src"),
       },
     },
   })
   ```

3. **tsconfig.json**, **tsconfig.app.json**, **tsconfig.node.json** - Standard Vite TypeScript config with baseUrl: "." and paths: { "@/*": ["./src/*"] }

4. **index.html** - Standard Vite entry point with `<div id="root"></div>` and script to `/src/main.tsx`

5. **src/main.tsx** - React StrictMode root
6. **src/App.tsx** - Basic component returning `<div />`
7. **src/vite-env.d.ts** - Vite environment types

Do NOT use `npm create vite` if it prompts for interactive input — create files manually instead to avoid blocking.
  </action>
  <verify>npm run dev starts successfully and serves at http://localhost:5173 without errors</verify>
  <done>Vite dev server runs, browser shows basic React app</done>
</task>

<task type="auto">
  <name>Install all Phase 1 dependencies</name>
  <files>package.json</files>
  <action>
Install all required dependencies for Phase 1 in a single command:

```bash
npm install @clerk/clerk-react convex convex-react-clerk dexie @tanstack/react-query @tanstack/react-query-persist-client-core @tanstack/query-sync-storage-persister react-router
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa workbox-precaching workbox-strategies workbox-routing clsx tailwind-merge class-variance-authority
```

After installation, verify package.json contains all dependencies. Do NOT run any setup CLIs (shadcn, etc.) — that comes in the next task.
  </action>
  <verify>grep -q "@clerk/clerk-react" package.json && grep -q "convex" package.json && grep -q "dexie" package.json && grep -q "@tanstack/react-query" package.json && grep -q "vite-plugin-pwa" package.json</verify>
  <done>All Phase 1 dependencies present in package.json</done>
</task>

<task type="auto">
  <name>Configure Tailwind CSS and shadcn/ui</name>
  <files>tailwind.config.js, src/index.css</files>
  <action>
Configure Tailwind CSS and initialize shadcn/ui:

1. Create **tailwind.config.js**:
```js
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

2. Create **src/index.css** with Tailwind directives and CSS variables:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }
}
}
```

3. Install tailwindcss-animate:
```bash
npm install -D tailwindcss-animate
```

4. Create **src/lib/utils.ts**:
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Do NOT run `npx shadcn@latest init` interactively — the manual configuration above is faster and non-blocking.
  </action>
  <verify>grep -q "@tailwind" src/index.css && [ -f src/lib/utils.ts ]</verify>
  <done>Tailwind CSS configured, cn() utility function exists</done>
</task>

<task type="auto">
  <name>Create environment configuration template</name>
  <files>.env.example</files>
  <action>
Create **.env.example** with all required environment variables:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxx

# Convex Backend
VITE_CONVEX_URL=https://xxxxx.convex.cloud
```

Also create a local **.env.local** file (gitignored) with placeholder values for development:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
VITE_CONVEX_URL=https://placeholder.convex.cloud
```

Add **.env.local** to **.gitignore** if not already present.
  </action>
  <verify>grep -q "VITE_CLERK_PUBLISHABLE_KEY" .env.example && grep -q "VITE_CONVEX_URL" .env.example</verify>
  <done>Environment template exists with all required variables documented</done>
</task>

</tasks>

<verification>
After completing all tasks:

1. Run `npm run dev` — verify Vite dev server starts at http://localhost:5173
2. Check browser shows basic React app without console errors
3. Verify Tailwind CSS works by temporarily adding `className="text-red-500"` to App.tsx
4. Confirm TypeScript compiles without errors: `npx tsc --noEmit`
5. Check that all required dependencies are in package.json
</verification>

<success_criteria>
- Vite dev server runs without errors
- React app renders in browser
- Tailwind CSS classes apply correctly
- shadcn/ui infrastructure is configured (utils.ts, CSS variables)
- TypeScript compilation succeeds
- All Phase 1 dependencies installed
- Environment template created
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-auth/01-foundation-auth-01-SUMMARY.md` with:
- What was built (Vite project, dependencies, Tailwind, shadcn/ui base)
- Any deviations from research
- Next steps: Plan 02 (PWA configuration)
</output>
