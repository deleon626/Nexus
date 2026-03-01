# Phase 7: Fix Voice Input, OrgId & Template Sync - Research

**Researched:** 2026-03-01
**Domain:** Bug fixes - Convex API patterns, auth state, offline sync
**Confidence:** HIGH

## Summary

This phase closes three distinct bugs identified in the v1.0 milestone audit. All are integration bugs (not missing features) where implementations exist but have incorrect wiring. The fixes are surgical and well-scoped.

1. **Voice input (FILL-03):** Two breaks - `isOnline` double-unwrap in FormFiller.tsx and wrong Convex API call pattern in useVoiceInput.ts
2. **OrgId (AUTH-03):** builder.tsx reads `user?.orgId` but `useAuth()` returns `AuthState` directly (which has `orgId` at top level, not nested under `user`)
3. **Template sync (OFFL-01):** FormList reads only from Dexie but no mechanism syncs published templates from Convex to Dexie for workers on separate devices

**Primary recommendation:** Fix each bug independently as separate plan tasks. All are small, isolated changes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILL-03 | Worker can fill forms using voice input (online-only via Whisper API + Agno LLM) | Fix isOnline double-unwrap + fix Convex mutation call pattern |
| AUTH-03 | Organization data is isolated per tenant | Fix orgId access pattern in builder.tsx (use `useAuth().orgId` directly) |
| OFFL-01 | User can fill forms offline with data cached locally | Add Convex-to-Dexie template sync so workers see published forms |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex/react | installed | Convex React client | Already used throughout |
| dexie | installed | IndexedDB wrapper | Already used for offline cache |
| openai | installed | Whisper API | Already in convex/voice.ts |

No new dependencies needed. All fixes use existing libraries.

## Architecture Patterns

### Pattern 1: Convex Mutation Call (correct pattern)
**What:** The project uses ConvexReactClient. To call mutations outside React components, use the client's `.mutation()` method.
**Current bug:** `convex.api.voice.transcribeAudio(audioBase64, language)` - ConvexReactClient has no `.api` property
**Fix:**
```typescript
// In useVoiceInput.ts
import { api } from '@convex/_generated/api';
import { convex } from '@/lib/convex';

// Wrong:
const result = await convex.api.voice.transcribeAudio(audioBase64, language);

// Right:
const result = await convex.mutation(api.voice.transcribeAudio, {
  audioData: audioBase64,
  language,
});
```

### Pattern 2: AuthState Access
**What:** `useAuth()` returns `AuthState` with `orgId` at top level, not nested under a `user` object.
**Current bug:** `const { user } = useAuth(); const orgId = user?.orgId || 'default';`
**Fix:**
```typescript
// Wrong:
const { user } = useAuth();
const orgId = user?.orgId || 'default';

// Right:
const { orgId } = useAuth();
// orgId is already string | null from AuthState
```

