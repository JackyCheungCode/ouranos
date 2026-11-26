# Code quality and verification

## Required local checks
1. `npm ci`
2. `npm run lint`
3. `npm run format:check`
4. `npm run typecheck`
5. `npm run test:unit`
6. `npm run build`
7. `npx playwright install chromium` (first run)
8. `npm run test:e2e`
9. `npm run deploy:dry-run`

## CI
GitHub Actions runs lint, formatting, unit tests, TypeScript checks, production build,
Playwright smoke tests and a Wrangler dry run for pushes and pull requests.

## Scope
The browser smoke tests validate the empty application shell, compiled PDS CSS and font
preload links. They do not create or test website pages.
