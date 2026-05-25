# Code Cleanup — Changelog

This pass resolved the safe items from the duplication scan, plus one bug.
Every JS/JSX file under `src/` was syntax-checked with `@babel/parser` after
the changes — all 72 files parse clean. No behavior changes outside of what
is listed below.

## TL;DR

- **2 new shared modules** (`lib/formatDate.js`, `lib/edgeFunctions.js`)
- **5 AI lib files** refactored to use the shared edge-function helper
- **2 components** refactored to use the shared relative-time formatter
- **3 pages** refactored to use the shared `mm:ss` timer formatter
- **2 pages** refactored to use shared local-date (YMD) helpers
- **2 pages** had inline `logActivity` wrappers replaced with the shared
  `logActivityEvent`
- **1 real bug** fixed in `RewriteDocument.jsx` (broken usage-limit call)
- **8 dead files** deleted (~1,030 lines of unreferenced code)
- **1 empty directory** (`src/utils/`) removed
- **Net result**: roughly **1,250 lines of source removed**, ~280 lines of
  new shared library code added → **net ~970 lines smaller**, and the
  duplication of intent is much lower.

Files still on disk under `src/` after the pass: **72 JS/JSX files**
(was 80).

---

## 🟢 New shared modules

### `src/lib/formatDate.js` (new, 79 lines)
Exports:
- `formatRelative(date)` — localized "just now / 5m ago / Mar 14" string,
  with the French branch the existing code already had.
  Replaces character-for-character duplicate definitions in `NoteCard.jsx`
  and `NoteRow.jsx`.
- `formatTimer(seconds)` — `mm:ss` string. Replaces three near-identical
  inline one-liners in `CloudSync.jsx`, `VoiceNotes.jsx`, and `AiLab.jsx`.
- `toLocalYMD(date?)` — local-time `YYYY-MM-DD`.
- `parseYMDToDate(ymd)` — inverse of the above.
- `diffDaysLocal(a, b)` — whole-day difference between two YMD strings.

  The three YMD helpers were duplicated between `Dashboard.jsx`
  (module-scope) and `NoteView.jsx` (nested in the component body — i.e.
  rebuilt on every render).

### `src/lib/edgeFunctions.js` (new, 97 lines)
Exports:
- `getAuthToken()` — `getSession → refreshSession → anon key` fallback chain.
- `callEdgeFunction(endpoint, payload)` — POST JSON to
  `${SUPABASE_URL}/functions/v1/${endpoint}` with the resolved auth token.
  Throws on non-2xx, empty body, or `{ fallback: true }`.

Replaces ~50-line `getAuthToken` + `callEdgeFunction` blocks that were
nearly identical in five files (only the URL and payload shape varied).

---

## 🟢 Lib files refactored to use the shared edge helper

Before/after line counts:

| File                        | Before | After | Δ      |
| --------------------------- | -----: | ----: | -----: |
| `src/lib/noteAI.js`         | 230    | 166   | −64    |
| `src/lib/documentAI.js`     | 232    | 163   | −69    |
| `src/lib/insightAI.js`      | 188    | 119   | −69    |
| `src/lib/voiceAI.js`        | 181    | 125   | −56    |
| `src/lib/writingProfileAI.js` | 285  | 230   | −55    |
| **Total**                   | 1,116  | 803   | **−313** |

Behavior is unchanged: same auth fallback chain, same fetch shape, same
headers, same `{ fallback: true }` interpretation.

---

## 🟢 Components refactored to use shared formatters

- `src/components/NoteCard.jsx` — local `formatRelative` removed, now
  imports from `lib/formatDate`.
- `src/components/NoteRow.jsx` — same.
- `src/pages/CloudSync.jsx` — local `fmtExpiry` removed, single caller
  updated to `formatTimer`.
