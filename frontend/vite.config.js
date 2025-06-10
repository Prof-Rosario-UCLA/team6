import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // serve over HTTPS locally (you'll need certs)
/*    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem'),
    }, */
    proxy: {
      '/api': 'http://localhost:1919',
      '/socket.io': {
        target: 'ws://localhost:1919',
        ws: true
      }
    }
  }
})
