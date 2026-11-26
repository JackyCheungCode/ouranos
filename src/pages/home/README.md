# Home page

The public Home page is served at `/` from the root `index.html` entry. Page-specific behavior and styles live here:

- `main.js`
- `style.css`

The page consumes the shared site layout partials from `src/components/layout/`. Keep global header, navigation/sidebar, topbar and footer changes in that shared directory rather than duplicating them here.
