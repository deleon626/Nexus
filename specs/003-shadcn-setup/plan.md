# Implementation Plan: shadcn/ui Component Library Setup

**Branch**: `003-shadcn-setup` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-shadcn-setup/spec.md`

## Summary

Initialize shadcn/ui component library in the Nexus web dashboard to provide a consistent, accessible, and customizable UI foundation. This involves configuring path aliases, initializing shadcn/ui CLI, setting up theming to align with existing design tokens, and adding core UI components needed for the approval queue and QC data entry interfaces.

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 18.2.0
**Primary Dependencies**: shadcn/ui (CLI), Radix UI primitives, clsx, tailwind-merge
**Storage**: N/A (UI library setup)
**Testing**: ESLint (frontend testing not mandated by constitution)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend only for this feature)
**Performance Goals**: Bundle size increase < 50KB gzipped for core components
**Constraints**: Must integrate with existing Tailwind CSS 3.3.5, maintain HeadlessUI compatibility
**Scale/Scope**: 13 core components, ~7 existing source files to update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies | Status | Notes |
|-----------|---------|--------|-------|
| I. Human-in-the-Loop | No | N/A | UI library setup, no agent/QC data involvement |
| II. Layered Architecture | No | N/A | Frontend-only, no backend changes |
| III. Security by Default | Yes | ✅ PASS | No user input handling in setup; components use Radix primitives with built-in accessibility |
| IV. Test-First Development | No | N/A | Frontend testing recommended but not mandated |

**Technology Constraints Check**:
- ✅ React + TypeScript 18.x (approved)
- ✅ Vite latest (approved)
- ✅ Tailwind CSS 3.x (approved)
- ✅ shadcn/ui - UI library addition (established, actively maintained)

**Dependency Justification**:
| Dependency | Justification |
|------------|---------------|
| shadcn/ui CLI | Official installation/management tool |
| @radix-ui/* | Underlying accessible primitives (peer deps) |
| clsx | Conditional className utility (industry standard) |
| tailwind-merge | Merge Tailwind classes without conflicts |
| class-variance-authority | Variant management for components |
| lucide-react | Icon library (shadcn default) |

## Project Structure

### Documentation (this feature)

```text
specs/003-shadcn-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - tooling setup)
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A for tooling setup
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── components/
│   │   └── ui/              # NEW: shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── badge.tsx
│   │       ├── alert.tsx
│   │       ├── skeleton.tsx
│   │       └── sonner.tsx
│   ├── lib/
│   │   └── utils.ts         # NEW: cn() utility function
│   ├── styles/
│   │   ├── design-tokens.css # EXISTING: oklch design tokens
│   │   └── globals.css      # MODIFY: Import shadcn base styles
│   ├── pages/
│   │   └── ApprovalQueue.tsx # EXISTING: Will use new components
│   └── ...
├── components.json          # NEW: shadcn/ui configuration
├── tailwind.config.js       # MODIFY: Add shadcn theme extension
├── tsconfig.json            # MODIFY: Add path aliases
├── vite.config.ts           # MODIFY: Add path aliases
└── package.json             # MODIFY: Add dependencies
```

**Structure Decision**: Web application structure. Changes are isolated to `web/` directory. No backend modifications required.

## Complexity Tracking

> No constitution violations. Standard UI library integration.

| Item | Complexity | Justification |
|------|------------|---------------|
| Path aliases | Low | Standard Vite/TS configuration |
| shadcn init | Low | CLI-driven setup |
| Theme integration | Medium | Aligning oklch tokens with shadcn CSS vars |
| Component addition | Low | CLI-driven, copy-paste model |
| HeadlessUI coexistence | Low | Different namespaces, no conflicts |

## Implementation Phases

### Phase 0: Prerequisites & Configuration

1. Install `@types/node` for Vite config path resolution
2. Configure path aliases in `tsconfig.json` (`@/*` → `src/*`)
3. Configure path aliases in `vite.config.ts`
4. Run `npx shadcn@latest init` to generate `components.json`

### Phase 1: Core Setup

1. Add `cn()` utility to `src/lib/utils.ts`
2. Create `src/components/ui/` directory
3. Integrate design tokens into shadcn theming (CSS custom properties)
4. Update `tailwind.config.js` with shadcn plugin configuration

### Phase 2: Component Installation

Add core components via CLI:
```bash
npx shadcn@latest add button card dialog form input label select table tabs badge alert skeleton sonner
```

### Phase 3: Verification

1. Run dev server and verify no errors
2. Build for production and verify success
3. Verify bundle size impact
4. Test component imports in existing pages
