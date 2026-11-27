# Shared layout components

Global structural HTML partials for the OURANOS website. Vite injects these partials into every public page entry at build time.

- `header.html`: shared header composition and AI assistant drawer.
- `header-overlay.html`: the single canonical Home-style header used by every public page.
- `header-stacked.html`: retained only as a historical reference; it is not used by the site build.
- `sidebar.html`: navigation drilldown opened by the header menu control.
- `footer.html`: shared site footer.

Public page entries reference the shared components with `<!-- OURANOS:HEADER -->` and `<!-- OURANOS:FOOTER -->`. The Vite `sharedLayoutPartials` plugin resolves the same header partial for every public page. The standalone `admin-panel` PDS template remains outside the public website shell. Preserve the PDS component hierarchy and the canonical Home header when extending the site.
