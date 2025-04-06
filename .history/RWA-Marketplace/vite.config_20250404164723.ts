import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react({
      babel: {
        parserOpts: {
          // Removed invalid generatorOpts property
        }
      }
    })],
    define: {
      'process.env': env
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom']
          }
        }
      }
    },
    server: {
      watch: {
        usePolling: true
      },
      host: true,
      allowedHosts: [
        'localhost',
        '*.ngrok-free.app'
      ]
    },
    cacheDir: '.vite',
    optimizeDeps: {
      force: true
    }
  };
});





