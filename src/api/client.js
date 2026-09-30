const KEY = 'zrABkxB4_7L2x_l73z__M_uJveGMnGr7NAD2JCVDkBk';

// Primary API base is /api
let activeApiBase = '/api';

export function getApiBase() {
  return activeApiBase;
}

export function setApiBase(base) {
  activeApiBase = base;
}

/**
 * Execute an API call, trying activeApiBase first, and falling back to /api if needed.
 */
async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const sep = cleanEndpoint.includes('?') ? '&' : '?';

  const makeUrl = (base) => `${base}${cleanEndpoint}${sep}api_key=${KEY}`;

  const tryFetch = async (base) => {
    const res = await fetch(makeUrl(base), options);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON but received ${contentType}`);
    }
    return res.json();
  };

  try {
    return await tryFetch(activeApiBase);
  } catch (err) {
    if (activeApiBase !== '/api') {
      try {
        const result = await tryFetch('/api');
        activeApiBase = '/api'; // Switch to working fallback
        return result;
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

function normalizePath(path) {
  if (path.startsWith('/dev/api')) return path.slice(8);
  if (path.startsWith('/api')) return path.slice(4);
  return path;
}

export async function api(path, options = {}) {
  return request(normalizePath(path), options);
}

export const browse = (p = {}) => api(`/videos?${new URLSearchParams({ page: 1, per_page: 24, ...p })}`);
export const recent = (p = {}) => api(`/videos/recent?${new URLSearchParams({ limit: 40, ...p })}`);
export const shuffle = (count = 24, site = '') => api(`/videos/shuffle?count=${count}${site ? '&site=' + encodeURIComponent(site) : ''}`);
export const latest = (p = {}) => api(`/videos/latest?${new URLSearchParams({ page: 1, per_page: 24, ...p })}`);
export const sites = () => api('/sites');
export const status = () => api('/refresh');
export const links = () => api('/links');
export const health = () => api('/health');
export const triggerRefresh = () =>
  fetch(`${activeApiBase}/refresh?api_key=${KEY}`, { method: 'POST' })
    .then(async (r) => {
      if (!r.ok && activeApiBase !== '/api') {
        const fallback = await fetch(`/api/refresh?api_key=${KEY}`, { method: 'POST' });
        return fallback.json();
      }
      return r.json();
    });
export const dbStats = () => api('/db').catch(() => null);
export const videoById = (id) => api(`/videos/${id}`);

/**
 * Proxy thumbnail URL through backend to bypass CDN hotlink blocking / CORS restrictions.
 */
export function proxyImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('/dev/api/fetch-image') || url.startsWith('/api/fetch-image') || url.startsWith('data:')) {
    return url;
  }
  return `${activeApiBase}/fetch-image?url=${encodeURIComponent(url)}&api_key=${KEY}`;
}

/**
 * Proxy video URL through backend to bypass CDN CORS / ORB restrictions.
 */
export function proxyVideoUrl(url, force = false) {
  if (!url) return url;
  const proxyOn = force || (typeof localStorage !== 'undefined' && localStorage.getItem('videohub_proxy') === 'on');
  if (!proxyOn) return url;
  return `${activeApiBase}/fetch-video?url=${encodeURIComponent(url)}&api_key=${KEY}`;
}

/**
 * Measure live latency to the backend API in milliseconds.
 */
export async function pingLatency() {
  const start = performance.now();
  try {
    await health();
    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
}
