import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env': env
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    // Clear cache on start
    cacheDir: '.vite',
    // Force clear cache
    optimizeDeps: {
      force: true
    },
    server: {
      watch: {
        usePolling: true
      }
    }
  };
});

