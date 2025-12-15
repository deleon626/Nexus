# Feature Specification: shadcn/ui Component Library Setup

**Feature Branch**: `003-shadcn-setup`
**Created**: 2025-12-16
**Status**: Draft
**Input**: User description: "Initialize shadcn/ui component library in the web dashboard"

## Context

Following the framework evaluation (spec 002), the decision was made to stay with React + Vite and add shadcn/ui as the primary component library. This spec covers the initialization and setup of shadcn/ui in the existing web dashboard.

### Current Web Stack

- **React 18.2.0** with TypeScript 5.2.2
- **Vite 5.0.0** as bundler
- **Tailwind CSS 3.3.5** for styling
- **HeadlessUI + Heroicons** (existing component libraries)
- **React Router v6** for routing
- **Supabase JS Client** for backend integration

### Why shadcn/ui

- Beautiful, accessible components built on Radix UI primitives
- Full source code ownership (copy-paste, not npm package)
- Tailwind CSS native styling
- TypeScript-first with excellent type inference
- Highly customizable themes
- 55+ production-ready components

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize shadcn/ui in Project (Priority: P1)

As a **developer**, I want shadcn/ui initialized in the web project so that I can start using its components for building the dashboard UI.

**Why this priority**: Foundation setup - all other stories depend on having shadcn/ui properly configured.

**Independent Test**: After initialization, running `npx shadcn@latest add button` successfully adds a Button component to `src/components/ui/`.

**Acceptance Scenarios**:

1. **Given** an existing Vite + React + Tailwind project, **When** shadcn/ui is initialized, **Then** `components.json` exists at project root with correct configuration.
2. **Given** shadcn/ui is initialized, **When** a component is added via CLI, **Then** component files are created in the configured directory.
3. **Given** shadcn/ui is initialized, **When** the dev server runs, **Then** no configuration errors appear and hot reload works.

---

### User Story 2 - Add Core UI Components (Priority: P2)

As a **developer**, I want a set of core UI components available so that I can build common UI patterns without creating them from scratch.

**Why this priority**: These components will be used across the dashboard immediately.

**Independent Test**: Each added component can be imported and rendered without errors.

**Acceptance Scenarios**:

1. **Given** shadcn/ui is initialized, **When** Button component is added, **Then** it can be imported from `@/components/ui/button` and renders correctly.
2. **Given** core components are added, **When** used in ApprovalQueue page, **Then** they integrate with existing Tailwind styles.
3. **Given** Dialog component is added, **When** rendered, **Then** it handles focus management and keyboard navigation correctly (accessibility).

---

### User Story 3 - Configure Theme and Design Tokens (Priority: P3)

As a **designer/developer**, I want the shadcn/ui theme configured to match Nexus brand guidelines so that the UI has a consistent visual identity.

**Why this priority**: Theme customization can be done after core setup; default theme is functional.

**Independent Test**: CSS custom properties are defined in `globals.css` and components render with the configured colors.

**Acceptance Scenarios**:

1. **Given** theme configuration, **When** components render, **Then** they use the defined color palette from design tokens.
2. **Given** dark mode is configured, **When** user toggles theme, **Then** all shadcn components switch to dark variant.
3. **Given** existing design tokens in `styles/design-tokens.css`, **When** shadcn is configured, **Then** it uses compatible oklch color values.

---

### Edge Cases

- What happens if Tailwind CSS version is incompatible with shadcn?
- How do we handle conflicts between HeadlessUI and Radix UI components?
- What if path aliases aren't configured correctly in tsconfig?
- How do we handle existing components that should migrate to shadcn versions?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST initialize shadcn/ui with Vite + React + TypeScript configuration
- **FR-002**: System MUST configure path aliases (`@/` pointing to `src/`) in both tsconfig and vite.config
- **FR-003**: System MUST set up `components.json` with correct paths for components, utils, and styles
- **FR-004**: System MUST add utility function `cn()` for className merging (clsx + tailwind-merge)
- **FR-005**: System MUST configure CSS custom properties for theming in global styles
- **FR-006**: System MUST maintain compatibility with existing HeadlessUI components during transition
- **FR-007**: System MUST support both light and dark themes

### Core Components to Add

Based on Nexus dashboard requirements:

| Component | Use Case |
|-----------|----------|
| Button | Actions, form submissions |
| Card | Content containers, data display |
| Dialog | Confirmation modals, detail views |
| Form | QC data entry forms |
| Input | Text input fields |
| Label | Form field labels |
| Select | Dropdown selections |
| Table | Approval queue, data lists |
| Tabs | Navigation within views |
| Badge | Status indicators |
| Alert | System notifications |
| Skeleton | Loading states |
| Toast (Sonner) | Notifications |

### Key Entities

- **Component**: Individual UI building block (Button, Card, etc.)
- **Theme**: Color palette and design tokens configuration
- **Utils**: Helper functions (cn, formatters)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npx shadcn@latest init` completes without errors
- **SC-002**: All 13 core components added and importable without build errors
- **SC-003**: Dev server (`npm run dev`) starts without warnings related to shadcn
- **SC-004**: Production build (`npm run build`) completes successfully
- **SC-005**: Components pass accessibility checks (keyboard navigation, ARIA attributes)
- **SC-006**: Bundle size increase is under 50KB gzipped for core components
- **SC-007**: Theme customization applied - components render with Nexus color palette

---

## Assumptions

- Tailwind CSS 3.3.5 is compatible with shadcn/ui v4
- Existing HeadlessUI components can coexist with Radix UI during migration
- Design tokens defined in `styles/design-tokens.css` use oklch format compatible with shadcn
- No server-side rendering required (Vite SPA mode)

---

## Dependencies

- **Internal**: Design system (docs/DESIGN_SYSTEM.md), design tokens (styles/design-tokens.css)
- **External**: shadcn/ui CLI, Radix UI primitives, clsx, tailwind-merge

---

## Out of Scope

- Full migration of HeadlessUI components to shadcn (separate task)
- Custom component development beyond shadcn defaults
- Server components / SSR configuration
- Unit test setup for components
