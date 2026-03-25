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
1. Input normalization (including typo correction + alias handling for major public companies)
2. Source discovery across public web/news feeds and official company sources
3. Evidence collection with URL deduplication, metadata fallback, and source labeling
4. Freshness audit using RSS dates + page metadata dates + extracted in-page dates
5. Synthesis (observed vs inferred separation, current-news-aware memo grounding)
6. Confidence formatting and memo presentation

## Freshness handling
- Uses explicit dates from RSS pubDate/updated fields, article/page metadata, and common in-page date patterns.
- If newest evidence is older than 90 days, output calls out reduced recency confidence.
- “As of” timestamp and confidence notes are always shown.
- Freshness is evaluated from the newest valid dated signal across all collected sources (not only official pages).

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

## Current-news coverage notes
- News inclusion is strengthened via multiple public feeds (Bing News/Web RSS, Google News RSS, Yahoo Finance headlines when ticker is available).
- Search/news results are deduplicated and ranked by trust, recency, and relevance before page probing.
- If a fetched page blocks content, the system can still use dated RSS metadata as constrained evidence.

## Known limitations
- Public-web search breadth depends on accessible RSS/search feeds and source availability.
- Some pages still do not expose reliable update dates.
- No database in v1 (local history only).
