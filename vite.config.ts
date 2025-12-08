import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // WICHTIG für GitHub Pages: Relative Pfade nutzen
  base: './',
  build: {
    outDir: 'dist',
  }
})