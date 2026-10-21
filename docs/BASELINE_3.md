# Baseline 3

Recorded: October 22, 2026

Workspace: `C:\dev\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)`

## Required baseline commands

| Command | Baseline result |
| --- | --- |
| `npm ci` | Completed. |
| `npm run secrets:check` | Completed. Previous verified result: passed. |
| `npm run build` | Completed. Previous verified result: passed. |
| `npm test` | Completed. Previous verified result: 7 test files, 15 tests passed. |
| `npx tsc --noEmit -p tsconfig.app.json` | Known failing baseline: pre-existing strict typing errors in Supabase query boundaries. |
| `npm run lint` | Known failing baseline: pre-existing explicit-`any` violations and hook warnings. |

The first combined run on October 22 completed but the local command bridge returned no stdout. The gates are being rerun after the required Git checkpoint with explicit exit-code recording. No secrets are recorded here.
