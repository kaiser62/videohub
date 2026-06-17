# Continue — Video Aggregator Fixes

## What's Been Done

### Live on Server (permanent, rebuilt Docker image)

1. **`backend/base_extractor.py`** — Added regex in `add_cdn_links_from_text` to match `/get_file/{n}/{hash}/{bucket}/{id}/{id}.mp4` (non-preview variant). Also added `extract_fn` parameter to `extract_video_meta` and `parallel_extract_meta` so site-specific CDN extractors are used for individual post-page extractions.

2. **`backend/extractor.py`** — Updated `_extract_site` and `_extract_latest_site` to pass `extract_fn` to `parallel_extract_meta`. Updated homepage fallback to use `extract_fn` too.

3. **`app.py`** — Added Referer header map in `/api/fetch-video` proxy for `cdn.desisex2.com` (needed by CDN).

4. **DB migration** — Converted 183 existing `/get_file/` URLs to CDN URLs for DesiSex2 and SpicyMMS.

### Pushed to GitHub (branch `docker`)
- Commit `521804a`: CDN URL construction + proxy Referer
- Commit `598b957`: extract_fn passthrough for post-page extraction

### On Server
- Docker image rebuilt with changes, container running on `new-test_vmess_network`
- Container maps port 9000 internally, Caddy proxy uses Docker DNS `video-aggregator:8000`

## What's NOT Working Yet

### DesiSex2 / SpicyMMS new extractions
Despite the `extract_fn` fix, new scheduler cycles still produce `/get_file/` URLs instead of CDN URLs. Likely reasons:

- The `extract_fn` lambda `(lambda html, base_url: cdn_extract(html, base_url, "cdn.desisex2.com"))` is registered but might not be called correctly for post pages.
- OR: The `find_video_post_links` on DesiSex2 homepage returns wrong/mixed URLs (category listing pages instead of video posts), so the post page extraction (`extract_video_meta`) never runs for actual video pages.

**To debug:**
```bash
# Check if extract_fn is actually being called in the scheduler
docker exec video-aggregator python3 -c "
import logging
logging.basicConfig(level=logging.DEBUG)
from backend.extractor import _do_extract
from backend.sites import get_registry
reg = [(n,u,p,e,f) for n,u,p,e,f in get_registry() if n in ('DesiSex2','SpicyMMS')]
_do_extract(reg)
"
```

### Remaining Broken Sites

| Site | Issue | Status |
|------|-------|--------|
| **VidEking3** | All thumbnails null from API | Not started |
| **DesiBF** | Thumbnails hotlink-blocked | Not started |
| **NewDesiMMS** | Thumbnail DNS failure | Not started |
| **XXXIndStories** | 0 videos — wrong extractor | Not started |
| **XXXBold** | All CDN paths dead | Not started |

### Lost DB Data
When the old container was removed (during redeploy), the SQLite DB inside it was lost (no volume mount at that time). The volume mount `/home/ubuntu/video_aggregator/cache:/app/cache` was added to the new container, but it started with a fresh DB.

The scheduler re-collects data every 6 hours automatically. As of last check: ~1057 videos collected (out of ~2500 original).

## Quick Commands

```bash
# Check DB state
docker exec video-aggregator python3 -c "
import sqlite3
c = sqlite3.connect('/app/cache/videos.db')
print('Videos:', c.execute('SELECT count(*) FROM videos').fetchone()[0])
for r in c.execute('SELECT site, count(*) FROM videos GROUP BY site ORDER BY count(*) DESC').fetchall():
    print(f'  {r[0]}: {r[1]}')
c.close()
"

# Test video playback through proxy
curl -sL -o /dev/null -w '%{http_code} %{content_type}' \
  'https://oracle2.basic.int.eu.org/api/fetch-video?url=https://cdn.desisex2.com/2000/2627/2627.mp4&api_key=zrABkxB4_7L2x_l73z__M_uJveGMnGr7NAD2JCVDkBk'

# Trigger re-extraction
curl -sL -X POST 'https://oracle2.basic.int.eu.org/api/refresh?api_key=zrABkxB4_7L2x_l73z__M_uJveGMnGr7NAD2JCVDkBk'

# Check health
curl -s 'https://oracle2.basic.int.eu.org/health'
```

## Todo
- [ ] Fix extract_fn passthrough — DesiSex2/SpicyMMS still get `/get_file/` URLs from scheduler
- [ ] VidEking3: add `<img>` fallback in `extract_video_meta`
- [ ] DesiBF: add `/api/fetch-image` proxy endpoint for hotlink-blocked thumbs
- [ ] NewDesiMMS: fix DNS/URL for thumbnails
- [ ] XXXIndStories: rewrite extractor
- [ ] XXXBold: investigate new video source
