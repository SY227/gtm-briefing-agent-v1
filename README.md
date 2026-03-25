# GTM Briefing Agent v1 (Single-Page Intelligence Workflow)

A Vercel-ready, single-page, evidence-aware competitive intelligence workflow for founders, operators, product marketers, GTM leaders, and analysts.

## Product direction
- One primary route: `/`
- Compact intake + run-oriented workflow UI
- Visible multi-stage system run (normalization, discovery, collection, audit, synthesis, formatting)
- Advanced controls are secondary (source governance is available but de-emphasized)
- Executive memo output optimized for internal sharing and screenshots
- Explicit live vs error-fallback behavior
- Freshness and confidence handling kept explicit

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Gemini server-side via `@google/genai`
- Model: `gemini-2.5-flash-lite`

## Setup
```bash
cd ~/Desktop/gtm-briefing-agent-v1
npm install
cp .env.example .env.local
```

Add env var in `.env.local`:
```bash
GEMINI_API_KEY=your_key_here
```

Run locally:
```bash
npm run dev
```
Open `http://localhost:3000`.

## Environment variable
Required for live generation:
- `GEMINI_API_KEY`

If missing, the API returns an explicit `error-fallback` memo (no fake demo narrative).

## Runtime behavior
- **Live mode**: multi-stage backend run succeeds.
- **Error fallback**: generation failed or key missing; report clearly marked incomplete.

## Multi-stage pipeline
1. Input normalization (including typo correction hints)
2. Source discovery (public search + official pages)
3. Evidence collection and source labeling
4. Freshness audit and recency status
5. Synthesis (observed vs inferred separation)
6. Confidence formatting and memo presentation

## Freshness handling
- If explicit dates are not detected, recency-sensitive claims are constrained.
- If newest evidence is older than 90 days, output calls out reduced recency confidence.
- “As of” timestamp and confidence notes are always shown.

## Advanced controls (secondary)
Source governance can be opened from advanced controls:
- source class filters
- forum/blog exclusion
- search depth controls
- weighting controls

## Route structure
- `/` main experience
- `/app`, `/sample-brief`, `/how-it-works` redirect to `/`

## Deployment (Vercel)
1. Push repo to GitHub (optional) or deploy directly via Vercel CLI
2. Add `GEMINI_API_KEY` in project environment variables
3. Deploy

## Known limitations
- Public-web search breadth depends on accessible RSS/search feeds and source availability.
- Some pages do not expose reliable update dates.
- No database in v1 (local history only).
