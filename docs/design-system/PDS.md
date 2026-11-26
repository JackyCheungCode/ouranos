# Porsche Design System integration

## Baseline
- Package: `@porsche-design-system/components-react`.
- Version pinned to `4.10.1` in `package.json`.
- React integration uses `PorscheDesignSystemProvider` in `src/app/providers.tsx`.
- Required global styles imported once from `src/design-system/styles/index.css`.
- Official PDS Tailwind theme imported after Tailwind CSS.
- Tokens re-exported from `src/design-system/tokens/index.ts`.

## Rules
1. Prefer native PDS components for buttons, inputs, selects, dialogs, navigation primitives and feedback.
2. Do not recreate an existing PDS component with custom HTML/CSS.
3. Customize through documented properties, slots and CSS custom properties.
4. Never override Shadow DOM internals or depend on undocumented selectors.
5. Do not hard-code design-system colors, typography, spacing, radii or breakpoints in feature styles.
6. Add project semantic tokens only when a genuine product requirement is not represented by PDS.
7. Keep PDS global styles imported once; do not import them from individual components.

## Official references
- https://designsystem.porsche.com/v4/
- https://designsystem.porsche.com/v4/developing/react/getting-started/
- https://designsystem.porsche.com/v4/tokens/introduction/
- https://designsystem.porsche.com/v4/stylesheets/introduction/
