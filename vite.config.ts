import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/codegen/', // Change 'codegen' to match your repo name
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          react: ['react', 'react-dom'],
          // QR/Barcode generation
          generators: ['qrcode', 'jsbarcode'],
          // Scanning libraries (loaded on demand for paste/drop)
          scanners: ['jsqr', '@ericblade/quagga2'],
        },
      },
    },
  },
})
