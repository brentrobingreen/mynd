# MYND — Technical Decisions Log

## Decision 1 — Framework: Next.js (App Router) + TypeScript
**Date:** 2026-06-06  
**Decision:** Use Next.js 14+ with App Router and TypeScript.  
**Why:** App Router gives us server components and built-in API routes, reducing infra surface. TypeScript enforces correctness across the RAG pipeline where type safety matters most. Vercel deployment is seamless.  
**Alternatives considered:** Remix (less ecosystem), plain React + Express (more moving parts).

## Decision 2 — Database + Auth: Supabase
**Date:** 2026-06-06  
**Decision:** Use Supabase for PostgreSQL, auth, and file storage.  
**Why:** Single platform covers auth (including Google OAuth), relational data, and file uploads. Avoids running separate auth service. Row Level Security enforces per-user data isolation at the DB layer — critical for a multi-user app handling personal reading data.  
**Alternatives considered:** PlanetScale + Clerk (more vendors), Firebase (NoSQL mismatch for relational highlight data).

## Decision 3 — Vector Database: Pinecone
**Date:** 2026-06-06  
**Decision:** Use Pinecone for vector embeddings, with per-user namespacing.  
**Why:** Managed, scales without ops burden. Namespace filtering means one index handles all users without cross-contamination. Strong Node.js SDK.  
**Alternatives considered:** Supabase pgvector (simpler stack but slower at scale), Weaviate (more ops burden).

## Decision 4 — Embeddings: OpenAI text-embedding-ada-002
**Date:** 2026-06-06  
**Decision:** Use OpenAI text-embedding-ada-002 for generating highlight embeddings.  
**Why:** Industry standard, 1536-dimensional, low cost at ~$0.0001/1K tokens. Highlight corpus is small enough that cost is negligible.  
**Alternatives considered:** Anthropic embeddings (not yet available as standalone), Cohere (another vendor dependency).

## Decision 5 — LLM: Anthropic Claude (claude-sonnet-4-20250514)
**Date:** 2026-06-06  
**Decision:** Use Claude as the synthesis LLM.  
**Why:** Specified in build doc. Claude's long context window and instruction-following quality are ideal for warm, attributed synthesis from retrieved highlights.

## Decision 6 — Styling: Tailwind CSS + custom design tokens
**Date:** 2026-06-06  
**Decision:** Use Tailwind CSS with a custom warm palette (parchment backgrounds, amber/forest-green accents, near-black text).  
**Why:** Fastest path to a polished, consistent UI. Custom tokens encode the "warm library" aesthetic at the system level so every component inherits it.

## Decision 7 — Payments: Stripe
**Date:** 2026-06-06  
**Decision:** Use Stripe Checkout for subscription management.  
**Why:** Specified in build doc. Stripe handles PCI compliance, subscription lifecycle, and webhooks. Checkout offloads payment UI entirely.
