import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind v4 通过 Vite 插件接入，不需要 tailwind.config.js
  plugins: [react(), tailwindcss()],
})