- `src/pages/VoiceNotes.jsx` — local `fmt` removed, four call sites
  updated to `formatTimer`. (The `fmtRelative` helper in this file was
  **not** touched because it has a different output shape than the
  shared `formatRelative` — see the "Not done" section below.)
- `src/pages/AiLab.jsx` — line-967 `formatTime` aliased to `formatTimer`
  via a one-line `const formatTime = formatTimer;` so the existing call
  site at line 997 didn't need editing. The unrelated `formatTime`
  declarations at lines 1133 and 1181 (clock-time, not duration) were
  intentionally left alone — they're scoped inside the `CloudSyncDemo`
  and `CustomTrainingDemo` sub-components.

---

## 🟢 Pages refactored to use shared YMD helpers

- `src/pages/Dashboard.jsx` — the three module-scope helpers
  (`toLocalYMD`, `parseYMDToDate`, `diffDaysLocal`) removed and replaced
  with named imports from `lib/formatDate`.
- `src/pages/NoteView.jsx` — same three helpers (which had been
  redefined inside the component body, rebuilt every render) removed and
  replaced with imports.

---

## 🟢 Inline `logActivity` wrappers replaced with shared helper

`src/lib/activityEvents.js` already exported `logActivityEvent`; two
pages had inlined a slightly-different wrapper. Both now use the shared
helper.

- `src/pages/RewriteDocument.jsx` — removed the local `logActivity`
  wrapper and the unused `EVENTS_TABLE = "activity_events"` constant.
- `src/pages/Summaries.jsx` — same.

---

## 🐛 Bug fix: RewriteDocument usage gate was broken

`src/pages/RewriteDocument.jsx` had:

```js
await consumeAiUsage("insight_queries");
```

Two problems:
1. **Missing `userId`.** `consumeAiUsage(userId, usageType, amount=1)`
   returns early with `{ success: false }` whenever `userId` is falsy.
   That meant the limit check was a no-op — users could rewrite
   documents past their daily AI quota.
2. **Wrong bucket.** `"insight_queries"` is the Insight Explorer bucket;
   document rewrites belong under `"document_synth"`.

Fixed by:
- Calling `getAuthedUser()` first so the userId is in scope.
- Passing `consumeAiUsage(user.id, "document_synth", 1)`.
- Reading `limitReached` from the result and surfacing the user-facing
  error message before doing the (mocked) AI work.

---

## 🗑️ Dead files deleted

Verified to have zero references from the rest of `src/` before deletion:

| Path                                  | Lines | Notes                                                            |
| ------------------------------------- | ----: | ---------------------------------------------------------------- |
| `src/pages/GlassCard.jsx`             | 206   | All real `GlassCard` imports point to `src/components/GlassCard.jsx`. |
| `src/utils/documentActions.js`        | 127   | No imports anywhere.                                             |
| `src/utils/smartSummary.js`           | ~72   | Only `documentActions.js` referenced it (itself dead).           |
| `src/utils/styleAnalyzer.js`          | ~270  | `useStyleProfile.js` even has a comment saying its imports were removed. |
| `src/components/StatusTag.jsx`        | 76    | No imports.                                                      |
| `src/components/ActionButtons.jsx`    | ~30   | No imports.                                                      |
| `src/components/AnimatedButton.jsx`   | ~95   | No imports.                                                      |
| `src/components/UsageLimitModal.jsx`  | ~155  | No imports. Usage gating is done via `consumeAiUsage` return values, not a modal — see open question below. |
| **Total**                             | **~1,031** | |

`src/utils/` was emptied by the deletions and the directory itself was
removed.

---

## ⏳ Not done in this pass (deferred for design decisions)

These items were flagged in the scan but **intentionally not touched**
because they need your input:

1. **`"NoteStreams Table"` mystery.** `Signup.jsx:148` inserts a single
   row containing only a `user_id` into a table whose name literally
   contains a space character. That table is also in your DB schema and
   appears to do nothing else. Either rename the table (e.g.
   `note_streams`) and find out what it was meant for, or drop the table
   + the insert. The insert currently only logs `console.warn` on
   failure, so it's a silent dependency.

