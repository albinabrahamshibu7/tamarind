import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // absolute URLs for share previews (WhatsApp ignores relative og:image)
  site: 'https://cafe-tamarind.vercel.app',
  devToolbar: { enabled: false },
  server: {
    port: 4323,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
