import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import crypto from 'crypto';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
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

          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        // In dev, proxy /api/proxy requests to the upstream API with the admin password
        '/api/proxy': {
          target: 'https://api-pull.gacha.game',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const targetPath = url.searchParams.get('path') || '/';
            url.searchParams.delete('path');
            const remaining = url.searchParams.toString();
            return `${targetPath}${remaining ? '?' + remaining : ''}`;
          },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const jwtSecret = env.VITE_ADMIN_JWT_SECRET || env.ADMIN_JWT_SECRET;
              if (jwtSecret) {
                const header = { alg: 'HS256', typ: 'JWT' };
                const now = Math.floor(Date.now() / 1000);
                const payload = {
                  iss: 'gacha-admin',
                  sub: 'dashboard-service',
                  email: 'dashboard@gacha.game',
                  role: 'super_admin',
                  iat: now,
                  exp: now + 300,
                };
                const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
                const unsigned = `${b64(header)}.${b64(payload)}`;
                const sig = crypto.createHmac('sha256', jwtSecret).update(unsigned).digest('base64url');
                proxyReq.setHeader('Authorization', `Bearer ${unsigned}.${sig}`);
              }
            });
          },
        },
      },
    },
  };
});
