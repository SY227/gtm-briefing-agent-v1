# GTM Briefing Agent v1 (Single-Page Operational Tool)

A Vercel-ready, single-page competitive intelligence memo generator for founders, operators, product marketers, GTM leaders, and analysts.

## Product direction
- One primary route: `/`
- Compact intake form + expandable advanced inputs
- Explicit generation states
- Executive-style memo output (not dashboard cards)
- Date-sensitive evidence handling with freshness audit
- Clear mode labeling: **live** or **error fallback** (no synthetic demo report)

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

## Environment variables
Required for live generation:
- `GEMINI_API_KEY`

If missing, the API returns an explicit `error-fallback` memo with clear failure notes (no fake/demo narrative).

## Live vs fallback
- **Live mode**: Gemini + evidence pipeline executed successfully.
- **Error fallback mode**: key missing or generation failed; response is explicit and marked incomplete.

## Evidence + freshness framework
Backend pipeline:
1. Intake normalization
2. Search stage across public web/news feeds
   - Bing Web RSS
   - Bing News RSS
   - Google News RSS
3. Evidence collection
   - trusted URLs first
   - official company/competitor sites (+ practical path probing)
   - search-derived public pages
4. Freshness audit (detected dates + recency status)
5. Synthesis (observed vs inferred separation)
6. Presentation formatting

Freshness logic:
- If no explicit dates are detected, freshness is marked **stale/limited**.
- If freshest evidence is older than 90 days, recency-sensitive claims are constrained.
- "What Changed Recently" and pricing sections include date context or "date not confirmed".

## Route structure
- `/` main operational experience
- `/app`, `/sample-brief`, `/how-it-works` redirect to `/` for a unified single-page product flow

## Deployment (Vercel)
1. Push to GitHub
2. Import into Vercel
3. Add `GEMINI_API_KEY` in project environment variables
4. Deploy

## Known limitations
- Search breadth depends on publicly accessible RSS/search results and site accessibility.
- Some sites do not expose explicit update dates; those claims are marked with low date confidence.
- No database in v1 (intentional for simple deployability).
