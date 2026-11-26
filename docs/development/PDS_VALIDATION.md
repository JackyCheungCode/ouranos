# Porsche Design System validation

The application imports the PDS global stylesheet once from
`src/design-system/styles/index.css`, wraps the root in
`PorscheDesignSystemProvider`, and injects the official PDS head partials through Vite.

Validation is performed by:
- TypeScript and Vite production build, which verifies package entry points and partial APIs.
- Unit test of the central token re-export boundary.
- Playwright smoke test that checks the compiled stylesheet contains PDS custom properties.
- Playwright smoke test that verifies PDS font preload links are emitted.

No page or shared UI component is part of this validation.
