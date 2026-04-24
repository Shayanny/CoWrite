import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: parseInt(process.env.PORT || '3000'),
    host: true,
    allowedHosts: ['courageous-presence-production.up.railway.app' , 'https://cowrite.up.railway.app']
  }
})
