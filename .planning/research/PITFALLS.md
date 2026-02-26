# Pitfalls Research

**Domain:** Mobile offline-first PWA with custom sync engine, form data entry, and voice input
**Researched:** 2026-02-26
**Confidence:** MEDIUM-HIGH

---

## Critical Pitfalls

### Pitfall 1: iOS 7-Day Cache Eviction

**What goes wrong:**
Users who don't open your PWA for 7 days lose ALL cached data. Apple clears service worker caches, IndexedDB, and all offline storage after 7 days of inactivity. Factory workers who use the app sporadically will return to a blank slate, unable to work offline.

**Why it happens:**
Apple's WebKit engine has aggressive storage cleanup policies. This is documented behavior, not a bug. The 7-day eviction is intentional to preserve device storage and cannot be disabled.

**How to avoid:**
- Re-cache critical assets on EVERY app launch, not just during service worker install
- Use `navigator.storage.estimate()` to monitor usage and warn users
- Store essential form templates in Convex (server-side) with cache headers for rapid reload
- Implement a "prefetch for offline" button that users can tap before going to areas with poor connectivity
- Design the app shell to cache aggressively: HTML, CSS, JS bundles, and form schemas

**Warning signs:**
- Users report "app stopped working offline after a few days"
- Service worker shows cache miss on patterns that were previously cached
- Form templates are missing when device has been dormant

**Phase to address:** Phase 1 (Foundation) — service worker caching strategy must account for this from day one

**Sources:**
- https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide (HIGH confidence - official iOS behavior documentation)
- https://rxdb.info/downsides-of-offline-first.html (HIGH confidence - detailed analysis of storage persistence)

---

### Pitfall 2: Sync Queue Race Conditions

**What goes wrong:**
Users create a form submission, immediately edit it, then go offline. The sync queue processes both operations, but in the wrong order. The create happens after the update, causing data corruption or server errors. Or duplicate requests fire due to impatient users clicking "retry" during sync.

**Why it happens:**
Custom sync engines often lack proper deduplication and ordering logic. The `inFlightRequests` pattern is frequently omitted. When network is flaky, multiple sync triggers can fire simultaneously.

**How to avoid:**
```typescript
// Track operations in flight to prevent duplicates
const inFlightRequests = new Set<string>();

// Generate unique key per operation
const requestKey = `${item.operation}_${item.endpoint}_${item.recordId}`;

if (inFlightRequests.has(requestKey)) {
  return; // Skip, already processing
}

inFlightRequests.add(requestKey);
try {
  // Process sync...
} finally {
  inFlightRequests.delete(requestKey);
}
```
- Group queue items by unique keys and only process the most recent per record
- Use exponential backoff for retries (3 attempts max)
- Store timestamps and sort by `timestamp DESC` before processing
- Implement idempotent server endpoints (POST with idempotency keys or PUT with version checks)

**Warning signs:**
- Same form submission appears multiple times in the dashboard
- "404 Not Found" errors when updating recently-created records
- Users report "my edits disappeared"
- Server logs show duplicate requests with identical payloads

**Phase to address:** Phase 1 (Foundation) — sync queue architecture must be designed with deduplication from the start

**Sources:**
- https://dev.to/daliskafroyan/builing-an-offline-first-app-with-build-from-scratch-sync-engine-4a5e (HIGH confidence - real-world case study)
- https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite (HIGH confidence - sync patterns documentation)

---

### Pitfall 3: IndexedDB Transaction Silent Failures

**What goes wrong:**
IndexedDB transactions fail silently when aborted. Your code writes to the database, but due to quota exceeded, schema version mismatch, or concurrent transaction conflicts, the data never persists. The UI shows success, but data is lost.

**Why it happens:**
IndexedDB uses a callback-based API where errors in transactions don't throw. The transaction continues but aborts, and writes are discarded. Dexie.js helps but doesn't eliminate this entirely—developers must still handle `onerror` and check transaction completion.

