import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    proxy: {
      // 127.0.0.1 avoids IPv6 (::1) vs localhost mismatches when the API only binds to IPv4.
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
