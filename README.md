# GTM Briefing Agent v1 (Single-Page Operational Tool)

A Vercel-ready, single-page competitive intelligence memo generator for founders, operators, product marketers, GTM leaders, and analysts.

## Product direction
- One primary route: `/`
- Compact intake form + expandable advanced inputs
- Explicit generation states
- Executive-style memo output (not dashboard cards)
- Date-sensitive evidence handling with freshness audit
- Clear mode labeling: **live**, **sample demo**, or **error fallback**

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

If missing, the app stays operational in explicitly labeled **sample demo** mode.

## Live vs demo vs fallback
- **Live mode**: Gemini + evidence pipeline executed successfully.
- **Demo mode**: key missing; sample memo is shown and clearly labeled.
- **Error fallback**: key exists but generation fails; output is clearly labeled with failure notice.

## Evidence + freshness framework
The backend pipeline:
1. Intake normalization
2. Evidence collection (trusted URLs first, then company/competitor public pages such as `/pricing`, `/product`, `/docs`, `/blog`, `/news`, `/press`)
3. Freshness audit (detected dates + recency status)
4. Synthesis (observed vs inferred separation)
5. Presentation formatting

Freshness logic:
- If no explicit dates are detected, freshness is marked **stale/limited**.
- If freshest evidence is older than 90 days, recency-sensitive claims are constrained.
- "What Changed Recently" and pricing sections are required to include date context or "date not confirmed".

## Route structure
- `/` main operational experience
- `/app`, `/sample-brief`, `/how-it-works` redirect to `/` for a unified single-page product flow

## Deployment (Vercel)
1. Push to GitHub
2. Import into Vercel
3. Add `GEMINI_API_KEY` in project environment variables
4. Deploy

## Known limitations
- v1 uses public page probing, not broad search indexing.
- Some sites do not expose explicit update dates; those claims are marked with low date confidence.
- No database in v1 (intentional for simple deployability).
