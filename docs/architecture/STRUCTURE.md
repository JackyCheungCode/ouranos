# Architecture and directory ownership

## Runtime
- React + TypeScript + Vite.
- Cloudflare Worker serves the Vite production build through the Assets binding.
- Application entry: `src/main.tsx`.
- Provider boundary: `src/app/providers.tsx`.
- Static public pages are Vite multi-page HTML entries; every `index.html` page is discovered automatically at build time.

## Shared public layout
- `src/components/layout/header.html` is the shared header insertion point.
- `src/components/layout/topbar.html` owns the Header Pattern markup, including the global OURANOS AI entry and PDS Popover language selector.
- `src/components/layout/header.js` owns global navigation behavior and locale preference.
- `src/components/layout/header.css` owns shared Header styling.
- `src/components/layout/sidebar.html` owns the PDS Drilldown navigation content.
- Vite injects the shared Header and AI assistant into every public HTML page by default. The admin panel is excluded.
- The home page receives the Overlay variant; all other public pages receive the Stacked variant.
- A new public page only needs its own `index.html` and page-specific assets. It inherits the shared Header, language preference, navigation and AI assistant automatically.
- To intentionally omit the shared Header on a special public page, add `<!-- OURANOS:NO-SHARED-HEADER -->` before the closing body tag.

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
