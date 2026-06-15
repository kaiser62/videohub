import { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/StatCard';
import ProxyToggle from '../components/ProxyToggle';
import useProxy from '../hooks/useProxy';
import { health, status, browse, sites, links, dbStats, triggerRefresh } from '../api/client';

export default function HealthPage() {
  const { proxy, toggle } = useProxy();
  const [data, setData] = useState(null);
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [h, s, v, st, l, db] = await Promise.all([
        health(),
        status(),
        browse({ per_page: 1 }),
        sites(),
        links(),
        dbStats(),
      ]);

      let totalLinks = 0;
      if (l?.sites) {
        Object.values(l.sites).forEach(arr => { totalLinks += arr.length; });
      }

      setData({
        apiStatus: h.status,
        running: s.running,
        lastFull: s.last_full,
        lastLatest: s.last_latest,
        totalVideos: v.total,
        totalSites: st.length,
        totalLinks,
        _count: s._count,
      });
      if (db) setDbData(db);
    } catch (err) {
      setData({ apiStatus: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      await fetchAll();
    } catch {}
    setRefreshing(false);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="page">
      <h1 className="section-title">Server Health</h1>

      <div className="stats-grid">
        <StatCard
          label="API Status"
          value={data.apiStatus === 'ok' ? 'Online' : 'Error'}
          status={data.apiStatus === 'ok' ? 'ok' : 'error'}
        />
        <StatCard
          label="Extraction Running"
          value={data.running ? 'Yes' : 'No'}
          status={data.running ? 'warning' : 'ok'}
        />
        <StatCard label="Total Videos" value={data.totalVideos} />
        <StatCard label="Total Sites" value={data.totalSites} />
        <StatCard label="Total Links" value={data.totalLinks} />
        <StatCard
          label="Last Full Refresh"
          value={data.lastFull ? formatAgo(data.lastFull) + ' ago' : 'Never'}
        />
        <StatCard
          label="Last Latest Refresh"
          value={data.lastLatest ? formatAgo(data.lastLatest) + ' ago' : 'Never'}
        />
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <ProxyToggle enabled={proxy} onToggle={toggle} />
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          className="btn-primary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Trigger Manual Refresh'}
        </button>
      </div>

      {dbData && (
        <section style={{ marginTop: 32 }}>
          <h3 className="section-title">Database Overview</h3>
          <DbTable data={dbData} />
        </section>
      )}
    </div>
  );
}

function DbTable({ data }) {
  // /api/db can return various shapes — handle tables array or keyed object
  const tables = Array.isArray(data) ? data : (data.tables || data.sites || []);
  if (tables.length === 0) {
    return <p className="error-msg">No table data available.</p>;
  }
  return (
    <table className="db-table">
      <thead>
        <tr>
          {Object.keys(tables[0]).map(k => <th key={k}>{k}</th>)}
        </tr>
      </thead>
      <tbody>
        {tables.map((row, i) => (
          <tr key={i}>
            {Object.values(row).map((v, j) => <td key={j}>{v ?? '—'}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatAgo(ts) {
  const sec = Math.floor((Date.now() / 1000) - ts);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}
