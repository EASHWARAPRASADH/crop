import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  optimizeDeps: {
    force: true, // Force Vite to re-optimize dependencies on next start
    exclude: ['psd'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['psd'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-toast'],
          fabric: ['fabric', 'konva', 'react-konva'],
          utils: ['xlsx', 'jszip', 'qrcode', 'jspdf']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
}));
