# Baseline - 2026-10-20

This baseline was captured before source, migration, or configuration changes for the stabilization work.

| Check | Result | Notes |
| --- | --- | --- |
| `npm install` | Failed | `react-day-picker@8.10.1` requires `date-fns` v2 or v3, while the project requests `date-fns@^4.1.0`. |
| `npm run build` | Passed | Vite production build completed. Browserslist data is stale. |
| `npm run lint` | Failed | Existing `@typescript-eslint/no-explicit-any` violations and a small number of hook/UI lint findings. |
| `npx tsc --noEmit -p tsconfig.app.json` | Failed | Generated Supabase types do not contain schema objects used by the frontend, causing cascading type errors. |
| `npm test` | Passed | 7 files and 15 tests passed. |

## Environment limits

- The supplied project directory has no `.git` metadata. Branch creation and commit-based evidence cannot be performed in this copy.
- Live Supabase access and a dedicated test project were not available during baseline capture. Live-schema, RLS, cron, and Edge Function checks remain explicitly unverified until access is provided.
