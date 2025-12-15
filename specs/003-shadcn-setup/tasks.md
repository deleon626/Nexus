# Tasks: shadcn/ui Component Library Setup

**Input**: Design documents from `/specs/003-shadcn-setup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Not requested in specification (frontend testing recommended but not mandated)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration

- [x] T001 Install @types/node dependency via `npm install -D @types/node` in web/
- [x] T002 [P] Configure path aliases in `web/tsconfig.json` with `@/*` → `./src/*`
- [x] T003 [P] Configure path aliases in `web/vite.config.ts` with `@` → `./src` resolution

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shadcn/ui setup that MUST be complete before ANY user story can proceed

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Run `npx shadcn@latest init` in web/ directory and accept default configuration
- [x] T005 Create `web/src/lib/utils.ts` with `cn()` utility function for className merging
- [x] T006 [P] Update `web/src/styles/globals.css` to import design tokens and shadcn base styles
- [x] T007 [P] Update `web/tailwind.config.js` with shadcn theme configuration and CSS variable mappings

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initialize shadcn/ui in Project (Priority: P1) 🎯 MVP

**Goal**: Ensure shadcn/ui is properly initialized with path aliases and configuration so components can be added and used

**Independent Test**: Running `npx shadcn@latest add button` successfully adds a Button component to `web/src/components/ui/button.tsx` without errors

### Implementation for User Story 1

- [x] T008 [P] [US1] Verify `web/components.json` was created with correct paths and configuration
- [x] T009 [P] [US1] Verify path aliases work by checking TypeScript compilation succeeds in web/
- [x] T010 [P] [US1] Verify dev server runs without errors via `npm run dev` in web/
- [x] T011 [US1] Test component addition by running `npx shadcn@latest add button` in web/
- [x] T012 [US1] Verify Button component import works in `web/src/components/ui/button.tsx`
- [x] T013 [US1] Test Button component can be rendered in `web/src/pages/ApprovalQueue.tsx` with import and usage

**Checkpoint**: At this point, shadcn/ui initialization should be complete and components can be added successfully

---

## Phase 4: User Story 2 - Add Core UI Components (Priority: P2)

**Goal**: Add the 13 core UI components needed for the dashboard approval queue and QC data entry interfaces

**Independent Test**: All 13 core components can be imported and rendered without errors in the dev environment

### Implementation for User Story 2

- [x] T014 [P] [US2] Add Card component via `npx shadcn@latest add card` in web/
- [x] T015 [P] [US2] Add Dialog component via `npx shadcn@latest add dialog` in web/
- [x] T016 [P] [US2] Add Form component via `npx shadcn@latest add form` in web/
- [x] T017 [P] [US2] Add Input component via `npx shadcn@latest add input` in web/
- [x] T018 [P] [US2] Add Label component via `npx shadcn@latest add label` in web/
- [x] T019 [P] [US2] Add Select component via `npx shadcn@latest add select` in web/
- [x] T020 [P] [US2] Add Table component via `npx shadcn@latest add table` in web/
- [x] T021 [P] [US2] Add Tabs component via `npx shadcn@latest add tabs` in web/
- [x] T022 [P] [US2] Add Badge component via `npx shadcn@latest add badge` in web/
- [x] T023 [P] [US2] Add Alert component via `npx shadcn@latest add alert` in web/
- [x] T024 [P] [US2] Add Skeleton component via `npx shadcn@latest add skeleton` in web/
- [x] T025 [US2] Add Sonner (toast) component via `npx shadcn@latest add sonner` in web/
- [x] T026 [US2] Verify all 13 components are importable from `web/src/components/ui/*` without errors
- [x] T027 [US2] Create a test file `web/src/components/ui/ComponentShowcase.tsx` demonstrating all core components

**Checkpoint**: At this point, all core components should be available and integrated into the project

---

## Phase 5: User Story 3 - Configure Theme and Design Tokens (Priority: P3)

**Goal**: Configure shadcn/ui theme to use existing design tokens and support dark mode toggle

**Independent Test**: Components render with the configured color palette from design tokens, and dark mode toggle works correctly

### Implementation for User Story 3

- [x] T028 [P] [US3] Update `web/tailwind.config.js` to map all design token CSS variables to Tailwind theme colors
- [x] T029 [P] [US3] Update `web/src/styles/globals.css` to include dark mode class support with `.dark` selector
- [x] T030 [US3] Create a theme toggle component in `web/src/components/ThemeToggle.tsx` that toggles `.dark` class on `<html>`
- [x] T031 [US3] Integrate ThemeToggle into `web/src/App.tsx` for user access
- [x] T032 [US3] Verify components use correct colors in both light and dark modes by visual inspection
- [x] T033 [US3] Test dark mode persistence if using localStorage (store preference in browser storage)

**Checkpoint**: All user stories should now be independently functional with theming support

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, integration, and documentation

- [x] T034 [P] Run `npm run build` in web/ and verify production build succeeds without errors
- [x] T035 [P] Verify bundle size increase is under 50KB gzipped for core components via `npm run build` analysis
- [x] T036 [P] Run `npm run lint` in web/ and verify no ESLint errors or warnings introduced
- [x] T037 Verify ApprovalQueue page can use new components without breaking existing functionality
- [x] T038 Verify HeadlessUI and Radix UI components coexist without conflicts in the running app
- [x] T039 Update `web/README.md` with shadcn/ui component usage examples and customization guide
- [x] T040 Run full quickstart.md validation - follow the 5-minute setup guide to ensure it works end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after User Story 1 - Depends on core components being available
- **User Story 3 (P3)**: Can start after User Story 2 - Depends on theme infrastructure

### Within Each User Story

- Core infrastructure setup before component additions
- Component installations (marked [P]) can run in parallel
- Verification and integration tasks after all components added

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All component additions in User Story 2 marked [P] can run in parallel
- All theme configuration tasks in User Story 3 marked [P] can run in parallel
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 2 (Add Core Components)

```bash
# All component installations can run in parallel:
Task: "Add Card component via npx shadcn@latest add card in web/"
Task: "Add Dialog component via npx shadcn@latest add dialog in web/"
Task: "Add Form component via npx shadcn@latest add form in web/"
... (all 13 component additions can run together)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (initialize shadcn/ui)
4. **STOP and VALIDATE**: Test that Button component works
5. Demo to stakeholders or proceed to User Story 2

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently (shadcn/ui initialized)
3. Add User Story 2 → Test independently (13 core components available)
4. Add User Story 3 → Test independently (theming and dark mode working)
5. Polish and optimization
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (initialize shadcn/ui)
   - Developer B: User Story 2 (add core components)
   - Developer C: User Story 3 (configure theme)
3. Stories can progress in parallel since they touch different aspects

---

## Notes

- [P] tasks = different npm commands or file updates, no dependencies between invocations
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All tasks are npm/CLI-driven (no custom code to write)
- Verify no build/lint errors after each phase
- Commit after each phase or major milestone
- Stop at any checkpoint to validate story independently
