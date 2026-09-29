import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/dev/',
  css: {
    transformer: 'postcss',
  },
  server: {
    proxy: {
      '/dev/api': {
        target: 'https://oracle2.basic.int.eu.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev\/api/, '/api'),
      },
      '/api': {
        target: 'https://oracle2.basic.int.eu.org',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    {
      name: 'cors-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const isFetchVideo = req.url?.startsWith('/api/fetch-video') || req.url?.startsWith('/dev/api/fetch-video');
          const isFetchImage = req.url?.startsWith('/api/fetch-image') || req.url?.startsWith('/dev/api/fetch-image');
          if (!isFetchVideo && !isFetchImage) return next();
          const qi = req.url.indexOf('?');
          if (qi === -1) return next();
          const target = new URLSearchParams(req.url.slice(qi + 1)).get('url') || '';
          if (!target) return next();
          try {
            const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
            if (req.headers.range) headers['Range'] = req.headers.range;
            const resp = await fetch(target, { headers });
            res.statusCode = resp.status;
            resp.headers.forEach((v, k) => res.setHeader(k, v));
            res.setHeader('Access-Control-Allow-Origin', '*');
            resp.body.pipeTo(new WritableStream({
              write(chunk) { res.write(Buffer.from(chunk)); },
              close() { res.end(); }
            }));
          } catch {
            res.statusCode = 502;
            res.end('Proxy error');
          }
        });
      }
    }
  ],
})
