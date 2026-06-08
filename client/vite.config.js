import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Black-Jack/' : '/',
  plugins: [react()],
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
