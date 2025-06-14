import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:1919',
      '/socket.io': {
        target: 'ws://localhost:1919',
        ws: true
      }
    }
  }
})