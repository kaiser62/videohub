# Pornhub-Style Frontend — Design Spec

## Overview

Build a video browsing website in the style of Pornhub (dark theme, thumbnail grid, prominent search, category navigation, video player page). Consumes the API at `https://oracle2.basic.int.eu.org`.

**Any tech stack works** — React, Vue, Svelte, or vanilla JS. The API is REST/JSON with CORS. Deploy as static files on Netlify / Vercel / GitHub Pages, or serve from the Flask app's `/` route.

---

## Visual Style

### Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0f172a` | Page background |
| `--bg-secondary` | `#1e293b` | Cards, header, dropdowns |
| `--bg-tertiary` | `#334155` | Hover states, borders |
| `--text-primary` | `#f1f5f9` | Headings, titles |
| `--text-secondary` | `#94a3b8` | Subtitles, metadata |
| `--text-muted` | `#64748b` | Site name, timestamps |
| `--accent` | `#2563eb` | Active tab, buttons, links |
| `--accent-hover` | `#1d4ed8` | Button hover |
| `--border` | `#334155` | Card borders, dividers |

### Typography

- Font: system UI stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- Card titles: `0.85rem`, `font-weight: 500`, line-height `1.3`, max 2 lines clamped
- Site labels: `0.65rem`, uppercase, `letter-spacing: 0.5px`, muted color

### Layout

- Max content width: `1200px`, centered
- Sticky header at top
- Responsive grid: `repeat(auto-fill, minmax(220px, 1fr))` on desktop, `150px` on mobile

---

## Pages / Routes

### 1. Homepage (`/`)

Purpose: Discover content, drive browsing.

```
┌──────────────────────────────────────────────────────────┐
│  🎬 Logo    [Home] [Latest] [Sites]    [🔍 Search...]   │  ← Sticky header
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌── Featured / Hero ──────────────────────────────┐    │
│  │  Large thumbnail (16:9)                           │    │
│  │  Title overlay at bottom                          │    │
│  │  Auto-rotate every 8s (top 5 from shuffle)        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─ Hot Videos ─────────────────────────────────────┐   │
│  │  [🔥 Trending] [🆕 Latest] [🎲 Random]          │   │  ← Tab bar
│  │                                                   │   │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │   │  ← 6-card grid
│  │  │    │ │    │ │    │ │    │ │    │ │    │    │   │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │   │
│  │  [View More →]                                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Browse by Site ───────────────────────────────┐    │
│  │  [Site A] [Site B] [Site C] [Site D] ...       │    │  ← Site chips
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Latest Uploads ───────────────────────────────┐    │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │   │
│  │  │    │ │    │ │    │ │    │ │    │ │    │    │   │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │   │
│  │  [View More →]                                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  <footer with site stats, "X videos from Y sites" />    │
└──────────────────────────────────────────────────────────┘
```

**API calls on homepage:**
- Hero: `GET /api/videos/shuffle?count=5` → pick 1 as featured
- Hot/Latest tab: `GET /api/videos/shuffle?count=18` or `GET /api/videos/latest?per_page=18`
- Site chips: `GET /api/sites`
- Latest row: `GET /api/videos/latest?per_page=6`

---

### 2. Browse Page (`/browse`)

Purpose: Filter, search, paginate through all videos.

```
┌──────────────────────────────────────────────────────────┐
│  Logo    [Home] [Latest] [Sites]    [🔍 Search...]       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Search / Filter bar:                                    │
│  ┌──────────────────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Search titles...     │ │ All Sites ▼ │  Search  │    │
│  └──────────────────────┘ └──────────┘ └──────────┘    │
│                                                          │
│  Results: "199 videos found"                             │
│                                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │    │ │    │ │    │ │    │ │    │ │    │ │    │    │
│  │    │ │    │ │    │ │    │ │    │ │    │ │    │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │    │ │    │ │    │ │    │ │    │ │    │ │    │    │
│  │    │ │    │ │    │ │    │ │    │ │    │ │    │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │
│                                                          │
│  Pagination:                                             │
│  « Prev  1  2  3  4  5  ...  10  Next »                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**API calls:**
- `GET /api/videos?page=N&per_page=20&site=X&q=Y`
- `GET /api/sites` — populate dropdown (call once, cache)

---

### 3. Video Player Page (`/watch`)

Purpose: Watch a video, see details, find related content.

```
┌──────────────────────────────────────────────────────────┐
│  Logo    [Home] [Latest] [Sites]    [🔍 Search...]      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │              VIDEO PLAYER                        │   │  ← <video controls>
│  │              (max width 900px, centered)          │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Video Title (h1)                                        │
│  Site: DesiBabe                                          │
│                                                          │
│  ─── Related Videos ────────────────────────────────    │
│                                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │    │ │    │ │    │ │    │ │    │ │    │           │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**API calls:**
- No dedicated video detail endpoint (all metadata is in the list APIs)
- Pass `video_url`, `title`, `thumbnail`, `site` via URL params or state
- Related: `GET /api/videos/shuffle?count=12&site=SameSite`

