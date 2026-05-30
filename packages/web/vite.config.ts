import path from 'node:path';
import autoprefixer from 'autoprefixer';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@xianxia-rpg/core': path.resolve(__dirname, '../core/index.ts'),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, 'tailwind.config.js') }),
        autoprefixer(),
      ],
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/web'),
    emptyOutDir: true,
  },
});