**How to avoid:**
- Always use Dexie.js transactions (not raw IndexedDB) for atomic multi-table operations
- Wrap all database writes in try-catch and check transaction completion:
```typescript
try {
  await db.transaction('rw', db.forms, db.syncQueue, async () => {
    // All writes here are atomic
    await db.forms.add(formData);
    await db.syncQueue.add(syncItem);
  });
  // Transaction committed successfully
} catch (error) {
  // Transaction aborted - data NOT written
  console.error('Transaction failed:', error);
  // Show user error, don't assume success
}
```
- Monitor storage quota before large operations
- Test with Chrome DevTools "Storage" tab to simulate quota exceeded

**Warning signs:**
- Form data appears to save but disappears on page refresh
- "QuotaExceededError" in browser console (intermittent)
- Sync queue is empty but UI shows items pending
- Data loss happens more on iOS than Android (stricter quotas)

**Phase to address:** Phase 1 (Foundation) — database layer must have proper error handling before any UI is built

**Sources:**
- https://javascript.plainenglish.io/my-pwa-kept-breaking-offline-until-i-discovered-dexie-js-1bf8d30681ef (HIGH confidence - discusses IndexedDB pitfalls)
- Dexie.js Context7 documentation (HIGH confidence - transaction patterns)

---

### Pitfall 4: Voice Input Without Offline Fallback

**What goes wrong:**
Workers rely on voice input for form filling. They go offline, try to dictate, and nothing happens. No error, no feedback—just dead silence. They don't realize voice is online-only until they've wasted time speaking.

**Why it happens:**
Whisper API via OpenRouter requires network connectivity. The MVP defers offline voice (Whisper WASM) due to memory concerns. But the UI doesn't clearly communicate this limitation to users.

**How to avoid:**
- Detect online status before enabling voice input button
- Show clear indicator: "Voice requires internet connection" when offline
- Provide visible microphone icon with offline state (grayed out with tooltip)
- Consider hybrid approach: queue audio recordings when offline, transcribe when online
- Add on-screen message when voice button is disabled: "Voice input unavailable offline. Type or wait for connection."

**Warning signs:**
- Users report "voice button doesn't work"
- Support tickets from users saying "I spoke but nothing appeared"
- Confusion about when voice is available
- Users waste time trying to use voice while offline

**Phase to address:** Phase 2 (Form Filling) — voice input UX must include offline awareness from day one

**Sources:**
- PROJECT.md requirements (offline voice explicitly deferred, no mitigation documented)
- https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide (network detection patterns)

---

### Pitfall 5: Safari `navigator.onLine` False Positives

**What goes wrong:**
The app thinks it's online because `navigator.onLine === true`, but the device has no actual internet access (WiFi connected but no gateway, captive portal, or network throttling). Sync operations fail silently, queue grows indefinitely, and users don't know their data won't reach the server.

**Why it happens:**
`navigator.onLine` only indicates network interface connection, not actual internet reachability. Safari is particularly unreliable here. The browser can be "online" but unable to reach your servers.

**How to avoid:**
```typescript
// Implement actual connectivity check
async function isActuallyOnline(): Promise<boolean> {
  if (!navigator.onLine) return false;

  try {
    // Fetch a lightweight resource with cache busting
    const response = await fetch('https://your-convex-deployment.healthcheck', {
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Debounced connectivity check
let onlineCheckTimer: NodeJS.Timeout;
const checkConnectivity = debounce(async () => {
  const actuallyOnline = await isActuallyOnline();
  setOnlineStatus(actuallyOnline);
}, 1000);
```
- Ping a lightweight endpoint (Convex health check or CDN asset)
- Cache the result and debounce to avoid hammering the network
- Show sync status in UI with explicit states: "Syncing...", "Offline - data saved locally", "Connected", "Connection issue - retrying"

**Warning signs:**
- Sync queue grows without errors
- Users say "it said synced but data never appeared"
- Works on some networks but not others
- iOS Safari has more issues than Chrome

**Phase to address:** Phase 1 (Foundation) — connectivity detection must be tested against flaky networks

