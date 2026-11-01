import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tmurdianto.com',
  // Styles stay in files, never inline, so the page's style-src 'self' holds.
  build: { inlineStylesheets: 'never' },
  // Entries keep the straight apostrophes written in their files, like the page templates.
  markdown: { smartypants: false },
});