2. **`getAuthedUser` variants.** Several pages each have their own copy.
   The shapes differ in a load-bearing way — `Notes.jsx` calls
   `navigate("/login")` on missing user, others silently return `null`.
   Unifying them is straightforward (`getCurrentUser({ redirectOnMissing })`),
   but it changes user-visible navigation behavior, which is your call.

3. **Two ways to bump daily AI usage.** `consumeAiUsage` from
   `lib/usage.js` calls the `increment_usage` RPC and dispatches a
   global `CustomEvent`; `useSubscription.incrementUsage` calls the
   same RPC and updates the hook's local `usage` state. Pages currently
   pick one or the other, somewhat at random. Architectural decision:
   pick one as canonical and remove the other, or document when to use
   each.

4. **Modal scaffolding.** Five pages (`Notes`, `Dashboard`, `AiLab`,
   `Documents`, `CustomTraining`) each define their own `ModalOverlay`
   / `ModalShell` / `ModalHead` components. The shapes are similar but
   the animation timing, z-index, padding, and mobile sheet vs.
   centered behavior all differ — they look intentionally different.
   Worth a unified `<ModalShell>` IF you want them to behave/animate
   identically; otherwise leave alone.

5. **Time-ago formatters with different output shapes.**
   `Activity.jsx`, `TeamCollaboration.jsx`, `CloudSync.jsx`,
   `VoiceNotes.jsx` (`fmtRelative`), and `Dashboard.jsx` each have
   relative-time formatters with **different output shapes** ("Just
   now" vs. "Xm ago" vs. "X minutes ago", date fallback vs. no date,
   etc.). Cannot be reduced to one without a small config object, e.g.
   `formatRelativeTime(date, { style: 'short' | 'long' | 'compact' })`.
   I left them alone in this pass because the choice of which style
   becomes the new default is a UI decision.

6. **`safeJsonParse` vs `safeJson`.** Same idea (try/catch around
   `JSON.parse`) but different fallback defaults (`null` vs `{}`). The
   defaults are load-bearing for their callers. Flag only.

7. **`nowIso` in `DocumentViewer.jsx`.** Wraps `new Date().toISOString()`.
   About 14 other places call that directly. Either everyone uses
   `nowIso` or `DocumentViewer` drops it — tiny, not in scope here.

8. **Clock-time `formatTime` in `AiLab.jsx`'s two demo sub-components.**
   Lines 1134 and 1182 each define the same one-liner. They're clock
   time, not durations, so they don't belong in `formatTimer`. Could
   be moved to a new `formatClockTime` in `lib/formatDate.js` if you'd
   like everything centralized. Low priority.

---

## Verification

- All 16 directly-edited files were parsed with `@babel/parser` (JSX
  plugin enabled) — no syntax errors.
- The entire `src/` tree (72 files after deletions) was parse-checked —
  no syntax errors.
- No references to any of the 8 deleted files remain anywhere in `src/`.

## Re-applying these changes if you'd rather pull them by hand

If you want to apply only a subset of these changes manually, the
self-contained ones are:

- Add `src/lib/formatDate.js` and `src/lib/edgeFunctions.js`.
- Swap each AI lib's top section (everything from `import { supabase }`
  through the end of the local `callEdgeFunction`) for
  `import { callEdgeFunction } from "./edgeFunctions";`, then update
  the call sites to `callEdgeFunction("<endpoint>", payload)`.
- Replace local `formatRelative` and `mm:ss formatTime` definitions
  with imports.
- Delete the eight dead files listed above (verify they have no
  imports first — `grep -rn "from \"...your-path\"" src/`).
- For the `RewriteDocument` bug, you only need to change the
  `consumeAiUsage` line to pass `user.id` first and `"document_synth"`
  instead of `"insight_queries"`.
