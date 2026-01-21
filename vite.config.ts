import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    // Verander 'SCHOOLROOSTER' naar de exacte naam van je GitHub repository
    base: './', 

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // Fix: Manual process.env definitions for API_KEY are removed as the key is automatically injected by the platform.
    define: {},

    resolve: {
      alias: {
        // Fix: __dirname is not defined in ES modules. path.resolve('.') resolves to the current working directory (project root).
        '@': path.resolve('.'),
      }
    }
  };
});
