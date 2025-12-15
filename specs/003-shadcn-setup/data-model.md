# Data Model: shadcn/ui Setup

**Feature**: 003-shadcn-setup
**Date**: 2025-12-16
**Status**: Complete

## Overview

This feature is a **tooling/infrastructure setup** rather than a data-driven feature. There are no new database entities, API contracts, or backend changes.

---

## Entities

### Configuration Entities (File-based)

| Entity | Location | Purpose |
|--------|----------|---------|
| `components.json` | `web/` root | shadcn/ui CLI configuration |
| `utils.ts` | `web/src/lib/` | Utility functions (cn helper) |
| `design-tokens.css` | `web/src/styles/` | CSS custom properties (existing) |

### Component Entities

UI components are TypeScript/React files, not data entities:

```text
web/src/components/ui/
├── button.tsx       # Button variants
├── card.tsx         # Card container
├── dialog.tsx       # Modal dialog
├── form.tsx         # Form components
├── input.tsx        # Text input
├── label.tsx        # Form labels
├── select.tsx       # Dropdown select
├── table.tsx        # Data table
├── tabs.tsx         # Tab navigation
├── badge.tsx        # Status badges
├── alert.tsx        # Alert messages
├── skeleton.tsx     # Loading skeleton
└── sonner.tsx       # Toast notifications
```

---

## Configuration Schema

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Path Aliases (tsconfig.json)

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

---

## State Management

No new state management required. Components are stateless UI primitives.

Existing state patterns:
- Supabase Realtime subscriptions (approval queue)
- React useState/useReducer (local component state)
- React Router (navigation state)

---

## Validation Rules

Not applicable - no user data persistence in this feature.

Component props are validated via TypeScript interfaces defined in each component file.

---

## Relationships

```text
┌─────────────────────┐
│   tailwind.config   │
│   (theme extension) │
└──────────┬──────────┘
           │ extends
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  design-tokens.css  │────▶│    globals.css      │
│  (CSS variables)    │     │  (imports tokens)   │
└─────────────────────┘     └──────────┬──────────┘
                                       │ styles
                                       ▼
                            ┌─────────────────────┐
                            │   UI Components     │
                            │  (shadcn/ui files)  │
                            └──────────┬──────────┘
                                       │ uses
                                       ▼
                            ┌─────────────────────┐
                            │   Page Components   │
                            │  (ApprovalQueue)    │
                            └─────────────────────┘
```

---

## Summary

This is a configuration-only feature. All "data" is stored in:
- Configuration files (JSON, TypeScript, CSS)
- Component source files (copy-pasted, owned by project)

No database migrations or API contracts required.
