# RESONTHECA — Build Plan

## Phase 1: MVP

| # | Step | Status | Commit |
|---|------|--------|--------|
| 1 | Initialise Next.js project with TypeScript | ✅ Done | [STEP 1] |
| 2 | Set up Supabase project — create all core database tables | ⬜ Pending | — |
| 3 | Set up Pinecone index | ⬜ Pending | — |
| 4 | Implement Supabase Auth (email + Google OAuth) | ⬜ Pending | — |
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

### STEP 1 — 2026-06-06
Initialised Next.js 14+ (App Router, TypeScript, Tailwind). Installed all core dependencies: Supabase, Pinecone, Anthropic SDK, OpenAI, Stripe. Created project directory structure (lib, types, components, app routes). Defined all TypeScript types. Set up warm library design tokens in globals.css. Created .env.example with all required variables. Build passes cleanly.
