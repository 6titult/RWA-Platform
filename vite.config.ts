// vite.config.ts

import { defineConfig } from 'vite'

/**
 * Vite configuration for the RWA Marketplace project
 * This configuration:
 * 1. Defines global variables
 * 2. Sets up polyfills for Node.js built-in modules
 * 3. Configures module resolution for browser compatibility
 */
export default defineConfig({
  // Define global variables that might be needed by dependencies
  define: {
    global: {},
  },
  // Configure module resolution for browser compatibility
  resolve: {
    alias: {
      // Polyfills for Node.js built-in modules
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      assert: 'assert',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify',
    },
  }
}) 