import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://doitbad.tech',
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'pt-br',
        locales: { 'pt-br': 'pt-BR', en: 'en', es: 'es', de: 'de' },
      },
      filter: (page) => !page.endsWith('/404/'),
    }),
  ],
  i18n: {
    defaultLocale: 'pt-br',
    locales: ['pt-br', 'en', 'es', 'de'],
    routing: { prefixDefaultLocale: true },
  },
  vite: { plugins: [tailwindcss()] },
});
