# Galaxy Ground Redesign Notes

## Applied foundations

- Replaced the cyan/violet glass visual foundation with carbon, warm-white, and ember design tokens in `src/index.css`.
- Added dark and light themes through the existing `next-themes` dependency. Dark remains the default and the selected theme persists under `gg-theme`.
- Removed the animated star field and blur surfaces from the application shell and authentication routes.
- Added accessible, code-owned brand components: `LogoMark`, `Wordmark`, and deterministic `Patch` fallbacks for missing avatars.
- Reworked the application shell into a flat, divider-led layout with a skip link, responsive navigation, and accessible icon labels.
- Converted feed posts from floating, animated glass cards to compact content rows. Existing post, reaction, comment, follow, bookmark, share, and reporting logic is unchanged.
- Restyled authentication and reset-password pages to the new visual system while preserving their form fields, submit behavior, and route contracts.

## Intentional deviations

- The requested Instrument Sans, Fraunces, and JetBrains Mono packages were not added because the local dependency installation is presently locked/incomplete. System fallbacks provide the same UI/display/telemetry roles until a clean `npm ci` can run.
- The full 41-page specification covers every screen. This pass establishes the global system and the highest-traffic shell, authentication, and feed surfaces; remaining page-by-page presentation work must be validated after the project dependency directory is repaired.

## Verification status

- Static audits confirm no remaining `StarField` imports and no active glass/blur implementation in the app shell or auth flow.
- Full `build`, `lint`, `typecheck`, test, and browser route verification remain blocked by a local `node_modules` lock and incomplete native dependency install. See `docs/RUN_THESE.md` for recovery commands.
