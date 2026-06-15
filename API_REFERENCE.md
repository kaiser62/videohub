# Video Aggregator API — Frontend Reference

**Base URL:** `https://oracle2.basic.int.eu.org`  
**Auth Key:** `zrABkxB4_7L2x_l73z__M_uJveGMnGr7NAD2JCVDkBk`

Auth via `?api_key=KEY` or `Authorization: Bearer KEY`. `/health` and `/` are always open.  
Full CORS — any domain can call the API.

---

## Endpoint Summary

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/videos` | Paginated browse, search, filter |
| `GET` | `/api/videos/shuffle` | Random videos |
| `GET` | `/api/videos/latest` | Latest uploads |
| `GET` | `/api/links` | Flat URL list per site |
| `GET` | `/api/refresh` | Extraction status |
| `POST` | `/api/refresh` | Trigger manual refresh |
| `GET` | `/api/sites` | List all sites |
| `GET` | `/health` | Health check |

---

## `GET /api/videos` — Browse

Main endpoint for building video feeds.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 100) |
| `site` | str | — | Filter by site name (case-insensitive) |
| `q` | str | — | Search title text (case-insensitive) |

```json
{
  "videos": [
    {
      "id": 3904,
      "video_url": "https://cdn2.example.com/video.mp4",
      "title": "Video Title",
      "thumbnail": "https://example.com/thumb.jpg",
      "site": "SiteName"
    }
  ],
  "total": 199,
  "page": 1,
  "per_page": 20,
  "total_pages": 10
}
```

**Use cases:**
- Page 1 on load → pagination buttons for rest
- `?site=DesiBabe` for site-only view
- `?q=bengali` for search
- Combine: `?site=DesiBabe&q=bengali&page=1`

---

## `GET /api/videos/shuffle` — Random

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `count` | int | 20 | How many (max 100) |
| `site` | str | — | Filter by site |

```json
{
  "videos": [ /* same video object format */ ],
  "total": 199
}
```

**Use case:** Homepage hero grid — random selection refreshes on every call.

---

## `GET /api/videos/latest` — Latest Uploads

Same params and response format as `/api/videos`.  
Reads from a separate table populated from each site's dedicated "latest" or "new" page.

**Use case:** A "Latest" tab or sidebar section.

---

## `GET /api/links` — Raw URLs

```json
{
  "sites": {
    "SiteName": ["https://cdn2.example.com/video1.mp4", "https://cdn2.example.com/video2.mp4"]
  }
}
```

No pagination, no metadata. Every video URL per site in a flat array.

---

## `GET /api/refresh` — Status

```json
{
  "running": false,
  "last_full": 1781543472.93,
  "last_latest": 1781543651.23,
  "_count": 0
}
```

| Field | Description |
|-------|-------------|
| `running` | Extraction currently in progress |
| `last_full` | Unix timestamp of last full extraction completion (null if never) |
| `last_latest` | Unix timestamp of last latest extraction completion (null if never) |

---

## `POST /api/refresh` — Manual Trigger

```json
{"status": "refreshing"}
```

Triggers both extractions in background threads. Returns immediately. Data stays available (SQLite).

---

## `GET /api/sites` — Site List

```json
[
  { "url": "https://desibabe.io/", "label": "DesiBabe", "pattern": "desibabe\\.io" },
  { "url": "https://desibf.com/", "label": "DesiBF", "pattern": "desibf\\.com" }
]
```

Use to populate a site filter dropdown in the UI.

---

## `GET /health` — Health Check

```json
{"status": "ok"}
```

Always returns 200. No auth required.

---

## Video Object Format

Every video in every endpoint follows this shape:

```typescript
interface Video {
  id: number;           // SQLite row ID
  video_url: string;    // Direct .mp4 URL — use as <video src>
  title: string;        // Video title (may contain Unicode/Hindi)
  thumbnail: string | null;  // Thumbnail URL, null if missing
  site: string;         // Site name (e.g. "DesiBabe")
}
```

---

## Frontend Architecture Guide

### Recommended tech
- Any framework: React, Vue, Svelte, vanilla JS
- The API is simple REST/JSON with CORS — no SDK needed
- No build tools required if using vanilla JS

### Suggested page/component structure

```
Home
├── Hero grid — shuffle?count=30
├── Latest row — videos/latest?per_page=10
└── Quick filters — links to browse?site=X

Browse
├── Search bar + site dropdown
├── Results grid — videos?page=N&q=X&site=Y
└── Pagination / infinite scroll

Video Player
├── HTML5 <video> with video_url as src
├── Title + site name
└── Close / back navigation
```

### Video card component

```
┌──────────────────────┐
│    thumbnail image    │  16:9 ratio, placeholder if null
│                       │  onerror → hide broken images
├──────────────────────┤
│ Title (max 2 lines)   │
│ SITE NAME (uppercase) │
└──────────────────────┘
Click → open video player (modal or dedicated page)
```

### Video player

```html
<video controls autoplay playsinline>
  <source src="{video_url}" type="video/mp4">
</video>
```

Full-screen overlay modal with backdrop click + Escape to close.  
Show title and site name below the player.

### Search + filter

```
[Search input...] [Site dropdown ▼] [Search button]
```

- Site dropdown populated from `GET /api/sites` (fetch once, cache)
- Search triggers `GET /api/videos?q=TERM&site=SITE&page=1`
- Results render in the same grid component

### Pagination styles

**Button pagination:**
```
« Prev  1  2  3  ...  10  Next »
```
- Disable Prev on page 1, Next on last page
- Show page range around current page with ellipsis

**Infinite scroll (alternative):**
```js
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && hasMore) {
    page++;
    const data = await api(`/api/videos?page=${page}`);
    appendResults(data.videos);
  }
});
observer.observe(sentinelElement);
```

### Refresh indicator

```
Last updated: 5 min ago
```
- Poll `GET /api/refresh` every 30 seconds
- Convert `last_full` unix timestamp to relative time string
- Show "Updating..." when `running` is true

### Example fetch wrapper

```js
const BASE = 'https://oracle2.basic.int.eu.org';
const KEY  = 'zrABkxB4_7L2x_l73z__M_uJveGMnGr7NAD2JCVDkBk';

async function api(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}api_key=${KEY}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Usage
const browse = await api('/api/videos?page=1&per_page=20');
const shuffle = await api('/api/videos/shuffle?count=30');
```

---

## Data Notes

- **~200 videos** from **~16 sites**, growing as sites add content
- **SQLite-backed** — all endpoints return instantly, never empty
- **30-minute auto-refresh** scheduler runs in background
- Can **manually trigger** refresh via `POST /api/refresh`
- Extraction is **incremental** — data survives container restarts
- If `thumbnail` is `null`, show a placeholder (colored div with site initial)

---

## Deployment Options for Frontend

1. **Static hosting** (Netlify, Vercel, GitHub Pages) — works because CORS is enabled
2. **Same Flask server** — the existing `/` route serves `templates/index.html`; can replace with your SPA build
3. **Subfolder on the same domain** — e.g., `oracle2.basic.int.eu.org/app/` via Caddy route

The simplest approach: build as static files, deploy anywhere.