---

### 4. Site Page (`/sites` or `/browse?site=DesiBabe`)

```
┌──────────────────────────────────────────────────────────┐
│  Logo    [Home] [Latest] [Sites]    [🔍 Search...]      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Site chips grid:                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Site A  │ │ Site B  │ │ Site C  │ │ Site D  │      │  ← 4-col grid
│  │ 24 vids │ │ 15 vids │ │ 20 vids │ │ 18 vids │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                          │
│  Click → /browse?site=SiteA                             │
└──────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
App
├── Header (sticky)
│   ├── Logo
│   ├── Nav tabs: [Home] [Latest] [Sites]
│   └── SearchBar (input + site filter dropdown)
│
├── Router
│   ├── HomePage
│   │   ├── HeroSection (featured video, auto-rotate)
│   │   ├── TabbedGrid ("Hot" / "Latest" / "Random")
│   │   │   └── VideoCard × N
│   │   ├── SiteChips (horizontal scrollable row)
│   │   └── LatestRow
│   │       └── VideoCard × 6
│   │
│   ├── BrowsePage
│   │   ├── FilterBar (search input + site dropdown)
│   │   ├── ResultCount ("199 videos")
│   │   ├── VideoGrid
│   │   │   └── VideoCard × N
│   │   └── Pagination
│   │
│   ├── WatchPage
│   │   ├── VideoPlayer (<video> element)
│   │   ├── VideoInfo (title, site label)
│   │   └── RelatedGrid
│   │       └── VideoCard × 6
│   │
│   └── SitesPage
│       └── SiteCard × N (click → BrowsePage with site filter)
│
└── Footer (stats, "X videos from Y sites | Last updated: Z min ago")
```

---

## VideoCard Component (reusable everywhere)

```html
<div class="video-card" onclick="openPlayer(video)">
  <div class="thumb-wrap">
    <img class="thumb" src="{thumbnail}" alt="" loading="lazy"
         onerror="this.style.display='none'">
    <div class="thumb-overlay">
      <span class="play-icon">▶</span>
    </div>
    <span class="duration-badge">{site}</span>
  </div>
  <div class="card-body">
    <p class="card-title">{title}</p>
    <span class="card-site">{site}</span>
  </div>
</div>
```

```css
.video-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.video-card:hover {
  transform: translateY(-3px);
  border-color: #2563eb;
}
.thumb-wrap {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #0f172a;
  overflow: hidden;
}
.thumb {
  width: 100%; height: 100%;
  object-fit: cover;
}
.thumb-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.15s;
}
.video-card:hover .thumb-overlay { opacity: 1; }
.play-icon { font-size: 2rem; color: white; text-shadow: 0 0 10px rgba(0,0,0,0.5); }
.duration-badge {
  position: absolute; bottom: 6px; right: 6px;
  background: rgba(0,0,0,0.8); color: white;
  font-size: 0.7rem; padding: 2px 6px; border-radius: 3px;
}
.card-body { padding: 10px 12px 12px; }
.card-title {
  font-size: 0.85rem; font-weight: 500; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; margin: 0 0 4px 0;
}
.card-site {
  font-size: 0.65rem; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

---

## Header Component

```html
<header class="header">
  <div class="header-inner">
    <a class="logo" href="/">🎬 VideoHub</a>
    <nav class="nav-tabs">
      <a href="/" class="tab">Home</a>
      <a href="/browse" class="tab">Videos</a>
      <a href="/latest" class="tab">Latest</a>
      <a href="/sites" class="tab">Sites</a>
    </nav>
    <div class="search-row">
      <input type="text" id="search-input" placeholder="Search videos...">
      <button id="search-btn">🔍</button>
    </div>
  </div>
