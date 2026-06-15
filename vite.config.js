import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cors-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/proxy-video/')) return next();
          const target = decodeURIComponent(req.url.slice('/proxy-video/'.length));
          try {
            const headers = { 'User-Agent': 'Mozilla/5.0' };
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
