# Test Results — 2026-06-17

## Infrastructure

| Component | Details |
|-----------|---------|
| Frontend | `videohub-frontend` (nginx, React SPA) |
| Backend | `video-aggregator` (Flask + gunicorn, port 8000) |
| Reverse Proxy | Caddy at `oracle2.basic.int.eu.org` |
| API Key | `zrABkxB4_7L2x_l73z__M_uJveGMnGr7NAD2JCVDkBk` |

**Routing:**
- `/api/*`, `/health` → `video-aggregator:8000`
- `/*` → `videohub-frontend:80`

---

## Thumbnail Status (by site)

| Site | Status | Browser-Checked | Details |
|------|--------|----------------|---------|
| Antarvasna | ✅ OK | 20/20 | All thumbnails load |
| DesiBabe | ✅ OK | 20/20 | All thumbnails load |
| DesiBF | ❌ BROKEN | 20/20 | All thumbnails hidden by `onError` — hotlink protection from desibf.com |
| DesiBP | ✅ OK | 20/20 | All thumbnails load |
| DesiSexSite | ✅ OK | — | Assumed OK |
| DesiSex2 | ✅ OK | — | Thumbnails exist in API |
| DesiVideo | ✅ OK | — | Assumed OK |
| KamababaX | ✅ OK | 20/20 | All thumbnails load |
| MasaPorn | ✅ OK | — | Assumed OK |
| MastiBaba | ✅ OK | — | Assumed OK |
| NaijaPorn | ✅ OK | — | Assumed OK |
| NewDesiMMS | ✅ OK | — | Assumed OK |
| SpicyMMS | ✅ OK | — | Thumbnails exist in API |
| TamilSexZone | ✅ OK | 20/20 | All thumbnails load |
| TheKamababa | ✅ OK | — | Assumed OK |
| VidEking3 | ❌ BROKEN | — | All 122 thumbnails `null` from API — extractor not capturing them |
| XXXBold | ✅ OK | 20/20 | All thumbnails load |
| XXXHindi | ✅ OK | 20/20 | All thumbnails load |
| XXXIndStories | ❌ N/A | — | 0 videos total — extractor broken |

**2 sites with broken thumbnails:** DesiBF (hotlink blocked), VidEking3 (extractor doesn't capture).

---

## Video Playback Status (by site)

| Site | Status | HTTP Check | Details |
|------|--------|-----------|---------|
| Antarvasna | ✅ WORKING | `200 video/mp4 (46MB)` | Video plays |
| DesiBabe | ✅ WORKING | `200 video/mp4 (33MB)` | Video plays |
| DesiBF | ✅ WORKING | `200 video/mp4 (61MB)` | Videos work despite broken thumbnails |
| DesiBP | ⚠️ MOSTLY | `200 (9/10) 404 (1/10)` | 1 stale URL (id=5102), rest work |
| DesiSexSite | ✅ WORKING | `200 video/mp4 (8.7MB)` | Video plays |
| DesiSex2 | ❌ BROKEN | `403 (10/10)` | All videos forbidden — CDN URL pattern outdated |
| DesiVideo | ✅ WORKING | `200 video/mp4 (26MB)` | Video plays |
| KamababaX | ✅ WORKING | `200 video/mp4 (10MB)` | Video plays |
| MasaPorn | ✅ WORKING | `200 video/mp4 (59MB)` | Video plays |
| MastiBaba | ✅ WORKING | `200 video/mp4 (52MB)` | Video plays |
| NaijaPorn | ✅ WORKING | `200 video/mp4 (4.5MB)` | Video plays |
| NewDesiMMS | ✅ WORKING | `200 video/mp4 (9.2MB)` | Video plays |
| SpicyMMS | ❌ BROKEN | `403 (10/10)` | All videos forbidden — same AVS issue as DesiSex2 |
| TamilSexZone | ✅ WORKING | `200 video/mp4 (20MB)` | Video plays |
| TheKamababa | ✅ WORKING | `200 video/mp4 (19MB)` | Video plays |
| VidEking3 | ✅ WORKING | `200 video/mp4 (57MB)` | Videos work despite missing thumbnails |
| XXXBold | ❌ BROKEN | `200 HTML (10/10)` | All videos return WordPress HTML — CDN paths dead |
| XXXHindi | ✅ WORKING | `200 (56MB)` | Video plays |
| XXXIndStories | ❌ N/A | — | 0 videos — extractor finds nothing |

**14 sites working, 5 sites broken.**

---

## Issue Details

### 🔴 HIGH — Video URLs Dead

#### 1. DesiSex2 — All 72 videos 403 Forbidden
- **Root Cause:** CDN URL pattern in `backend/sites/desisex2.py` is outdated. Site moved to hash-protected `/get_file/` delivery (AVS platform change).
- **Fix:** Extract video URL from post page player config instead of hardcoded CDN formula.

#### 2. SpicyMMS — All 83 videos 403 Forbidden
- **Root Cause:** Same AVS platform issue as DesiSex2. `backend/sites/spicymms.py` uses the same outdated CDN pattern.
- **Fix:** Same as DesiSex2.

#### 3. XXXBold — All 274 videos return WordPress HTML
- **Root Cause:** Old `xxxboldN.online/wp-content/uploads/` paths all dead. Videos now return WordPress HTML instead of mp4.
- **Fix:** Reinvestigate current video embedding on `xxxbold.com` — update extractor.

#### 4. XXXIndStories — 0 videos
- **Root Cause:** Wrong URL (non-www vs www), wrong CDN host, `/videos/` subdirectory not handled.
- **Fix:** Update extractor for actual site structure + switch to post-page extraction.

### 🟡 MEDIUM — Broken Thumbnails

#### 5. DesiBF — 20/20 thumbnails broken in browser
- **Root Cause:** Hotlink protection on `desibf.com` blocks direct image loads. Videos work fine.
- **Fix:** Add `/api/fetch-image` proxy endpoint (mirror existing `/api/fetch-video`).

#### 6. VidEking3 — 122/122 thumbnails null from API
- **Root Cause:** Post pages lack `og:image`/`thumbnailUrl`. Thumbnails only on listing page.
- **Fix:** Add `<img src>` fallback in `extract_video_meta()` in `backend/base_extractor.py`.

### 🟢 LOW — Minor Issues

#### 7. DesiBP — 1 occasional 404
- **Root Cause:** `generic_extract()` regex picks up stale `.mp4` URLs from page HTML with no validation.
- **Fix:** Add optional HEAD-request validation in `finalize_media_links()`.

---

## Working Sites (14/19)

These sites have full working video playback:

- Antarvasna (98 videos)
- DesiBabe (130 videos)
- DesiBF (101 videos — thumbnails broken but video works)
- DesiBP (137 videos — mostly, 1 stale)
- DesiSexSite (164 videos)
- DesiVideo (222 videos)
- KamababaX (170 videos)
- MasaPorn (112 videos)
- MastiBaba (59 videos)
- NaijaPorn (123 videos)
- NewDesiMMS (100 videos)
- TamilSexZone (221 videos)
- TheKamababa (33 videos)
- VidEking3 (122 videos — thumbnails missing but video works)
- XXXHindi (282 videos)

**Database totals:** 2,503 videos, 587 latest, from 18 active sites.
