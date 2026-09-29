import { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/StatCard';
import ProxyToggle from '../components/ProxyToggle';
import useProxy from '../hooks/useProxy';
import { health, status, browse, sites, links, dbStats, triggerRefresh, pingLatency } from '../api/client';
import { useToast } from '../components/Toast';
import { IconActivity, IconRefresh, IconServer, IconDatabase, IconGlobe, IconFilm, IconClock, IconShield } from '../components/Icons';

export default function HealthPage() {
  const { proxy, toggle: toggleProxy } = useProxy();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [dbData, setDbData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [h, s, v, st, l, db, lat] = await Promise.all([
        health(),
        status(),
        browse({ per_page: 1 }),
        sites(),
        links().catch(() => null),
        dbStats().catch(() => null),
        pingLatency()
      ]);

      let totalLinks = 0;
      if (l?.sites) {
        Object.values(l.sites).forEach(arr => { totalLinks += arr.length; });
      }

      setLatency(lat);
      setData({
        apiStatus: h.status || 'ok',
        running: s.running || false,
        lastFull: s.last_full,
        lastLatest: s.last_latest,
        totalVideos: h.database?.total_videos || v.total || 0,
        totalLatest: h.database?.total_latest || 0,
        newLast6h: h.database?.new_last_6h || 0,
        totalSites: st.length || 0,
        totalLinks,
        allSites: h.database?.all_sites || {},
        sitesMerged: h.database?.sites_merged || {},
        newCount: s.new_count || 0
      });

      if (db) setDbData(db);
    } catch {
      setData({ apiStatus: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    addToast('Initiating background extraction refresh...', 'info');
    try {
      await triggerRefresh();
      addToast('Refresh triggered successfully!', 'success');
      await fetchAll();
    } catch {
      addToast('Refresh request failed.', 'error');
    }
    setRefreshing(false);
  };

  const handleManualPing = async () => {
    const lat = await pingLatency();
    setLatency(lat);
    addToast(`API Latency: ${lat}ms`, 'info', 2000);
  };

  if (loading) {
    return (
      <div className="page page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const isHealthy = data?.apiStatus === 'ok';

  return (
    <div className="page health-page">
      {/* System Status Hero Banner */}
      <div className="health-hero-banner">
        <div className="health-status-indicator">
          <div className={`status-beacon-ring ${isHealthy ? 'beacon-green' : 'beacon-red'}`}>
            <span className="status-beacon-core" />
          </div>
          <div>
            <h1 className="health-title">System Status: {isHealthy ? 'All Systems Operational' : 'Degraded State'}</h1>
            <p className="health-subtitle">
              Backend aggregation clusters, SQLite storage, and video feed crawlers are active.
            </p>
          </div>
        </div>

        <div className="health-quick-pills">
          <button className="latency-pill" onClick={handleManualPing} title="Click to test API ping">
            <IconActivity size={16} />
            <span>Latency: <strong className="tnum">{latency !== null ? `${latency} ms` : 'Testing…'}</strong></span>
          </button>

          <button
            className={`btn-accent ${refreshing ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <IconRefresh size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Starting Sync...' : 'Trigger Crawler Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="stats-dashboard-grid">
        <StatCard
          label="API Engine"
          value={isHealthy ? 'Online (200 OK)' : 'Error'}
          status={isHealthy ? 'ok' : 'error'}
          icon={IconServer}
          subtext="Oracle backend cluster"
        />

        <StatCard
          label="Extraction Worker"
          value={data?.running ? 'Running Crawl' : 'Standing By'}
          status={data?.running ? 'warning' : 'ok'}
          icon={IconActivity}
          subtext={data?.running ? 'Ingesting fresh videos' : 'Next schedule: 30m'}
        />

        <StatCard
          label="Total Catalog"
          value={data?.totalVideos ? data.totalVideos.toLocaleString() : '—'}
          icon={IconFilm}
          subtext="Indexed direct MP4 streams"
        />

        <StatCard
          label="Latest Releases"
          value={data?.totalLatest ? data.totalLatest.toLocaleString() : '—'}
          icon={IconClock}
          subtext="Fresh releases partition"
        />

        <StatCard
          label="Active Portals"
          value={data?.totalSites ?? '—'}
          icon={IconGlobe}
          subtext="Aggregated source sites"
        />

        <StatCard
          label="Ingested (Last 6h)"
          value={data?.newLast6h !== undefined ? `+${data.newLast6h}` : '—'}
          icon={IconDatabase}
          subtext="New items added recently"
        />

        <StatCard
          label="Full Sync Timestamp"
          value={data?.lastFull ? `${formatTimeAgo(data.lastFull)}` : 'Never'}
          icon={IconClock}
          subtext="Comprehensive catalog crawl"
        />

        <StatCard
          label="Latest Sync Timestamp"
          value={data?.lastLatest ? `${formatTimeAgo(data.lastLatest)}` : 'Never'}
          icon={IconClock}
          subtext="Fast incremental pass"
        />
      </div>

      {/* Network & Proxy Configuration Section */}
      <section className="health-config-card">
        <div className="config-card-left">
          <div className="config-icon-wrap">
            <IconShield size={24} />
          </div>
          <div>
            <h3>Content Delivery Network (CDN) Proxy Engine</h3>
            <p>
              When enabled, video playback is routed through the VideoHub server to bypass CORS, hotlink protection, and ORB restrictions on external CDNs.
            </p>
          </div>
        </div>
        <div className="config-card-right">
          <ProxyToggle enabled={proxy} onToggle={toggleProxy} />
        </div>
      </section>

      {/* Channel Video Distribution Table */}
      {data?.allSites && Object.keys(data.allSites).length > 0 && (
        <section className="health-table-section">
          <div className="table-header-row">
            <div>
              <h2 className="section-title">Channel Ingestion Breakdown</h2>
              <p className="table-subtitle">Distribution of indexed videos and latest feeds across all channels.</p>
            </div>
            <input
              type="text"
              placeholder="Search table..."
              value={siteSearch}
              onChange={e => setSiteSearch(e.target.value)}
              className="table-search-input"
            />
          </div>

          <div className="table-wrapper">
            <table className="health-db-table">
              <thead>
                <tr>
                  <th>Channel Name</th>
                  <th>Total Indexed Videos</th>
                  <th>Latest Feed Videos</th>
                  <th>Extraction Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.allSites)
                  .filter(([siteName]) => !siteSearch || siteName.toLowerCase().includes(siteSearch.toLowerCase()))
                  .sort((a, b) => (b[1]?.videos || 0) - (a[1]?.videos || 0))
                  .map(([siteName, siteInfo]) => (
                    <tr key={siteName}>
                      <td className="table-site-cell">
                        <span className="site-row-dot">●</span>
                        <strong>{siteName}</strong>
                      </td>
                      <td className="tnum font-medium">{(siteInfo.videos || 0).toLocaleString()}</td>
                      <td className="tnum">{(siteInfo.latest || 0).toLocaleString()}</td>
                      <td>
                        <span className="status-pill status-pill-active">Verified</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Raw Database Statistics Inspector */}
      {dbData && (
        <details className="health-config-card">
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Raw Database Diagnostics
          </summary>
          <pre style={{ marginTop: 12, fontSize: '0.75rem', overflowX: 'auto', color: 'var(--text-muted)', width: '100%' }}>
            {JSON.stringify(dbData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function formatTimeAgo(ts) {
  const diffSec = Math.floor(Date.now() / 1000 - ts);
  if (diffSec < 60) return 'Just now';
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}
