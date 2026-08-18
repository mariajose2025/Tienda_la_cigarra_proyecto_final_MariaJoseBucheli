import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('xlsx') || id.includes('sheetjs')) return 'excel';
            if (id.includes('html2pdf') || id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
            return 'vendor';
          }
        }
      }
    }
  }
})
