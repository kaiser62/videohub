# VideoHub

Pornhub-style video browsing site — dark theme, thumbnail grid, search, category navigation, autoplay video player, server health dashboard.

**Live:** https://oracle2.basic.int.eu.org

---

## Architecture

```
User → Caddy (SSL termination)
        ├── /api/*  ──→ video-aggregator:8000  (Flask API + SQLite)
        ├── /health ──→ video-aggregator:8000
        └── / ────────→ videohub-frontend:80   (nginx → React SPA)
```

- **Frontend:** React 19 + Vite 8 + react-router-dom 7 (single-page app)
- **Backend:** Flask REST API with SQLite, 19 source sites, auto-refresh every 30min
- **Proxy:** Caddy v2, Docker network `new-test_vmess_network`

## Pages

| Route | Page | Features |
|-------|------|----------|
| `/` | Home | Hero auto-rotate, 3 tabs (Newest/Popular/Long), site chips, latest row, "What's New" (6h) |
| `/browse` | Browse | Search + site dropdown + pagination, URL-synced params |
| `/watch/:id` | Watch | HTML5 video player, autoplay queue, proxy toggle, Studio button, skip/PiP/download |
| `/sites` | Sites | 19 source site cards with video counts |
| `/health` | Health | 7 stat cards, DB table, proxy toggle, manual refresh |

## Local Development

```bash
npm install
npm run dev        # Vite dev server at localhost:5173
```

Uses CORS proxy middleware in `vite.config.js` — API calls are proxied to the live backend during dev.

## Docker Deployment

```bash
# Build
docker build -t videohub-frontend .

# Run (attach to existing network with API container)
docker run -d --name videohub-frontend \
  --restart unless-stopped \
  --network new-test_vmess_network \
  videohub-frontend
```

Caddy reverse-proxies `/api/*` and `/health` to the Flask backend, everything else to this container.

## API

All endpoints under `https://oracle2.basic.int.eu.org/api/` with `?api_key=KEY`.

| Endpoint | Purpose |
|----------|---------|
| `GET /videos` | Paginated browse/search/filter (`?q=&site=&page=&per_page=&sort_by=`) |
| `GET /videos/recent` | Recent videos |
| `GET /videos/shuffle` | Random videos (`?count=&site=`) |
| `GET /videos/latest` | Latest per-site uploads |
| `GET /videos/:id` | Single video by ID |
| `GET /sites` | All site definitions |
| `GET /sites/:slug/status` | Per-site extraction status |
| `GET /links` | URL-based video lookup |
| `GET /status` | Backend health |
| `GET /health` | Detailed health + DB stats |
| `POST /refresh` | Trigger extraction refresh |
| `GET /db` | DB table statistics |

See [API_REFERENCE.md](./API_REFERENCE.md) for full docs.

## Deployment Config

- **Caddyfile:** `/home/ubuntu/new-test/caddy/Caddyfile` (server)
- **Docker network:** `new-test_vmess_network`
- **Frontend container:** `videohub-frontend` (nginx, port 80)
- **API container:** `video-aggregator` (Flask, port 8000)

## Notes

- 14/19 API sites play video directly; 4 are ORB-blocked (Cloudflare + nosniff, no CORS)
- Proxy toggle in UI needs backend `GET /api/fetch-video?url=` to actually work (not implemented yet)
- "New" badge = added within last 6 hours
- Mobile: iOS 16+ with responsive breakpoints at 768px / 480px