**Sources:**
- https://dev.to/daliskafroyan/builing-an-offline-first-app-with-build-from-scratch-sync-engine-4a5e (MEDIUM confidence - mentions Google ping strategy)
- https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite (HIGH confidence - network state discussion)

---

### Pitfall 6: Conflict Resolution on Multi-Device Edits

**What goes wrong:**
A worker edits a form submission on their phone while offline. A reviewer approves it on the web dashboard. When the phone syncs, the edit overwrites the approval, or vice versa. Data is lost, and neither party knows their changes were discarded.

**Why it happens:**
Custom sync engines often use naive "last-write-wins" based on local timestamps. But device clocks are unreliable, and there's no awareness of server-side changes that occurred while offline.

**How to avoid:**
- Use server-side timestamps for conflict resolution (Convex `_creationTime`)
- Implement version vectors or incremental version counters
- For critical fields (approval status), use server-side mutation that cannot be overridden by client sync
- Show conflict UI when detected: "This form was modified by another user. Your changes: [diff]. Their changes: [diff]. Keep which version?"
- Consider append-only pattern for audit trails instead of mutable documents

**Warning signs:**
- "I approved this but it went back to pending"
- Discrepancies between mobile and web views
- Data loss that users can't explain
- Audit logs show jumps in state

**Phase to address:** Phase 2 (Form Filling) / Phase 3 (Review Workflow) — conflict resolution must be designed before review workflow exists

**Sources:**
- https://rxdb.info/downsides-of-offline-first.html (HIGH confidence - conflict resolution strategies)
- https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite (HIGH confidence - conflict patterns)

---

### Pitfall 7: Photo Storage Quota Exhaustion

**What goes wrong:**
Workers capture multiple photos per form submission. After a few days offline, IndexedDB quota is exceeded. New form saves fail silently, and the app becomes unusable. Users lose all their unsaved work.

**Why it happens:**
Photos are large (1-5MB each). iOS Safari has aggressive storage limits (prompt at 50MB increments). IndexedDB doesn't efficiently compress images. Developers test with one or two photos but not real-world usage over days.

**How to avoid:**
- Compress images before storing (use Canvas API or browser-native compression)
- Store thumbnails for UI, full images queued separately
- Implement photo cleanup: after successful sync, optionally remove local copy
- Monitor quota and warn users: "5 photos stored. Sync soon to free space."
- Consider lazy loading: only download photos when user views submission details
- Use Convex file storage for photos, only keep references locally when possible

**Warning signs:**
- "QuotaExceededError" in console after multiple photos
- App stops saving new forms after ~10-20 photos
- iOS shows storage permission prompts frequently
- Performance degrades with many photos in IndexedDB

**Phase to address:** Phase 2 (Form Filling) — photo handling must include quota management from the start

