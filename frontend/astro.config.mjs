import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  integrations: [
    react(),
    tailwind()
  ],
  server: {
    port: 4321,
    host: true, // umożliwia dostęp z innych urządzeń w sieci lokalnej
  },
  build: {
    outDir: './dist',
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
}); 