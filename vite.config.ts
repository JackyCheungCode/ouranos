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
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

function reactHeadPartials() {
  return {
    name: 'pds-react-head-partials',
    transformIndexHtml(html: string) {
      if (!html.includes('id="root"')) return html;
      const partials = [
        getReactFontLinks(),
        getReactIconLinks(),
        getReactComponentChunkLinks(),
        getReactMetaTagsAndIconLinks({ appTitle: 'ouranos' }),
      ].join('');
      return html.replace('</head>', `${partials}</head>`);
    },
  };
}

function sharedLayoutPartials() {
  return {
    name: 'ouranos-shared-layout-partials',
    transformIndexHtml(html: string) {
      if (!html.includes('<!-- OURANOS:HEADER -->') && !html.includes('<!-- OURANOS:FOOTER -->'))
        return html;

      const readPartial = (name: string) =>
        readFileSync(resolve(rootDir, 'src/components/layout', name), 'utf8');
      const header = readPartial('header.html');
      const topbar = readPartial('topbar.html').replace(
        '<!-- OURANOS:SIDEBAR -->',
        readPartial('sidebar.html'),
      );

      return html
        .replace('<!-- OURANOS:HEADER -->', header.replace('<!-- OURANOS:TOPBAR -->', topbar))
        .replace('<!-- OURANOS:FOOTER -->', readPartial('footer.html'));
    },
  };
}

function templatePartials() {
  return {
    name: 'pds-template-partials',
    transformIndexHtml(html: string, context: { filename: string }) {
      const isHome = context.filename === resolve(rootDir, 'index.html');
      const isAdmin = context.filename.includes('/admin-panel/');
      const isCustomizer = context.filename.includes('/customize/');
      const isDiscover = context.filename.includes('/discover/');
      const isWheels = context.filename.includes('/wheels/');
      const isLeadTime = context.filename.includes('/lead-time/');
      if (!isHome && !isAdmin && !isCustomizer && !isDiscover && !isWheels && !isLeadTime) return html;
      const validChunks = new Set([
        'accordion',
        'ai-tag',
        'banner',
        'button-pure',
        'button-tile',
        'button',
        'canvas',
        'carousel',
        'checkbox',
        'crest',
        'display',
        'divider',
        'drilldown',
        'fieldset',
        'flag',
        'flyout',
        'heading',
        'icon',
        'inline-notification',
        'input-date',
        'input-email',
        'input-month',
        'input-number',
        'input-password',
        'input-search',
        'input-tel',
        'input-text',
        'input-time',
        'input-url',
        'input-week',
        'link-pure',
        'link-tile-product',
        'link-tile',
        'link',
        'modal',
        'model-signature',
        'multi-select',
        'optgroup',
        'pagination',
        'pin-code',
        'popover',
        'radio-group',
        'scroller',
        'segmented-control',
        'select',
        'sheet',
        'spinner',
        'stepper-horizontal',
        'switch',
        'table',
        'tabs-bar',
        'tabs',
        'tag-dismissible',
        'tag',
        'text-list',
        'text',
        'textarea',
        'toast',
        'wordmark',
      ]);
      const components = [
        ...new Set(
          [...html.matchAll(/<p-([a-z0-9-]+)/g)]
            .map((match) => {
              const name = match[1];
              if (name.startsWith('table-')) return 'table';
              if (name === 'select-option') return 'select';
              if (name.startsWith('drilldown-')) return 'drilldown';
              return name;
            })
            .filter((name) => validChunks.has(name)),
        ),
      ];
      const partials = [
        getJsComponentChunkLinks({ components: components as never[] }),
        getJsFontLinks(),
        getJsIconLinks(),
        getJsMetaTagsAndIconLinks({
          appTitle: isHome
            ? 'Ouranos | Home'
            : isCustomizer
              ? 'Ouranos | Wheel Atelier'
              : isDiscover
                ? 'Ouranos | Discover Wheels'
                : isWheels
                  ? 'Ouranos | Wheels'
                  : isLeadTime
                    ? 'Ouranos | Lead Time Estimator'
                    : 'Ouranos Admin Panel',
        }),
      ].join('');
      return html
        .replace('</head>', `${partials}</head>`)
        .replace('</body>', `${getLoaderScript()}</body>`);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sharedLayoutPartials(),
    reactHeadPartials(),
    templatePartials(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        adminPanel: resolve(rootDir, 'admin-panel/index.html'),
        customize: resolve(rootDir, 'customize/index.html'),
        discover: resolve(rootDir, 'discover/index.html'),
        wheels: resolve(rootDir, 'wheels/index.html'),
        leadTime: resolve(rootDir, 'lead-time/index.html'),
      },
    },
  },
});
