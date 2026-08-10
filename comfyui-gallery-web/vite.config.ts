import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:19321',
      '/media': 'http://localhost:19321',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
