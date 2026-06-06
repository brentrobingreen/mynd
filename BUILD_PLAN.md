# RESONTHECA — Build Plan

## Phase 1: MVP

| # | Step | Status | Commit |
|---|------|--------|--------|
| 1 | Initialise Next.js project with TypeScript | ✅ Done | [STEP 1] |
| 2 | Set up Supabase project — create all core database tables | ✅ Done | [STEP 2] |
| 3 | Set up Pinecone index | ✅ Done | [STEP 3] |
| 4 | Implement Supabase Auth (email + Google OAuth) | ✅ Done | [STEP 4] |
| 5 | Build Kindle My Clippings.txt parser | ⬜ Pending | — |
| 6 | Build Readwise OAuth integration | ⬜ Pending | — |
| 7 | Build highlight ingestion + embedding pipeline | ⬜ Pending | — |
| 8 | Build library view (book cards + Google Books covers) | ⬜ Pending | — |
| 9 | Build brain chat interface (RAG pipeline, streaming, attribution) | ⬜ Pending | — |
| 10 | Build Stripe free/premium gate | ⬜ Pending | — |
| 11 | Deploy to Vercel | ⬜ Pending | — |

---

## Progress Log

_Updated after each completed step._

### STEP 4 — 2026-06-06
Supabase Auth: email/password + Google OAuth. Login page (unified login/signup with Suspense boundary). Auth callback route exchanges code for session. Sign-out route. Middleware redirects unauthenticated users to /auth/login for protected routes (/library, /brain, /journal, /settings).

### STEP 3 — 2026-06-06
Pinecone client helper (singleton, per-user namespace isolation). One-time index creation script at scripts/setup-pinecone.ts — run `npx tsx scripts/setup-pinecone.ts` after adding .env.local. Serverless index, cosine metric, 1536 dimensions (ada-002).

### STEP 2 — 2026-06-06
Full Supabase schema: users, books, highlights, brains, conversations, messages, journal_entries, daily_digests. Row Level Security on all tables (per-user isolation). Triggers: auto-create user profile on signup, auto-update resonance_score on highlight insert. Supabase client/server helpers + middleware (auth-gated routes). Migration SQL in supabase/migrations/.

### STEP 1 — 2026-06-06
Initialised Next.js 14+ (App Router, TypeScript, Tailwind). Installed all core dependencies: Supabase, Pinecone, Anthropic SDK, OpenAI, Stripe. Created project directory structure (lib, types, components, app routes). Defined all TypeScript types. Set up warm library design tokens in globals.css. Created .env.example with all required variables. Build passes cleanly.
