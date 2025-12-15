# Research: shadcn/ui Setup for Vite + React + TypeScript

**Feature**: 003-shadcn-setup
**Date**: 2025-12-16
**Status**: Complete

## Overview

Research findings for integrating shadcn/ui into an existing Vite + React + TypeScript + Tailwind CSS project.

---

## 1. shadcn/ui Vite Installation Requirements

**Decision**: Follow official Vite installation guide from ui.shadcn.com

**Rationale**:
- Official documentation provides tested, working configuration
- Vite-specific setup differs from Next.js (no server components)
- Path aliases require both tsconfig and vite.config changes

**Alternatives Considered**:
- Manual component copy-paste: Rejected - loses CLI benefits and updates
- Next.js migration: Rejected - unnecessary complexity for SPA dashboard

### Required Steps

1. **Install @types/node** (for path resolution in vite.config.ts)
   ```bash
   npm install -D @types/node
   ```

2. **Configure tsconfig.json** path aliases
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

3. **Configure vite.config.ts** path aliases
   ```typescript
   import path from "path"
   import { defineConfig } from "vite"
   import react from "@vitejs/plugin-react"

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "./src"),
       },
     },
   })
   ```

4. **Run shadcn init**
   ```bash
   npx shadcn@latest init
   ```

   Configuration options:
   - Style: Default
   - Base color: Slate (or match design tokens)
   - CSS variables: Yes
   - Tailwind config location: tailwind.config.js
   - Components location: src/components
   - Utils location: src/lib/utils

---

## 2. Design Token Integration

**Decision**: Use existing oklch design tokens from `styles/design-tokens.css`

**Rationale**:
- Design tokens already defined in CSS custom properties
- oklch color space is modern and perceptually uniform
- shadcn/ui uses CSS custom properties for theming

**Alternatives Considered**:
- Regenerate tokens from scratch: Rejected - duplicates existing work
- Convert to hsl: Rejected - oklch is more modern and accurate

### Integration Approach

The existing `design-tokens.css` file already defines shadcn-compatible CSS custom properties:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--radius`
- Dark mode variants via `.dark` class

**Action**: Import `design-tokens.css` in globals.css before shadcn base styles.

---

## 3. Tailwind CSS v3 Compatibility

**Decision**: shadcn/ui v4 components work with Tailwind CSS v3.x

**Rationale**:
- Current project uses Tailwind CSS 3.3.5
- shadcn/ui components use standard Tailwind utilities
- No breaking changes between Tailwind 3.x and shadcn components

**Alternatives Considered**:
- Upgrade to Tailwind v4: Rejected - not stable, breaking changes
- Downgrade shadcn: Not needed - compatible as-is

### Tailwind Config Extensions

Add to `tailwind.config.js`:
```javascript
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other semantic colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 4. HeadlessUI Coexistence

**Decision**: HeadlessUI and Radix UI can coexist without conflicts

**Rationale**:
- Different component namespaces (HeadlessUI vs shadcn/ui)
- No shared dependencies that conflict
- Gradual migration path allows component-by-component replacement

**Alternatives Considered**:
- Remove HeadlessUI immediately: Rejected - breaking change to existing pages
- Fork HeadlessUI components: Rejected - unnecessary complexity

### Coexistence Strategy

1. Keep HeadlessUI imports unchanged in existing components
2. Use shadcn components for new development
3. Migrate HeadlessUI → shadcn on per-component basis (future task)
4. No namespace conflicts:
   - HeadlessUI: `@headlessui/react`
   - shadcn: `@/components/ui/*`

---

## 5. Core Components Selection

**Decision**: Install 13 core components based on Nexus dashboard requirements

**Rationale**:
- Components selected based on PRD requirements (approval queue, forms, data tables)
- Minimal set to avoid bundle bloat
- Additional components can be added on-demand

### Component List

| Component | Primary Use Case | Dependencies |
|-----------|------------------|--------------|
| Button | Actions, form submissions | class-variance-authority |
| Card | Content containers | - |
| Dialog | Confirmation modals | @radix-ui/react-dialog |
| Form | QC data entry | react-hook-form, @hookform/resolvers, zod |
| Input | Text input fields | - |
| Label | Form field labels | @radix-ui/react-label |
| Select | Dropdown selections | @radix-ui/react-select |
| Table | Approval queue, data lists | - |
| Tabs | Navigation within views | @radix-ui/react-tabs |
| Badge | Status indicators | class-variance-authority |
| Alert | System notifications | - |
| Skeleton | Loading states | - |
| Sonner | Toast notifications | sonner, next-themes |

### Installation Command

```bash
npx shadcn@latest add button card dialog form input label select table tabs badge alert skeleton sonner
```

---

## 6. Bundle Size Impact

**Decision**: Expected bundle increase < 50KB gzipped for core components

**Rationale**:
- Radix UI primitives are tree-shakeable
- Only imported components are bundled
- clsx and tailwind-merge are tiny (~2KB combined)

**Measurements** (estimated):
| Package | Size (gzipped) |
|---------|---------------|
| clsx | ~0.5KB |
| tailwind-merge | ~1.5KB |
| class-variance-authority | ~1KB |
| lucide-react (icons) | ~5KB (tree-shaken) |
| @radix-ui primitives | ~20-30KB (13 components) |
| **Total estimated** | **~30-40KB** |

**Verification**: Run `npm run build` and compare bundle sizes before/after.

---

## 7. Dark Mode Strategy

**Decision**: Use class-based dark mode with `.dark` class on root element

**Rationale**:
- Design tokens already support `.dark` class variant
- Consistent with shadcn/ui default approach
- Allows user preference storage and manual toggle

**Alternatives Considered**:
- Media query dark mode: Rejected - no user control
- CSS-in-JS theming: Rejected - not compatible with Tailwind approach

### Implementation

1. Tailwind config: `darkMode: ["class"]`
2. Toggle `.dark` class on `<html>` element
3. Use `next-themes` package for persistence (installed with Sonner)

---

## Summary

All research questions resolved. No blockers identified. Ready for implementation.

| Question | Resolution |
|----------|------------|
| Vite setup | Follow official guide with path aliases |
| Design tokens | Use existing oklch tokens in CSS vars |
| Tailwind compatibility | v3.3.5 works without changes |
| HeadlessUI conflict | None - different namespaces |
| Component selection | 13 core components identified |
| Bundle impact | Estimated < 40KB gzipped |
| Dark mode | Class-based with .dark class |
