# Environment variables and secrets

## Browser-safe variables
- Only variables intentionally exposed to the browser may use the `VITE_` prefix.
- Keep their names and non-secret example values in `.env.example`.
- Never put credentials, API keys, access tokens or private endpoints in a `VITE_` variable.

## Cloudflare Worker secrets
- Store production credentials with `npx wrangler secret put SECRET_NAME` or the Cloudflare dashboard.
- Do not commit secret values to GitHub, `.env.example`, Wrangler vars, or build logs.
- Wheel Size credentials are server-side only and are represented by the optional `WHEEL_SIZE_API_KEY` Worker binding in the Env type.
- Configure local secrets in an ignored `.dev.vars` file; never commit it.

## Environments
- Use separate development and production credentials.
- Rotate credentials if they are accidentally exposed.
- Review Cloudflare Worker bindings and GitHub build environment variables before enabling integrations.
