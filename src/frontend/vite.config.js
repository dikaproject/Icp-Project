import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'out',
    emptyOutDir: true,
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: [
      '@dfinity/agent', 
      '@dfinity/candid', 
      '@dfinity/principal',
      'buffer',
      'bip39'
    ],
  },
})