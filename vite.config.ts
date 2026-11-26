import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {
  getComponentChunkLinks,
  getFontLinks,
  getIconLinks,
  getMetaTagsAndIconLinks,
} from '@porsche-design-system/components-react/partials';
import { defineConfig } from 'vitest/config';

function pdsHeadPartials() {
  return {
    name: 'pds-head-partials',
    transformIndexHtml(html: string) {
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
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
