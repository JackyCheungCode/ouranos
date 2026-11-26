import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {
  getComponentChunkLinks as getReactComponentChunkLinks,
  getFontLinks as getReactFontLinks,
  getIconLinks as getReactIconLinks,
  getMetaTagsAndIconLinks as getReactMetaTagsAndIconLinks,
} from '@porsche-design-system/components-react/partials';
import {
  getComponentChunkLinks as getJsComponentChunkLinks,
  getFontLinks as getJsFontLinks,
  getIconLinks as getJsIconLinks,
  getLoaderScript,
  getMetaTagsAndIconLinks as getJsMetaTagsAndIconLinks,
} from '@porsche-design-system/components-js/partials';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function reactHeadPartials() {
  return {
    name: 'pds-react-head-partials',
    transformIndexHtml(html: string) {
      if (!html.includes('id="root"')) return html;
      const partials = [
        getReactFontLinks(), getReactIconLinks(), getReactComponentChunkLinks(),
        getReactMetaTagsAndIconLinks({ appTitle: 'ouranos' }),
      ].join('');
      return html.replace('</head>', `${partials}</head>`);
    },
  };
}

function templatePartials() {
  return {
    name: 'pds-template-partials',
    transformIndexHtml(html: string, context: { filename: string }) {
      const isLanding = context.filename.includes('/landing-page/');
      const isAdmin = context.filename.includes('/admin-panel/');
      if (!isLanding && !isAdmin) return html;
      const components = [...new Set([...html.matchAll(/<p-([a-z0-9-]+)/g)].map((match) => match[1]))];
      const partials = [
        getJsComponentChunkLinks({ components }), getJsFontLinks(), getJsIconLinks(),
        getJsMetaTagsAndIconLinks({ appTitle: isLanding ? 'Ouranos Landing Page' : 'Ouranos Admin Panel' }),
      ].join('');
      return html.replace('</head>', `${partials}</head>`).replace('</body>', `${getLoaderScript()}</body>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), reactHeadPartials(), templatePartials()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        landingPage: resolve(import.meta.dirname, 'landing-page/index.html'),
        adminPanel: resolve(import.meta.dirname, 'admin-panel/index.html'),
      },
    },
  },
});
