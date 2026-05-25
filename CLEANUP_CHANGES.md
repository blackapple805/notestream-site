# Cleanup Changes — Layer 1 + Layer 2

## Result

- **Source files:** 78 → 67 (-11 dead files)
- **Lines deleted:** 2,113 lines of unused code
- **Packages:** 285 → 279 (removed styled-components + transitive deps)
- **Vulnerabilities:** still 0
- **Build:** passes
- **`supabaseReady` declarations:** 10 copies across files → 1 single export

## Apply on your machine

```powershell
cd Y:\projects\notestream-site

# Back up .env (zip doesn't include it)
copy .env ..\notestream-env-backup.txt

# Extract zip OVER existing folder, "Replace all" when prompted

# Wipe and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Verify
npm audit
npm run build
npm run dev
```

## Layer 1 — Dead files deleted

11 files that were imported by zero consumers:

| File | Lines | Why |
|---|---|---|
| `components/ActionButtons.jsx` | 33 | Never imported |
| `components/AnimatedButton.jsx` | 112 | Only `styled-components` usage in the codebase — removed dep too |
| `components/ExportModal.jsx` | 374 | Never imported. Settings.jsx uses `ConfirmModal`, not this |
| `components/StatusTag.jsx` | 76 | Never imported |
| `components/UsageLimitModal.jsx` | 118 | Never imported |
| `components/VoiceRecorder.jsx` | 404 | Never imported. `openVoiceRecorder()` in Notes.jsx is unrelated |
| `pages/GlassCard.jsx` | 205 | Duplicate of `components/GlassCard.jsx`. All 12 consumers use the latter |
| `pages/dashboard/IntegrationSettings.jsx` | 384 | Never imported, never routed |
| `utils/documentActions.js` | 126 | Never imported |
| `utils/styleAnalyzer.js` | 269 | `analyzeWritingStyle()` lives in `lib/writingProfileAI.js`. This is the unused older version |
| `ui/layoutState.js` | 12 | Functions identical to ones in `hooks/useMobileNav.js`. Sidebar import updated; empty `ui/` dir removed |

### Sidebar import update

`src/components/Sidebar.jsx` line 23:
- Before: `import { showMobileNav } from "../ui/layoutState";`
- After: `import { showMobileNav } from "../hooks/useMobileNav";`

### Package.json

Removed `"styled-components": "^6.4.2"` since the only file using it is gone.

## Layer 2 — `supabaseReady` consolidation

Every dashboard page had this same line copy-pasted in 10 different files:

```js
const supabaseReady = typeof isSupabaseConfigured === "function" 
  ? isSupabaseConfigured() 
  : !!isSupabaseConfigured;
```

The `typeof === "function"` check was paranoid leftover (it's been a const boolean for a while). Replaced with a single exported value.

### Added to `lib/supabaseClient.js`

```js
export const supabaseReady = isSupabaseConfigured && !!supabase;
```

### Files updated (10)

Each had its import changed from `{ supabase, isSupabaseConfigured }` to `{ supabase, supabaseReady }`, and the local declaration removed:

- pages/Summaries.jsx
- pages/CloudSync.jsx
- pages/RewriteDocument.jsx
- pages/VoiceNotes.jsx
- pages/Activity.jsx
- pages/Dashboard.jsx
- pages/Notes.jsx
- pages/NoteView.jsx
- hooks/useStyleProfile.js
- lib/noteAI.js

The actual `if (!supabaseReady || !supabase)` usage sites throughout these files were untouched — the variable name and meaning are identical, only the source of the value changed.

## What was NOT touched (intentionally)

- **`getAuthedUser` across 4 files** — looks duplicate but has different behavior in each. `pages/Notes.jsx`'s version redirects to `/login` if no user; the others don't. Unifying would either break Notes' redirect or accidentally add it to other pages.
- **Big page files** (NoteView 1,751 lines, CustomTraining 1,406, etc.) — these aren't duplication, they're just big. Splitting is a separate project.
- **`toLocalYMD` in 2 files** — only 2 occurrences; cheap to leave alone for now.

## Important note on IntegrationSettings.jsx

This was a 384-line orphan. If you had plans to wire up an "Integration Settings" feature later, you'd be rebuilding from scratch — let me know and I can pull it out of git history if needed. Otherwise it's gone.