**Sources:**
- https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite (HIGH confidence - storage limits discussion)
- https://rxdb.info/downsides-of-offline-first.html (HIGH confidence - IndexedDB quotas by browser)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `localStorage` for sync queue | Faster to implement | 5-10MB limit, synchronous API blocks UI, data loss on quota exceeded | Never for app data — use IndexedDB |
| Naive timestamp-based conflict resolution | Simple to code | Data races, last writer always wins regardless of context, lost work | Only for truly non-critical data like "last viewed" timestamps |
| Skipping sync queue idempotency | Less code, faster iteration | Duplicate requests, data corruption under flaky networks | Never — this is a critical bug, not a shortcut |
| Hardcoded retry count (3 attempts) | Simple logic | Can't adjust per-user or per-operation type | Acceptable for MVP with monitoring to adjust later |
| Skipping background sync (iOS doesn't support it) | Less code, iOS limitation | Android users get worse experience, data only syncs when app is open | Acceptable IF documented and explained to stakeholders |
| Using client-generated IDs everywhere | No server roundtrip needed | Collisions across devices, harder to debug, sync complexity | Use hybrid: client ID locally, server ID after sync |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Convex + Dexie** | Assuming Convex handles offline storage | Convex has NO offline support. Use Dexie for local-only storage, build custom sync to Convex. This is a custom sync engine project. |
| **Clerk Auth** | Storing auth tokens in IndexedDB without refresh | Store in httpOnly cookie via Clerk, but token may expire offline. Gracefully handle auth errors during sync — queue sync for when auth is valid. |
| **Whisper API (OpenRouter)** | Sending audio directly without queue | Queue audio recordings when offline. Process when online. Show user "Queued for transcription" state. |
| **Vite PWA Plugin** | Assuming `registerSW` handles all updates | Must manually implement `onNeedRefresh` prompt and update flow. Users need to reload to get new service worker. |
| **Dexie.js** | Not using transactions for multi-table writes | Always use `db.transaction('rw', table1, table2, ...)` for atomic writes. Non-transactional writes can partially fail. |
| **iOS Safari** | Assuming background sync works | Background Sync API is NOT supported on iOS. Sync only happens when app is open and visible. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Unbounded sync queue** | App freezes when syncing after days offline | Paginate queue processing, limit to 100 items per batch, show progress | 50+ pending operations |
| **Large IndexedDB reads** | UI hangs when loading form list | Use Dexie queries with offsets, implement virtual scrolling | 1000+ forms stored locally |
| **Photo bloat** | Slow app launch, high memory usage | Compress images, lazy-load photos, clean up after sync | 50+ photos stored locally |
| **Service worker caching everything** | Install fails, quota exceeded | Cache only app shell and critical assets. API responses in separate cache with size limits | Sites with large media libraries |
| **Sync flood on reconnect** | Server throttles, timeout errors | Debounce sync trigger, batch operations, exponential backoff | Coming online after days offline with 100+ changes |
| **LiveQuery reactivity on large datasets** | Dexie live queries fire constantly, UI jank | Narrow query scopes, use distinct queries for different views | Dexie collections with 10,000+ items |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Storing sensitive QC data without encryption** | IndexedDB is readable by device owner. If device is lost/stolen, QC data is exposed. | For MVP: Accept risk (not PHI, just QC forms). For v1.1: Consider device encryption (iOS devices are encrypted by default when passcode enabled). |
| **Trusting client-side validation** | Malicious client bypasses validation, sends invalid data to server | Always validate on Convex backend using schema validation. Client validation is UX only. |
| **Sync endpoint without rate limiting** | Attacker floods sync endpoint with fake data | Implement per-user rate limiting on Convex functions. Use organization-scoping to isolate data. |
| **Exposing organization ID in client code** | Users can guess other org IDs and attempt to access data | Use Clerk auth to enforce organization-scoping on ALL Convex queries. Never rely on client to filter data. |
| **Unrestricted voice input to LLM** | Prompt injection through voice dictation | Sanitize voice input before sending to Agno/LLM. Use structured prompts, limit field extraction to expected patterns. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No sync status visibility** | Users don't know if data is saved, pending, or failed | Always show sync indicator: green checkmark (synced), yellow sync icon (syncing), gray clock (pending), red X (failed) |
| **Silent offline mode** | App works offline but users don't realize — they think it's broken | Show prominent banner when offline: "You're offline. Data will save locally and sync when connection returns." |
| **Form data lost on navigation** | User fills half a form, switches tabs, data is gone | Auto-save to IndexedDB on every field change. Restore draft on return. Show "Draft saved" indicator. |
| **Tiny touch targets on mobile** | Workers with gloves or dirty hands can't tap buttons accurately | Minimum 44x44px touch targets. Generous padding. Test with real devices. |
| **Voice input with no feedback** | User speaks, nothing happens, unsure if recording | Show waveform animation while recording. Playback preview before submit. Clear "Stop recording" button. |
| **Multi-step form without progress** | User doesn't know how much remains | Show step indicator: "Step 3 of 10". Allow saving draft at any point. |
| **No "undo" for voice input** | Voice mishears, user must re-speak entire field | Edit voice output before submitting. "Did we capture this correctly?" confirmation step. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Offline form filling:** Often missing draft auto-save — verify form data persists across page refresh while offline
- [ ] **Sync queue processing:** Often missing progress feedback — verify users see sync progress bar, not just spinner
- [ ] **Conflict resolution:** Often missing user notification — verify conflicts are surfaced to users, not silently resolved
- [ ] **Photo uploads:** Often missing compression — verify photos don't exceed 2MB per image when stored
- [ ] **Voice input:** Often missing online detection — verify voice button is disabled when offline with explanation
- [ ] **Service worker updates:** Often missing user prompt — verify users are notified when new version is available
- [ ] **IndexedDB quota:** Often missing monitoring — verify app warns before storage is full
- [ ] **Multi-device sync:** Often missing version vectors — verify same form edited on two devices shows conflict
- [ ] **Form template changes:** Often missing migration — verify old forms still work when template fields change
- [ ] **Auth expiry offline:** Often missing token refresh — verify offline work syncs after token expires during session

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **7-day cache eviction** | LOW | Re-cache assets on next launch. No data loss if form templates are server-stored. |
| **Sync queue corruption** | MEDIUM | Export queue from IndexedDB, clear queue, manually replay operations through admin interface. May require user to re-enter some data. |
| **IndexedDB transaction failure** | LOW | Retry operation. If quota exceeded, prompt user to clear old data or photos before retry. |
| **Conflict data loss** | HIGH | Implement audit trail log on server. Recover previous version from logs. Build conflict UI to prevent future occurrences. |
| **Service worker bricked** | LOW | Unregister service worker in DevTools, hard refresh page. Re-register with new code. Provide user-facing "Reset app" button as last resort. |
| **Photo storage exhausted** | MEDIUM | Clear local photos after confirming server sync. User may need to re-capture photos if sync failed. Implement cleanup to prevent recurrence. |
| **Voice API key exhausted** | LOW | Switch to backup API key or provider. Queue pending transcriptions. Inform user of delay. |
| **Convex deployment down** | MEDIUM | App works fully offline with local storage. Queue all operations. Resume sync when deployment returns. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| iOS 7-day cache eviction | Phase 1: Foundation | Test: Leave PWA unused for 8 days, open and verify offline works |
| Sync queue race conditions | Phase 1: Foundation | Test: Rapidly create/edit/delete while offline, sync, verify no duplicates |
| IndexedDB silent failures | Phase 1: Foundation | Test: Fill storage to quota, verify errors shown to user, no data loss |
| Voice input without offline fallback | Phase 2: Form Filling | Test: Go offline, tap voice button, verify disabled state shown |
| Safari `navigator.onLine` false positives | Phase 1: Foundation | Test: Connect to WiFi without internet, verify app detects as offline |
| Multi-device conflict resolution | Phase 3: Review Workflow | Test: Edit same form on two devices offline, sync both, verify conflict UI shown |
| Photo storage quota exhaustion | Phase 2: Form Filling | Test: Capture 50 photos offline, verify app warns before quota exceeded |

---

## Sources

| Source | Confidence | Notes |
|--------|------------|-------|
| https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide | HIGH | Authoritative iOS PWA limitations guide, verified 2026 |
| https://rxdb.info/downsides-of-offline-first.html | HIGH | Comprehensive offline-first pitfalls analysis by RxDB author |
| https://dev.to/daliskafroyan/builing-an-offline-first-app-with-build-from-scratch-sync-engine-4a5e | HIGH | Real-world case study of custom sync engine failures and solutions |
| https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite | HIGH | Authoritative 2025 guide on offline-first patterns and challenges |
| https://dexie.org/docs/cloud/consistency | HIGH | Dexie Cloud official documentation on sync consistency patterns |
| https://www.vitepwa.com/guide/periodic-sw-updates.html | HIGH | Vite PWA official docs on service worker update patterns |
| https://www.vitepwa.com/guide/prompt-for-update.html | HIGH | Vite PWA official docs on update prompts |
| PROJECT.md | HIGH | Project-specific context: fixed tech stack, voice input online-only |

---

*Pitfalls research for: Mobile offline-first PWA with custom sync, form data entry, voice input*
*Researched: 2026-02-26*
