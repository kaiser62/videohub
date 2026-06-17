const KEY  = 'zrABkxB4_7L2x_l73z__M_uJveGMnGr7NAD2JCVDkBk';

async function api(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${path}${sep}api_key=${KEY}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const browse  = (p = {}) => api(`/api/videos?${new URLSearchParams({page: 1, per_page: 20, ...p})}`);
export const recent  = (p = {}) => api(`/api/videos/recent?${new URLSearchParams({limit: 50, ...p})}`);
export const shuffle = (count = 20, site = '') => api(`/api/videos/shuffle?count=${count}${site ? '&site=' + encodeURIComponent(site) : ''}`);
export const latest  = (p = {}) => api(`/api/videos/latest?${new URLSearchParams({page: 1, per_page: 20, ...p})}`);
export const sites   = () => api('/api/sites');
export const status  = () => api('/api/refresh');
export const links   = () => api('/api/links');
export const health  = () => api('/api/health');
export const triggerRefresh = () =>
  fetch(`/api/refresh?api_key=${KEY}`, { method: 'POST' }).then(r => r.json());
export const dbStats = () => api('/api/db').catch(() => null);
export const videoById = (id) => api(`/api/videos/${id}`);

// Proxy video URL through backend to bypass CDN CORS/ORB restrictions.
// Toggle via localStorage 'videohub_proxy' ('on' = enabled).
// When ON, every video URL is fetched via the backend proxy endpoint.
// ponytail: no hostname whitelist — if proxy is ON, proxy everything.
// Add per-CDN exclusion list if a specific CDN performs worse through proxy.
export function proxyVideoUrl(url) {
  if (!url) return url;
  const proxyOn = typeof localStorage !== 'undefined' && localStorage.getItem('videohub_proxy') === 'on';
  if (!proxyOn) return url;
  return `/api/fetch-video?url=${encodeURIComponent(url)}&api_key=${KEY}`;
}
