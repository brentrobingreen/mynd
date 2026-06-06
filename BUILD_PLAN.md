# RESONTHECA — Build Plan

## Phase 1: MVP

| # | Step | Status | Commit |
|---|------|--------|--------|
| 1 | Initialise Next.js project with TypeScript | ✅ Done | [STEP 1] |
| 2 | Set up Supabase project — create all core database tables | ✅ Done | [STEP 2] |
| 3 | Set up Pinecone index | ✅ Done | [STEP 3] |
| 4 | Implement Supabase Auth (email + Google OAuth) | ✅ Done | [STEP 4] |
| 5 | Build Kindle My Clippings.txt parser | ✅ Done | [STEP 5] |
| 6 | Build Readwise OAuth integration | ✅ Done | [STEP 6] |
| 7 | Build highlight ingestion + embedding pipeline | ✅ Done | [STEP 7] |
| 8 | Build library view (book cards + Google Books covers) | ✅ Done | [STEP 8] |
| 9 | Build brain chat interface (RAG pipeline, streaming, attribution) | ✅ Done | [STEP 9] |
| 10 | Build Stripe free/premium gate | ✅ Done | [STEP 10] |
| 11 | Deploy to Vercel | ⬜ Pending | — |

---

## Progress Log

_Updated after each completed step._

### STEP 10 — 2026-06-06
Stripe integration: Stripe client (latest API version), checkout session creation (subscription for monthly, payment for lifetime), webhook handler (checkout.session.completed, subscription.deleted/updated → update subscription_tier in Supabase). Settings page with upgrade cards (Free/Premium/$12.99/Lifetime/$249), Readwise connection status. Free-tier limit enforced in brain chat API (20 queries/month).

### STEP 9 — 2026-06-06
RAG pipeline complete: retrieveRelevantHighlights (embed question → Pinecone query → filter >0.75 score), personalised Claude system prompt with user's highlights, streaming SSE via ReadableStream. Brain chat UI: starter questions, streaming text with loading state, source book tags (warm yellow), collapsible source passages with book/author attribution. Default brain auto-created on first chat.

### STEP 8 — 2026-06-06
Library view: AppNav sidebar (library/brain/journal/settings links + sign out). Book cards with cover image, highlight count, resonance score bar, core-book star. Upload widget (drag-and-drop Kindle file + Readwise sync button). Root redirect / → /library. next.config image domains for Google Books.

### STEP 7 — 2026-06-06
RAG ingestion pipeline: OpenAI ada-002 embeddings in batches of 100. Highlight cleaning before embedding. Pinecone upsert in per-user namespaces with full metadata. Semantic query function with optional book_id filter for brain scoping. POST /api/highlights/embed triggers embedding for all un-embedded highlights up to 500 at a time.

### STEP 6 — 2026-06-06
Readwise integration: token validation, paginated highlight fetch, OAuth redirect flow (GET /api/readwise/connect → Readwise → GET /api/readwise/callback saves token). POST /api/readwise/sync pulls all highlights, groups by book, upserts books + highlights with duplicate prevention. Falls back to Google Books for missing covers.

### STEP 5 — 2026-06-06
Kindle My Clippings.txt parser: handles all entry formats (page, location, date), skips bookmarks/notes, groups by book. API route POST /api/highlights/kindle: uploads file, parses, upserts books (with Google Books cover fetch), inserts highlights skipping duplicates. Google Books helper (cover fetching, HTTPS upgrade, 24h cache).

### STEP 4 — 2026-06-06
Supabase Auth: email/password + Google OAuth. Login page (unified login/signup with Suspense boundary). Auth callback route exchanges code for session. Sign-out route. Middleware redirects unauthenticated users to /auth/login for protected routes (/library, /brain, /journal, /settings).

### STEP 3 — 2026-06-06
Pinecone client helper (singleton, per-user namespace isolation). One-time index creation script at scripts/setup-pinecone.ts — run `npx tsx scripts/setup-pinecone.ts` after adding .env.local. Serverless index, cosine metric, 1536 dimensions (ada-002).

### STEP 2 — 2026-06-06
Full Supabase schema: users, books, highlights, brains, conversations, messages, journal_entries, daily_digests. Row Level Security on all tables (per-user isolation). Triggers: auto-create user profile on signup, auto-update resonance_score on highlight insert. Supabase client/server helpers + middleware (auth-gated routes). Migration SQL in supabase/migrations/.

### STEP 1 — 2026-06-06
Initialised Next.js 14+ (App Router, TypeScript, Tailwind). Installed all core dependencies: Supabase, Pinecone, Anthropic SDK, OpenAI, Stripe. Created project directory structure (lib, types, components, app routes). Defined all TypeScript types. Set up warm library design tokens in globals.css. Created .env.example with all required variables. Build passes cleanly.
