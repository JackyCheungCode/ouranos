import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {
  getComponentChunkLinks,
  getFontLinks,
  getIconLinks,
  getMetaTagsAndIconLinks,
} from '@porsche-design-system/components-react/partials';
import { defineConfig, type Plugin } from 'vite';

function pdsHeadPartials(): Plugin {
  return {
    name: 'pds-head-partials',
    transformIndexHtml(html) {
      const partials = [
        getFontLinks(),
        getIconLinks(),
        getComponentChunkLinks(),
        getMetaTagsAndIconLinks({ appTitle: 'ouranos' }),
      ].join('');

      return html.replace('</head>', `${partials}</head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pdsHeadPartials()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
