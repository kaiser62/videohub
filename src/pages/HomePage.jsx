import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import SiteChips from '../components/SiteChips';
import { shuffle, latest, recent, sites, status } from '../api/client';

export default function HomePage() {
  const navigate = useNavigate();
  const [heroVideos, setHeroVideos] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [tabVideos, setTabVideos] = useState([]);
  const [tab, setTab] = useState('trending');
  const [latestVideos, setLatestVideos] = useState([]);
  const [siteList, setSiteList] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroTimer = useRef(null);

  useEffect(() => {
    Promise.all([
      shuffle(5),
      shuffle(18),
      latest({ per_page: 6 }),
      sites(),
      status(),
      recent({ limit: 6 }),
    ]).then(([hero, tabVids, latestVids, siteData, statusData, recentData]) => {
      setHeroVideos(hero.videos || []);
      setTabVideos(tabVids.videos || []);
      setRecentVideos(recentData.videos || []);
      setLatestVideos(latestVids.videos || []);
      setSiteList(siteData || []);
      setStats(statusData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Auto-rotate hero
  useEffect(() => {
    if (heroVideos.length < 2) return;
    heroTimer.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroVideos.length);
    }, 8000);
    return () => clearInterval(heroTimer.current);
  }, [heroVideos.length]);

  const switchTab = async (newTab) => {
    setTab(newTab);
    const tabMap = {
      trending: () => shuffle(18),
      latest: () => latest({ per_page: 18 }),
      random: () => shuffle(18),
    };
    try {
      const data = await tabMap[newTab]();
      setTabVideos(data.videos || []);
    } catch {}
  };

  if (loading) return <div className="spinner" />;

  const hero = heroVideos[heroIndex];

  return (
    <div className="page">
      {/* Hero */}
      {hero && (
        <div
          className="hero-section"
          onClick={() => navigate('/watch', { state: { video: hero } })}
        >
          {hero.thumbnail ? (
            <img src={hero.thumbnail} alt="" className="hero-thumb" />
          ) : (
            <div className="hero-placeholder">{hero.site?.charAt(0)}</div>
          )}
          <div className="hero-overlay">
            <h2 className="hero-title">{hero.title}</h2>
            <span className="hero-site">{hero.site}</span>
          </div>
          <div className="hero-dots">
            {heroVideos.map((_, i) => (
              <span
                key={i}
                className={`hero-dot${i === heroIndex ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setHeroIndex(i); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabbed Grid */}
      <section style={{ marginTop: 24 }}>
        <div className="tab-bar">
          {['trending', 'latest', 'random'].map(t => (
            <button
              key={t}
              className={`tab-btn${tab === t ? ' active' : ''}`}
              onClick={() => switchTab(t)}
            >
              {t === 'trending' ? '🔥 Trending' : t === 'latest' ? '🆕 Latest' : '🎲 Random'}
            </button>
          ))}
        </div>
        <div className="video-grid">
          {tabVideos.map(v => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
        <div style={{ marginTop: 10, textAlign: 'right' }}>
          <a href="/browse" className="view-more">View More →</a>
        </div>
      </section>

      {/* Browse by Site */}
      {siteList.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h3 className="section-title">Browse by Site</h3>
          <SiteChips sites={siteList} />
        </section>
      )}

      {/* What's New */}
      {recentVideos.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h3 className="section-title">🆕 What's New</h3>
          <div className="video-grid">
            {recentVideos.map(v => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Uploads */}
      <section style={{ marginTop: 32 }}>
        <h3 className="section-title">Latest Uploads</h3>
        <div className="video-grid">
          {latestVideos.map(v => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
        <div style={{ marginTop: 10, textAlign: 'right' }}>
          <a href="/browse" className="view-more">View More →</a>
        </div>
      </section>

      {/* Footer stats */}
      {stats && (
        <footer className="site-footer">
          {tabVideos.length + latestVideos.length} videos from {siteList.length} sites
          {stats.last_full && ` | Last updated: ${formatAgo(stats.last_full)} ago`}
        </footer>
      )}
    </div>
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