</header>
```

```css
.header {
  background: #1e293b; border-bottom: 1px solid #334155;
  position: sticky; top: 0; z-index: 50;
}
.header-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 20px;
  display: flex; align-items: center; gap: 16px; height: 56px;
}
.logo { font-size: 1.2rem; font-weight: 700; color: #f1f5f9; text-decoration: none; white-space: nowrap; }
.nav-tabs { display: flex; gap: 0; }
.tab {
  padding: 6px 14px; color: #94a3b8; text-decoration: none;
  font-size: 0.85rem; font-weight: 600; border-radius: 6px;
  transition: all 0.15s;
}
.tab:hover { background: #334155; color: #f1f5f9; }
.tab.active { background: #2563eb; color: white; }
.search-row { margin-left: auto; display: flex; gap: 6px; }
.search-row input {
  padding: 8px 12px; border: 1px solid #475569; border-radius: 6px;
  background: #0f172a; color: #e2e8f0; width: 220px; outline: none;
}
.search-row input:focus { border-color: #2563eb; }
.search-row button {
  padding: 8px 12px; border: none; border-radius: 6px;
  background: #2563eb; color: white; cursor: pointer;
}
```

---

## Video Player Modal

Click any VideoCard → open full-screen overlay modal.

```css
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 16px;
}
.modal {
  max-width: 900px; width: 100%;
  background: #1e293b; border-radius: 10px; overflow: hidden;
}
.modal video { width: 100%; max-height: 70vh; background: black; display: block; }
.modal-body { padding: 14px 16px; }
.modal-title { font-size: 1rem; font-weight: 600; margin-bottom: 4px; }
.modal-site { font-size: 0.75rem; color: #64748b; }
```

- Close on backdrop click, Escape key, or X button
- Preserve scroll position when opening (body `overflow: hidden`)
- Pause video and clear `src` on close

---

## Fetch Wrapper

```js
const BASE = 'https://oracle2.basic.int.eu.org';
const KEY  = 'zrABkxB4_7L2x_l73z__M_uJveGMnGr7NAD2JCVDkBk';

async function api(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}api_key=${KEY}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Convenience wrappers
const browse  = (p = {}) => api(`/api/videos?${new URLSearchParams({page:1, per_page:20, ...p})}`);
const shuffle = (count = 20, site = '') => api(`/api/videos/shuffle?count=${count}${site ? '&site='+site : ''}`);
const latest  = (p = {}) => api(`/api/videos/latest?${new URLSearchParams({page:1, per_page:20, ...p})}`);
const sites   = () => api('/api/sites');
const status  = () => api('/api/refresh');
```

---

## Responsive Breakpoints

```css
/* Desktop */   .grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
/* Tablet */    @media (max-width: 768px) { .grid { grid-template-columns: repeat(3, 1fr); } }
/* Mobile */    @media (max-width: 480px) { .grid { grid-template-columns: repeat(2, 1fr); }
                                            .header-inner { flex-wrap: wrap; height: auto; padding: 10px; } }
```

Mobile header should collapse to:
```
┌──────────────────┐
│ 🎬 Logo   [🔍]   │
│ [Home][Latest]   │
└──────────────────┘
```

---

## API Reference (Quick)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/videos?page=&per_page=&site=&q=` | Paginated browse/search/filter |
| `GET /api/videos/shuffle?count=&site=` | Random videos |
| `GET /api/videos/latest?page=&per_page=` | Latest uploads |
| `GET /api/sites` | List of sites for dropdown |
| `GET /api/refresh` | Extraction status |

**Video object:**
```ts
{ id: number, video_url: string, title: string, thumbnail: string|null, site: string }
```

---

## Implementation Order

1. **Setup** — project scaffold, fetch wrapper, dark theme CSS
2. **Header** — logo, nav tabs, search input
3. **VideoCard** — reusable card component with thumbnail + title + site
4. **BrowsePage** — grid + search + pagination (core functionality)
5. **HomePage** — hero + shuffle grid + latest row + site chips
6. **Video Player** — modal overlay with `<video>` element
7. **SitesPage** — site grid, click navigates to BrowsePage filtered
8. **Polish** — mobile responsive, hover effects, loading states, error handling
9. **Deploy** — static hosting (Netlify/Vercel) or serve from Flask

---

## Wireframe Reference

For visual reference, open Pornhub.com in a private window and inspect:
- The header layout (logo left, nav center, search right)
- The video card grid layout
- The video player page layout
- The search + filter interaction

Adapt colors to the dark theme palette above. Keep it simple — no user accounts, no comments, no ratings. Just browse, search, filter, and play.
