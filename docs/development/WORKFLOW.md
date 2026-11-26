# Development workflow

1. Inspect the current repository before editing.
2. Confirm whether the request authorizes page or shared-component work.
3. Work in the existing `ouranos` repository and Cloudflare Worker.
4. Keep changes within the requested scope.
5. Run lint, formatting, unit tests, type checks and production build before deployment.
6. Run Playwright smoke tests and Wrangler dry run for infrastructure changes.
7. Do not deploy to production unless explicitly instructed.
8. Record architectural or dependency changes in the relevant documentation.
