import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  devToolbar: { enabled: false },
  server: {
    port: 4323,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
