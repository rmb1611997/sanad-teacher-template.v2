import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Proxies API calls through the dev server's own origin so the browser sees
    // them as same-site requests — required for the SameSite=Lax auth cookie to be
    // sent at all (cross-site fetch/XHR requests never carry a SameSite=Lax cookie).
    // Phase 6: points at backend-v2 (plain PHP) instead of the WordPress backend.
    proxy: {
      '/sanad/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/wp/v2/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})