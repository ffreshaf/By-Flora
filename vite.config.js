import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



// https://vite.dev/config/
export default defineConfig({
  build: { sourcemap: true },
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Allow access from your local network
    port: 5173        // Optional: force a consistent port
  }
})