### Pattern 3: Boolean Destructuring
**What:** `useOnline()` returns `{ isOnline: boolean }`. Destructuring gives a boolean.
**Current bug:** `const { isOnline } = useOnline();` then passing `isOnline.isOnline` (undefined on boolean)
**Fix:** Pass `isOnline` directly (it's already a boolean after destructuring).

### Pattern 4: Convex-to-Dexie Template Sync
**What:** Workers need published templates in Dexie for offline access. Currently no sync exists.
**Recommended approach:**
```typescript
// useTemplateSync.ts - runs on FormFillingPage mount when online
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { db } from '@/db/dexie';

export function useTemplateSync() {
  const { isOnline } = useOnline();
  // Query published templates from Convex (reactive)
  const published = useQuery(
    api.formTemplates.listPublishedTemplates,
    isOnline ? {} : 'skip'
  );

  useEffect(() => {
    if (!published) return;
    // Upsert into Dexie
    db.templates.bulkPut(
      published.map(t => ({
        id: t._id,
        name: t.name,
        fields: t.fields,
        version: t.version,
        orgId: t.orgId,
        published: true,
        updatedAt: t.updatedAt,
        createdAt: t.createdAt,
      }))
    );
  }, [published]);
}
```

### Anti-Patterns to Avoid
- **Double property access on primitives:** Always verify what a hook returns before chaining `.property` on it
- **Accessing Convex API directly on client:** Use `client.mutation(api.module.fn, args)` pattern, not `client.api.module.fn(args)`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template sync | Custom polling/fetch | Convex `useQuery` reactive subscription | Already reactive, auto-updates when data changes |
| Dexie bulk upsert | Manual loop with put | `db.templates.bulkPut()` | Handles upsert semantics natively |

## Common Pitfalls

### Pitfall 1: Convex useQuery returns undefined initially
**What goes wrong:** Using query result before it loads causes crashes
**How to avoid:** Always check `if (!data) return;` before processing useQuery results

### Pitfall 2: Convex action vs mutation for external API calls
**What goes wrong:** `voice.ts` uses `mutation` for OpenAI API call. Mutations should not make external HTTP calls (they are transactional). Should be an `action`.
**How to avoid:** Change `convex/voice.ts` from `mutation` to `action` - actions are designed for external API calls.
**Note:** This is an existing design issue. The mutation may work but is semantically wrong and could timeout under Convex's mutation time limits.

### Pitfall 3: listPublishedTemplates may not exist
**What goes wrong:** The audit says it exists but verify before assuming
**How to avoid:** Check `convex/formTemplates.ts` for the actual query name

### Pitfall 4: Dexie schema mismatch with Convex data
**What goes wrong:** Convex uses `_id` (Id type), Dexie uses `id` (string)
**How to avoid:** Map `_id` to `id` (string) when syncing from Convex to Dexie

## Code Examples

### Fix 1: useVoiceInput.ts - Correct Convex call
```typescript
// Import the generated API
import { api } from '../../convex/_generated/api';

// In stopRecording, replace line 214:
const result = await convex.mutation(api.voice.transcribeAudio, {
  audioData: audioBase64,
  language,
});
```

### Fix 2: builder.tsx - Correct orgId access
```typescript
// Replace lines 37-38:
const { orgId: authOrgId } = useAuth();
const orgId = authOrgId || 'default';
```

### Fix 3: FormFiller.tsx - Fix isOnline pass-through
```typescript
// Find where isOnline.isOnline is passed and change to just isOnline
// The destructured value is already a boolean
```

## Open Questions

1. **Does `listPublishedTemplates` query exist in `convex/formTemplates.ts`?**
   - What we know: Audit references it. Need to verify exact function name.
   - Recommendation: Check file, create if missing.

2. **Should `convex/voice.ts` be changed from mutation to action?**
   - What we know: External HTTP calls in mutations is anti-pattern in Convex
   - What's unclear: Whether it causes practical issues at current scale
   - Recommendation: Change to action for correctness, but it's not blocking

3. **NAV-SHELL and NAV-ROUTING registration**
   - Already done in REQUIREMENTS.md (lines 46-47 show them checked off)
   - Success criterion 4 is already satisfied

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected - no test files exist |
| Config file | none |
| Quick run command | N/A |
| Full suite command | N/A |
| Estimated runtime | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FILL-03 | Voice records, transcribes, populates field | manual | Browser test with microphone | No |
| AUTH-03 | orgId read correctly from AuthState | unit | Could unit test but no framework | No |
| OFFL-01 | Workers see published templates via Dexie | integration | Requires Convex + Dexie | No |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every task, run `npx tsc --noEmit` for type checking
- **Full suite trigger:** Manual browser verification
- **Estimated feedback latency per task:** ~5 seconds (tsc only)

### Wave 0 Gaps
No test framework exists. Verification will be via TypeScript compilation (`tsc --noEmit`) and manual browser testing. Setting up a test framework is out of scope for this bug-fix phase.

## Sources

### Primary (HIGH confidence)
- Project audit: `.planning/v1.0-MILESTONE-AUDIT.md` - exact bug descriptions with line numbers
- Source files inspected: `useVoiceInput.ts`, `builder.tsx`, `AuthContext.tsx`, `FormList.tsx`, `convex/voice.ts`, `db/sync/worker.ts`

### Secondary (MEDIUM confidence)
- Convex mutation vs action distinction - from Convex documentation patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all bugs in existing code
- Architecture: HIGH - fixes are direct corrections to wrong API patterns
- Pitfalls: HIGH - bugs are clearly identified with line numbers from audit

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable - bug fixes don't expire)
