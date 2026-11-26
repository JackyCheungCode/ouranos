# Shared layout components

Global structural HTML partials for the Ouranos website. Vite injects these partials into page entries at build time; keep markup and PDS component structure here so pages can reuse the same site chrome.

- `header.html`: shared header composition.
- `topbar.html`: top navigation bar and brand wordmark.
- `sidebar.html`: navigation drilldown/sidebar opened by the header menu control.
- `footer.html`: shared site footer.

Page entries reference the shared components with `<!-- OURANOS:HEADER -->` and `<!-- OURANOS:FOOTER -->`. The Vite `sharedLayoutPartials` plugin resolves the composition. Preserve the original PDS classes and component hierarchy when updating these files.
