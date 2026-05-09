import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    devSourcemap: true
  },
  server: {
    proxy: {
      // Proxy all /api requests to the backend in development.
      // This makes frontend + backend appear as the same origin to the browser,
      // which allows httpOnly cookies (refresh token) to be set and sent correctly.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
