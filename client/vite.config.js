import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = process.env.API_ORIGIN || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': api,
      '/uploads': api,
    },
  },
  preview: { port: 5173 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
});
