# Changes — Dependency Cleanup + Phosphor Migration + Code Splitting

## Result

- **Vulnerabilities:** 13 → **0** (`npm audit` clean)
- **Deprecation warnings:** 43 → **0**
- **Total packages:** 647 → **285**
- **Build:** passes (`npm run build`), no chunk size warning
- **Initial JS download (gzip):** ~492 KB → ~200 KB for landing page
- **Bundle structure:** 1 monolithic file → ~45 cache-friendly chunks

## How to apply on your machine

```powershell
cd Y:\projects\notestream-site

# Back up .env first (NOT in this zip — intentional)
copy .env ..\notestream-env-backup.txt

# Unzip OVER existing folder, then:
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
npm run dev
```

PowerShell 5.1 (Windows default) doesn't support `&&` between commands — run each line separately.

---

## Layer 1 — package.json cleanup

**Removed:** `@nextui-org/react` (dead weight, ~360 packages), `@nextui-org/system` (unused), `phosphor-react` (migrated to v2), duplicate `vite` 5.2.0 from dependencies.

**Bumped for security:** `react-router-dom` → `^7.15.1` (CSRF + XSS), `styled-components` → `^6.4.2` (postcss XSS), `postcss` → `^8.5.10` (XSS).

**Added:** `@phosphor-icons/react` `^2.1.10` (replaces phosphor-react).

**Kept:** `react-is` — recharts needs it as an unlisted peer dep. Build fails without it.

## Layer 2 — main.jsx

Removed redundant `<NextUIProvider>` wrapper and duplicate `<ThemeProvider>` nesting.

## Layer 3 — Phosphor migration (37 files)

Migrated every `phosphor-react` import to `@phosphor-icons/react` using v2's new `Icon`-suffix naming convention with aliases so JSX stays unchanged:

```js
// Before
import { Sparkle, Lightning } from "phosphor-react";

// After
import { SparkleIcon as Sparkle, LightningIcon as Lightning } from "@phosphor-icons/react";
```

Fixed two migration-introduced bugs: `Sidebar.jsx` had `List as MenuIcon` (fixed to `ListIcon as MenuIcon`), `DocumentViewer.jsx` had `Image as ImageIcon` (fixed to just `ImageIcon`).

## Layer 4 — Real bugs fixed

**`vite.config.js`** — `__dirname` undefined in ESM. Fixed with `fileURLToPath(import.meta.url)`. Would have broken `npm run dev` if you generated local dev certs.

**`DocumentViewer.jsx`** — Rewrite buttons called `handleRewrite(style)` but no such function existed. Would throw `ReferenceError` on click. Rewired to navigate to the existing `/dashboard/documents/rewrite/:id` page which has a working rewrite flow.

**`NoteView.jsx`** — Three `useState` calls after `if (!note) return null;` violated Rules of Hooks. Moved hooks above the early return with safe optional-chaining defaults.

## Layer 5 — Code splitting (this update)

### Lazy loading in App.jsx

Converted ~30 page imports from eager `import` to `React.lazy(() => import(...))`. Wrapped both `<Routes>` blocks in `<Suspense fallback={<PageLoader isVisible />}>`. 

Kept eager: Home page (Hero, Demo, ProblemSection), Login, Signup, and global components (Navbar, Footer, ScrollToTop, PageLoader) — these are first-paint critical.

### Manual vendor chunks in vite.config.js

Split big third-party libs into their own bundles via `build.rollupOptions.output.manualChunks`:

- `react-vendor` (179 KB raw / 59 KB gzip): react + react-dom + react-router-dom
- `framer-motion` (114 / 38)
- `recharts` (345 / 103) — only loaded by Dashboard, Activity, AiLab
- `supabase` (169 / 45)
- `icons` (302 / 70): phosphor-icons + react-icons

These get cached separately by the browser. When you ship app code changes, users don't re-download these massive libraries.

### Result

Per-page download sizes (gzip):
- Landing page: ~200 KB (was 492 KB)
- Dashboard: +9 KB on top of vendor chunks (was bundled inline)
- AiLab: +12 KB
- Notes: +22 KB
- Settings: +7 KB
- Recharts (345 KB) now only loads when needed, not for every visitor

## NOT done

~110 ESLint warnings remain, mostly false positives from `no-unused-vars` not detecting JSX member usage (`motion` flagged as unused even though `<motion.div>` is everywhere). The real fix is adding `eslint-plugin-react` to `eslint.config.js`. Real unused vars are mixed in and need per-file review.

## Security reminder

Your original `.env` was in the zip you uploaded — excluded from this one. The Supabase anon key ships in your bundle anyway, so the exposure isn't catastrophic, but rotating in Supabase dashboard is good hygiene.
