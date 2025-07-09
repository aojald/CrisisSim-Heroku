import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  
  return {
    plugins: [react()],
    base: '/',
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        crypto: 'crypto-browserify',
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['crypto-browserify'],
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      open: false, // Don't auto-open browser
      proxy: isDev ? {
        '/socket.io': {
          target: 'http://localhost:3001',
          ws: true,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
          proxyTimeout: 60000
        }
      } : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['lucide-react', 'socket.io-client']
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    }
  };
});