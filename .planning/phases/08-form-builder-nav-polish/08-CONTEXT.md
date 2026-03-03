# Phase 08: Form Builder & Nav Polish - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the form builder canvas fast and self-evident to use, and ensure all users can sign out from mobile without hunting for it. Four specific improvements: inline field label editing, auto-focus on new field add, visible delete on canvas rows, and discoverable mobile sign-out.

</domain>

<decisions>
## Implementation Decisions

### Inline editing interaction
- Double-click a field label to activate edit mode (single-click still selects/opens sidebar)
- Blur or Enter saves the edit; Escape cancels
- Subtle underline style when editing — text looks normal until activated
- Empty labels revert to the previous value (no empty labels allowed)

### Field action placement
- Delete icon (trash) always visible on each canvas row — no hover-to-reveal (important for mobile/touch)
- Delete icon positioned on the far right of the row: [grip] [label] [type] ... [trash]
- No confirmation on delete — instant removal; fields are easy to re-add
- Delete only — no other actions on the canvas row; other settings stay in the sidebar

### Auto-focus + new field flow
- After adding a new field, smooth-scroll to it in the canvas
- New field's label is pre-filled with type name (e.g., "Text Field") and text is selected so typing replaces it
- Brief highlight animation (subtle background flash ~500ms) to draw attention to the new field
- Sidebar also opens/updates for the new field — user can configure settings right after naming

### Mobile sign-out placement
- Keep avatar in top bar but add visible "Sign out" text label next to it
- No confirmation before signing out — immediate sign-out on tap
- Desktop sidebar sign-out stays as-is — only fix mobile
- No user name/email display on mobile — avatar is enough identity context, keep it simple

### Claude's Discretion
- Exact animation timing and easing for highlight flash
- Input focus management edge cases (e.g., rapid adds)
- Delete icon styling and size
- Scroll offset/padding when auto-scrolling to new fields

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SortableField.tsx`: Canvas field row component — needs inline edit state and delete icon added
- `MobileTopBar.tsx`: Already has Clerk `signOut` wired up behind avatar — needs visible label
- `FieldEditor.tsx` / `FieldSidebar.tsx`: Sidebar editing components — already handle field configuration
- `formBuilderStore.ts`: Zustand store — likely has or needs actions for field label updates

### Established Patterns
- Uses `@dnd-kit/sortable` for drag-and-drop — new interactions must not conflict with drag gestures
- Clerk for auth — `useClerk().signOut()` already in place
- Tailwind + shadcn/ui for styling — inline edit should use consistent styling tokens
- Lucide icons throughout — use Lucide `Trash2` or similar for delete icon

### Integration Points
- `SortableField` receives `onSelect` callback — inline edit needs to coexist with selection
- `FormBuilderCanvas.tsx` manages field state and renders `SortableField` list — auto-focus and scroll logic goes here
- `BottomTabBar.tsx` — not affected (sign-out goes in top bar, not bottom tabs)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-form-builder-nav-polish*
*Context gathered: 2026-03-03*
