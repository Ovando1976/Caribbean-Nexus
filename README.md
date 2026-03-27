<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/742e2388-d398-4939-9278-65bdf473380f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Quality checks

- Type-check the repository:
  - `npm run lint`
- Run unit tests:
  - `npm test`
- Build production bundle:
  - `npm run build`

## Seed starter USVI businesses

1. Ensure Firebase web config is available in `firebase-applet-config.json`.
2. Run:
   - `npm run seed:usvi`
   - `npm run seed:usvi-businesses`
   - `npm run seed:usvi:dry-run` (validation/no-write mode)
3. This upserts records from `data/usvi-seed-businesses.ts` into the `usviBusinesses` collection.

## Firestore indexes

- The project includes `firestore.indexes.json` with starter indexes for:
  - `scores.priorityScore` ordering
  - `pipelineStage` + `scores.priorityScore` combined ordering
- Deploy them with Firebase CLI when promoting to production.

## USVI business intelligence modules

The repository now includes a USVI-focused business intelligence foundation:

- Domain types: `types/business.ts`
- Scoring engine: `lib/scoring.ts`
- Firestore service layer: `lib/firebase/usvi-businesses.ts`
- Dashboard/explorer/detail app-router pages under `app/(dashboard)/...`
