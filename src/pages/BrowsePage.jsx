import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import Pagination from '../components/Pagination';
import { browse, sites } from '../api/client';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const q = searchParams.get('q') || '';
  const site = searchParams.get('site') || '';

  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [siteList, setSiteList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch sites once
  useEffect(() => {
    sites().then(setSiteList).catch(() => {});
  }, []);

  // Fetch videos
  useEffect(() => {
    setLoading(true);
    const params = { page, per_page: 20 };
    if (q) params.q = q;
    if (site) params.site = site;
    browse(params)
      .then(data => {
        setVideos(data.videos || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, q, site]);

  const updateParams = useCallback((newParams) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      return next;
    });
  }, [setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const form = e.target;
    updateParams({ q: form.q.value, site: form.site.value, page: 1 });
  };

  return (
    <div className="page">
      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          name="q"
          type="text"
          placeholder="Search titles..."
          defaultValue={q}
        />
        <select name="site" defaultValue={site}>
          <option value="">All Sites</option>
          {siteList.map(s => (
            <option key={s.label} value={s.label}>{s.label}</option>
          ))}
        </select>
        <button type="submit">Search</button>
      </form>

      {total > 0 && <p className="result-count">{total} videos found</p>}

      {loading ? (
        <div className="spinner" />
      ) : videos.length === 0 ? (
        <p className="error-msg">No videos found.</p>
      ) : (
        <>
          <div className="video-grid">
            {videos.map(v => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={p => updateParams({ page: p })}
          />
        </>
      )}
    </div>
  );
}
