import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'framer-motion'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'zustand', 'lucide-react'],
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
