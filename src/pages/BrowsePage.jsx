import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import Pagination from '../components/Pagination';
import SiteChips from '../components/SiteChips';
import { browse, sites } from '../api/client';
import { IconSearch, IconClear } from '../components/Icons';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const q = searchParams.get('q') || '';
  const site = searchParams.get('site') || '';
  const sort = searchParams.get('sort') || 'newest';

  const [searchVal, setSearchVal] = useState(q);
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [siteList, setSiteList] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceTimerRef = useRef(null);

  // Sync internal input state if query param changes externally (e.g. from header search)
  useEffect(() => {
    setSearchVal(q);
  }, [q]);

  // Fetch sites once
  useEffect(() => {
    sites()
      .then(data => setSiteList(data || []))
      .catch(() => {});
  }, []);

  const updateParams = useCallback((newParams) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          next.set(k, v);
        } else {
          next.delete(k);
        }
      });
      return next;
    });
  }, [setSearchParams]);

  // Fetch videos whenever page, query, or site changes
  useEffect(() => {
    setLoading(true);
    const params = { page, per_page: 24 };
    if (q) params.q = q;
    if (site) params.site = site;

    browse(params)
      .then(data => {
        let vids = data.videos || [];
        // Apply client-side sorting if needed
        if (sort === 'longest') {
          vids = [...vids].sort((a, b) => (b.duration || 0) - (a.duration || 0));
        } else if (sort === 'shortest') {
          vids = [...vids].sort((a, b) => (a.duration || 0) - (b.duration || 0));
        } else if (sort === 'title') {
          vids = [...vids].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        }
        setVideos(vids);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, q, site, sort]);

  // Live search debounce handler (300ms)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateParams({ q: val.trim(), page: 1 });
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchVal('');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    updateParams({ q: '', page: 1 });
  };

  const handleSiteSelect = (e) => {
    updateParams({ site: e.target.value, page: 1 });
  };

  const handleSortSelect = (e) => {
    updateParams({ sort: e.target.value, page: 1 });
  };

  const resetAllFilters = () => {
    setSearchVal('');
    setSearchParams(new URLSearchParams({ page: 1 }));
  };

  return (
    <div className="page browse-page">
      {/* Search & Filter Header Banner */}
      <div className="browse-header-panel">
        <div className="browse-top-row">
          <div className="browse-search-box">
            <IconSearch size={18} className="browse-search-icon" />
            <input
              type="text"
              className="browse-search-input"
              placeholder="Filter by title, keywords, tags..."
              value={searchVal}
              onChange={handleSearchChange}
            />
            {searchVal && (
              <button
                type="button"
                className="browse-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <IconClear size={16} />
              </button>
            )}
          </div>

          <div className="browse-dropdowns-group">
            {/* Site selector */}
            <div className="custom-select-wrap">
              <select
                value={site}
                onChange={handleSiteSelect}
                className="browse-select"
                aria-label="Filter by source"
              >
                <option value="">All Sources ({siteList.length})</option>
                {siteList.map(s => (
                  <option key={s.label} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Sort selector */}
            <div className="custom-select-wrap">
              <select
                value={sort}
                onChange={handleSortSelect}
                className="browse-select"
                aria-label="Sort order"
              >
                <option value="newest">Newest Ingestion</option>
                <option value="longest">Longest Duration</option>
                <option value="shortest">Shortest Duration</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick site chips row */}
        <div className="browse-chips-wrap">
          <SiteChips sites={siteList} activeSite={site} />
        </div>
      </div>

      {/* Results Status Bar */}
      <div className="browse-results-bar">
        <div className="results-info">
          {total > 0 ? (
            <span className="results-count-text">
              Showing <strong>{videos.length}</strong> of <strong className="tnum">{total.toLocaleString()}</strong> videos
              {site && <span> in <mark className="filter-pill">{site}</mark></span>}
              {q && <span> matching "<mark className="filter-pill">{q}</mark>"</span>}
            </span>
          ) : !loading ? (
            <span className="results-count-text">No videos found</span>
          ) : (
            <span className="results-count-text">Searching stream catalog...</span>
          )}
        </div>

        {(site || q || sort !== 'newest') && (
          <button className="btn-reset-filters" onClick={resetAllFilters}>
            <span>Reset Filters</span>
            <IconClear size={14} />
          </button>
        )}
      </div>

      {/* Main Video Grid */}
      {loading ? (
        <div className="browse-loading-state">
          <div className="spinner" />
          <p>Retrieving video metadata...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="browse-empty-state">
          <div className="empty-icon-wrap">
            <IconSearch size={32} />
          </div>
          <h3>No matching streams found</h3>
          <p>Try searching with broader terms or clear your active site filters.</p>
          <button className="btn-accent" onClick={resetAllFilters}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {videos.map((v, i) => (
              <VideoCard key={v.id || i} video={v} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              updateParams({ page: p });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
