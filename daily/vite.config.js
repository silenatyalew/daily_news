import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: '/daily_news/',
=======
        target: 'daily_news',
>>>>>>> 16c45897b197f850ca1bf6ce34dba2fa2637838c
        changeOrigin: true,
      },
    },
  },
})
