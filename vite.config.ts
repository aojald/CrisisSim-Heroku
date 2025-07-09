import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  
  return {
    plugins: [react()],
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
      sourcemap: mode === 'production' ? false : true,
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          safari10: true,
        },
      },
      rollupOptions: {
        external: [],
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['lucide-react', 'socket.io-client']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  };
});