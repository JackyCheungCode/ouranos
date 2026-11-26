# Architecture and directory ownership

## Runtime
- React + TypeScript + Vite.
- Cloudflare Worker serves the Vite production build through the Assets binding.
- Application entry: `src/main.tsx`.
- Provider boundary: `src/app/providers.tsx`.

## Dependency direction
- Pages/features may depend on shared components, hooks, services and utilities.
- Shared components may depend on design-system exports and utilities.
- Design-system modules must not depend on business features or pages.
- Services must not import React components.
- Avoid circular dependencies.

## Component ownership
- `primitives`: low-level project-owned building blocks.
- `controls`: reusable interaction/form controls.
- `navigation`: navigation patterns.
- `layout`: Header, Footer and structural shells.
- `feedback`: dialogs, notifications and status feedback.
- `features`: business capabilities, not a dumping ground for pages.

## Imports
- Import PDS tokens through `src/design-system/tokens`.
- Import project components through public barrel exports when introduced.
- Prefer explicit imports; avoid deep imports into another module's implementation.
