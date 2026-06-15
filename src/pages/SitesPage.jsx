import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sites } from '../api/client';

export default function SitesPage() {
  const [siteList, setSiteList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    sites()
      .then(setSiteList)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="page">
      <h1 className="section-title">Browse by Site</h1>
      {siteList.length === 0 ? (
        <p className="error-msg">No sites available.</p>
      ) : (
        <div className="sites-grid">
          {siteList.map(s => (
            <div
              key={s.label}
              className="site-card"
              onClick={() => navigate(`/browse?site=${encodeURIComponent(s.label)}`)}
            >
              <div className="site-card-icon">
                {s.label?.charAt(0).toUpperCase()}
              </div>
              <div className="site-card-body">
                <h3>{s.label}</h3>
                <span className="site-card-url">{s.url}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
