import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;

          if (id.includes('/node_modules/@supabase/')) {
            return 'vendor-supabase';
          }

          if (id.includes('/node_modules/recharts/')) {
            return 'vendor-recharts';
          }

          if (id.includes('/node_modules/d3-')) {
            return 'vendor-d3';
          }

          if (id.includes('/node_modules/lodash/')) {
            return 'vendor-lodash';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true
  }
});

