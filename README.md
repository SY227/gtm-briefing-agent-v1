# GTM Briefing Agent v1

A polished, Vercel-ready Next.js product demo for generating competitive intelligence / GTM briefing reports.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Gemini via `@google/genai` (server-side)
- LocalStorage for report history (v1)

## Routes
- `/` marketing homepage
- `/app` interactive dashboard
- `/sample-brief` polished sample report
- `/how-it-works` workflow overview

## Setup
1. Install dependencies
   ```bash
   npm install
   ```
2. Create env file
   ```bash
   cp .env.example .env.local
   ```
3. Add your key in `.env.local`
   ```
   GEMINI_API_KEY=your_key_here
   ```
4. Run development server
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`

## Demo / Fallback behavior
If `GEMINI_API_KEY` is missing, `/api/generate` gracefully returns a polished demo report so the app remains fully demoable.

## Gemini integration notes
- Model: `gemini-2.5-flash-lite`
- Key is read only from `process.env.GEMINI_API_KEY`
- Calls happen server-side in `src/app/api/generate/route.ts`

## Vercel deployment
1. Push repo to GitHub
2. Import to Vercel
3. Add environment variable in Vercel project settings:
   - `GEMINI_API_KEY`
4. Deploy

No database is required for v1. History is client-side localStorage.

## Caveats
- Evidence gathering in v1 prioritizes user-provided URLs and simple public-page fetch.
- The app intentionally avoids brittle scraping of blocked/login-only sources.
- Report output includes confidence and coverage notes to reduce overclaim risk.
