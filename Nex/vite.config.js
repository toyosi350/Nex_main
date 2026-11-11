import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev traffic to the API goes through the Vite dev server, so the
    // browser talks same-origin (no CORS) and VITE_API_URL can simply
    // be "/api/v1". Production builds set the deployed API origin.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
