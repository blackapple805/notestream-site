# NoteStream

**An archive that reasons.** A private notes library for the way you actually think — voice memos at 6 a.m., a half-formed argument in the margin of a PDF, the meeting you'd rather not transcribe by hand. NoteStream keeps your notes in their original form, then lets a model read across all of them whenever you ask a question.

🔗 **Live:** [notestream.dev](https://www.notestream.dev/)

> Capture is the easy part. The trick is what happens after — when a year of half-thoughts needs to behave like a single mind.

## What it does

NoteStream was built to fix three things most notes apps get wrong:

- **Capture without recall** — most apps optimize for storage and forget the point of writing things down is reading them back. NoteStream is built around retrieval: ask a question, get an answer drawn from everything you've kept.
- **You become the librarian** — folders, tags, backlinks, daily notes. The "second brain" methodology asks you to do a librarian's job on top of your real one. NoteStream does that work in the background — transcribes, tags, and files automatically.
- **Untrustworthy AI** — an answer that can't be traced to a specific note is a risk, not a feature. NoteStream's answers **cite the exact passages they came from, with timestamps**. If you didn't write it, the model doesn't pretend you did.

## Features

- **Voice capture** — hold, speak, release. Audio is transcribed, cleaned by the model (fillers removed), auto-tagged, and filed — without opening another app. Tasks are extracted automatically.
- **Cited AI answers** — ask across your whole library; every answer links back to the source notes and timestamps.
- **Multi-format ingest** — voice memos, PDFs, and text notes read together as one corpus.
- **Auth + persistence** — accounts and stored notes via Supabase.
- **AI fallback layer** — graceful degradation when the primary model path is unavailable.
- **Dark / light mode**, responsive mobile navigation, and an editorial-publication UI.
- **Free 14-day pro trial**, no card required.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React + Vite |
| Styling | Tailwind CSS |
| Backend / Auth | Supabase |
| AI | LLM integration with a fallback provider layer |
| Hosting | Vercel |

## Running locally

```bash
npm install
cp .env.example .env     # add your Supabase + AI keys
npm run dev
```

Open the local URL Vite prints (default `http://localhost:5173`).

## Status

Live in production at [notestream.dev](https://www.notestream.dev/) with continuous deployment via Vercel. See `CHANGES.md`, `FIXES.md`, and `CLEANUP_CHANGES.md` for the engineering log — dependency cleanup, code splitting, Supabase guards, and the Phosphor icon migration.

---

Built by Eric Del Angel.
