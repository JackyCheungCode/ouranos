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
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));
const excludedDirectories = new Set(['.git', '.wrangler', 'coverage', 'dist', 'node_modules']);

function discoverHtmlEntries(directory = rootDir, entries: string[] = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name) && !entry.name.startsWith('.')) {
        discoverHtmlEntries(resolve(directory, entry.name), entries);
      }
      continue;
    }

    if (entry.isFile() && entry.name === 'index.html') {
      entries.push(resolve(directory, entry.name));
    }
  }

  return entries;
}

function htmlEntryPoints() {
  return Object.fromEntries(
    discoverHtmlEntries().map((file) => {
      const path = relative(rootDir, file).split(sep).join('/');
      return [path === 'index.html' ? 'main' : path.replace(/\.html$/, ''), file];
    }),
  );
}

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
    transformIndexHtml(html: string, context: { filename: string }) {
      const isAdmin = context.filename.includes(`${sep}admin-panel${sep}`);
      if (isAdmin || html.includes('<!-- OURANOS:NO-SHARED-HEADER -->')) return html;

      // Every public OURANOS page uses the exact Home overlay header.
      // The admin-panel directory is a standalone PDS administration template,
      // not part of the public brand website.
      const readPartial = (name: string) =>
        readFileSync(resolve(rootDir, 'src/components/layout', name), 'utf8');
      const sidebar = readPartial('sidebar.html');
      const pattern = readPartial('header-overlay.html').replace(
        '<!-- OURANOS:SIDEBAR -->',
        sidebar,
      );
      const header = readPartial('header.html').replace('<!-- OURANOS:TOPBAR -->', pattern);

      let transformed = html;
      if (transformed.includes('<!-- OURANOS:HEADER -->')) {
        transformed = transformed.replace('<!-- OURANOS:HEADER -->', header);
      } else if (!transformed.includes('class="ouranos-header"')) {
        transformed = transformed.replace(
          /<body\b[^>]*>/i,
          (openingTag) => `${openingTag}\n${header}`,
        );
      }

      if (transformed.includes('<!-- OURANOS:FOOTER -->')) {
        transformed = transformed.replace('<!-- OURANOS:FOOTER -->', readPartial('footer.html'));
      }

      // The Worker asset dev server does not reliably resolve a module script
      // injected late by an HTML transform. Inline the small shared controller
      // after stripping its CSS import, and add the stylesheet as a normal link.
      if (!transformed.includes('ouranos-header-controller-inline')) {
        const controller = readPartial('header.js').replace(
          /^import ['"]\.\/header\.css['"];?\s*/m,
          '',
        );
        transformed = transformed.replace(
          '</head>',
          '<link rel="stylesheet" href="/src/components/layout/header.css">\n</head>',
        );
        transformed = transformed.replace(
          '</body>',
          `<script id="ouranos-header-controller-inline">\n${controller}\n</script>\n</body>`,
        );
      }
      // Inline the AI controller after the shared markup is present. The Worker
      // asset smoke-test server can serve injected module scripts before their
      // dependencies are ready; a synchronous inline controller avoids that race.
      const aiController = readFileSync(
        resolve(rootDir, 'src/components/ai-assistant.js'),
        'utf8',
      ).replace(/^import ['"]\.\/ai-assistant\.css['"];?\s*/m, '');
      transformed = transformed.replace(
        /<script[^>]+ai-assistant\.js[^>]*><\/script>/g,
        '',
      );
      if (!transformed.includes('ouranos-ai-controller-inline')) {
        transformed = transformed.replace(
          '</head>',
          '<link rel="stylesheet" href="/src/components/ai-assistant.css">\n</head>',
        );
        transformed = transformed.replace(
          '</body>',
          `<script id="ouranos-ai-controller-inline">\n${aiController}\n</script>\n</body>`,
        );
      }
      return transformed;
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
      const isCastWheelCollection = context.filename.includes('/cast-wheel-collection/');
      const isForgedWheels = context.filename.includes('/forged-wheels/');
      const isContact = context.filename.includes('/contact/');
      const isAboutUs = context.filename.includes('/about-us/');
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
      const appTitle = isHome
        ? 'Ouranos | Home'
        : isCustomizer
          ? 'Ouranos | Wheel Atelier'
          : isDiscover
            ? 'Ouranos | Discover Wheels'
            : isForgedWheels
              ? 'OURANOS | Forged Wheels'
              : isCastWheelCollection
                ? 'OURANOS | Cast wheel Collection'
                : isContact
                  ? 'Ouranos | Contact Us'
                  : isAboutUs
                    ? 'OURANOS | About Us — Beyond the Wheel'
                    : isAdmin
                      ? 'Ouranos Admin Panel'
                      : 'Ouranos';
      const partials = [
        getJsComponentChunkLinks({ components: components as never[] }),
        getJsFontLinks(),
        getJsIconLinks(),
        getJsMetaTagsAndIconLinks({ appTitle }),
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
      input: htmlEntryPoints(),
    },
  },
});
