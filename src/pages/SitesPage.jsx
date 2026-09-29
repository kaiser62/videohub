import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { sites, health } from '../api/client';
import { IconSearch, IconClear, IconShuffle, IconFilm, IconExternal } from '../components/Icons';

export default function SitesPage() {
  const [siteList, setSiteList] = useState([]);
  const [siteCounts, setSiteCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      sites(),
      health().catch(() => null)
    ])
      .then(([sitesData, healthData]) => {
        setSiteList(sitesData || []);
        if (healthData?.database?.sites_merged) {
          setSiteCounts(healthData.database.sites_merged);
        } else if (healthData?.database?.sites) {
          setSiteCounts(healthData.database.sites);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredSites = useMemo(() => {
    if (!searchFilter.trim()) return siteList;
    const q = searchFilter.toLowerCase();
    return siteList.filter(s =>
      s.label.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
    );
  }, [siteList, searchFilter]);

  const totalVideosAcrossSites = useMemo(() => {
    return Object.values(siteCounts).reduce((acc, c) => acc + (c || 0), 0);
  }, [siteCounts]);

  if (loading) {
    return (
      <div className="page page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page sites-page">
      {/* Header Banner */}
      <div className="sites-header-panel">
        <div className="sites-header-top">
          <div>
            <h1 className="sites-title">Content Sources & Channels</h1>
            <p className="sites-subtitle">
              Aggregated across <strong className="tnum">{siteList.length}</strong> active streaming portals
              {totalVideosAcrossSites > 0 && <span> with <strong className="tnum">{totalVideosAcrossSites.toLocaleString()}</strong> indexed reels</span>}
            </p>
          </div>

          <div className="sites-search-box">
            <IconSearch size={16} className="sites-search-icon" />
            <input
              type="text"
              placeholder="Filter channels..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
            {searchFilter && (
              <button
                className="sites-clear-btn"
                onClick={() => setSearchFilter('')}
                aria-label="Clear filter"
              >
                <IconClear size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredSites.length === 0 ? (
        <div className="browse-empty-state">
          <h3>No matching sources</h3>
          <p>No channels match "{searchFilter}".</p>
          <button className="btn-accent" onClick={() => setSearchFilter('')}>
            Show All Sources
          </button>
        </div>
      ) : (
        <div className="sites-directory-grid">
          {filteredSites.map((s, idx) => {
            const count = siteCounts[s.label] || 0;
            const domain = s.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

            return (
              <div
                key={s.label}
                className="site-directory-card"
                onClick={() => navigate(`/browse?site=${encodeURIComponent(s.label)}`)}
              >
                <div className="site-card-top">
                  <div className={`site-avatar avatar-style-${idx % 6}`}>
                    <span>{s.label.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="site-headings">
                    <h3 className="site-name">{s.label}</h3>
                    <span className="site-domain">{domain}</span>
                  </div>
                </div>

                <div className="site-card-stats">
                  <div className="site-stat-badge">
                    <IconFilm size={14} />
                    <span className="tnum">{count > 0 ? `${count.toLocaleString()} videos` : 'Indexed'}</span>
                  </div>
                  <div className="site-status-pill">
                    <span className="dot-green" />
                    <span>Active</span>
                  </div>
                </div>

                <div className="site-card-actions">
                  <button
                    className="site-action-btn primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/browse?site=${encodeURIComponent(s.label)}`);
                    }}
                  >
                    <span>Browse Channel</span>
                  </button>

                  <button
                    className="site-action-btn icon-only"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/shuffle?site=${encodeURIComponent(s.label)}`);
                    }}
                    title="Shuffle random videos from this source"
                  >
                    <IconShuffle size={16} />
                  </button>

                  <a
                    className="site-action-btn icon-only"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Visit original website"
                  >
                    <IconExternal size={16} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
