# Stabilization Baseline 2 - 2026-10-20

The first parallel baseline attempt was invalid because `npm ci` overlapped with build tooling and hit a Windows file lock on `node_modules/@esbuild/win32-x64/esbuild.exe`. The unit suite completed successfully, but build, lint, and TypeScript checks subsequently encountered the partially installed dependencies.

The clean install is being rerun sequentially before valid baseline results are recorded below.

## Initial attempt

| Command | Result | Notes |
| --- | --- | --- |
| `npm ci` | Blocked | Windows `EPERM` file lock on `esbuild.exe` during parallel execution. |
| `npm run build` | Blocked | Dependency resolution failed after the interrupted install. |
| `npm test` | Passed | 7 files, 15 tests. |
| `npx tsc --noEmit -p tsconfig.app.json` | Blocked | `vitest/globals` was unavailable after the interrupted install. |
| `npm run lint` | Blocked | ESLint installation was incomplete after the interrupted install. |

## Sequential retry

The sequential `npm ci` retry was also blocked by the same locked `esbuild.exe` file. No process was terminated because it may belong to an active developer session. See `docs/RUN_THESE.md` for the exact safe recovery commands.
