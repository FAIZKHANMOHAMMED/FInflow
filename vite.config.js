import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy all /api/* requests to the Express backend during development.
    // changeOrigin + cookieDomainRewrite ensure httpOnly cookies set by the
    // Express server (on :5000) are transparently forwarded to the browser
    // as if they came from :5173 (same origin as the Vite dev server).
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
});
