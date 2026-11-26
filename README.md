# ouranos

Modular web application foundation using React, TypeScript, Vite, Cloudflare Workers
and Porsche Design System v4.

## Current scope
This repository currently contains infrastructure and design-system integration only.
No website page, route, Header, Footer, sidebar, navigation or business UI has been
created. The application root intentionally renders no page until explicitly requested.

## Stack
- React 19 + TypeScript
- Vite
- Porsche Design System React components 4.10.1
- Tailwind CSS 4 with the official PDS theme
- Cloudflare Workers Static Assets

## Commands
- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run build`
- `npm run deploy`

## Project rules
Read `docs/development/PAGE_CHANGE_POLICY.md` before making UI changes.
Read `docs/architecture/STRUCTURE.md` for module ownership and dependency direction.
Read `docs/design-system/PDS.md` for PDS integration and styling rules.
