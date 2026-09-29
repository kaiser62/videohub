import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import SiteChips from '../components/SiteChips';
import { shuffle, latest, recent, sites, status } from '../api/client';
import { IconPlay, IconFlame, IconClock, IconSparkles, IconShuffle, IconChevronLeft, IconChevronRight } from '../components/Icons';

export default function HomePage() {
  const navigate = useNavigate();
  const [heroVideos, setHeroVideos] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [tabVideos, setTabVideos] = useState([]);
  const [tab, setTab] = useState('trending');
  const [siteList, setSiteList] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const heroTimerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      shuffle(6),
      shuffle(24),
      sites(),
      status(),
      recent({ limit: 12 }),
    ])
      .then(([heroData, tabData, sitesData, statusData, recentData]) => {
        setHeroVideos(heroData.videos || []);
        setTabVideos(tabData.videos || []);
        setSiteList(sitesData || []);
        setStats(statusData);
        setRecentVideos(recentData.videos || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate hero spotlight every 7 seconds
  useEffect(() => {
    if (heroVideos.length <= 1) return;
    heroTimerRef.current = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroVideos.length);
    }, 7000);
    return () => clearInterval(heroTimerRef.current);
  }, [heroVideos.length]);

  const switchTab = async (newTab) => {
    if (newTab === tab) return;
    setTab(newTab);
    setTabLoading(true);
    try {
      if (newTab === 'trending') {
        const data = await shuffle(24);
        setTabVideos(data.videos || []);
      } else if (newTab === 'latest') {
        const data = await latest({ per_page: 24 });
        setTabVideos(data.videos || []);
      } else if (newTab === 'longest') {
        // Fetch a batch and sort descending by duration
        const data = await shuffle(40);
        const sorted = (data.videos || []).sort((a, b) => (b.duration || 0) - (a.duration || 0)).slice(0, 24);
        setTabVideos(sorted);
      } else if (newTab === 'random') {
        const data = await shuffle(24);
        setTabVideos(data.videos || []);
      }
    } catch {}
    setTabLoading(false);
  };

  const nextHero = (e) => {
    e?.stopPropagation();
    if (heroVideos.length === 0) return;
    setHeroIndex(prev => (prev + 1) % heroVideos.length);
  };

  const prevHero = (e) => {
    e?.stopPropagation();
    if (heroVideos.length === 0) return;
    setHeroIndex(prev => (prev - 1 + heroVideos.length) % heroVideos.length);
  };

  if (loading) {
    return (
      <div className="page page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const hero = heroVideos[heroIndex];

  return (
    <div className="page home-page">
      {/* Hero Spotlight Showcase */}
      {hero && (
        <section
          className="hero-spotlight"
          onClick={() => navigate(`/watch?id=${hero.id}`, { state: { video: hero } })}
        >
          {/* Ambient Optical Bloom */}
          <div className="hero-bloom" />

          {/* Background Media */}
          <div className="hero-backdrop-wrap">
            {hero.thumbnail ? (
              <img
                src={hero.thumbnail}
                alt=""
                className="hero-backdrop-img"
              />
            ) : (
              <div className="hero-placeholder-art" />
            )}
            <div className="hero-gradient-mask" />
          </div>

          {/* Spotlight Content Overlay */}
          <div className="hero-content">
            <div className="hero-badge-row">
              <span className="hero-site-pill">{hero.site}</span>
              {hero.duration && (
                <span className="hero-duration-pill tnum">
                  {Math.round(hero.duration)}s
                </span>
              )}
              <span className="hero-featured-tag">FEATURED STREAM</span>
            </div>

            <h1 className="hero-title">{hero.title}</h1>

            <div className="hero-actions">
              <button
                className="btn-hero-watch"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/watch?id=${hero.id}`, { state: { video: hero } });
                }}
              >
                <IconPlay size={18} />
                <span>Watch Stream</span>
              </button>

              <button
                className="btn-hero-browse"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/browse?site=${encodeURIComponent(hero.site)}`);
                }}
              >
                <span>Browse {hero.site}</span>
              </button>
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            className="hero-nav-arrow arrow-prev"
            onClick={prevHero}
            aria-label="Previous Spotlight"
          >
            <IconChevronLeft size={22} />
          </button>
          <button
            className="hero-nav-arrow arrow-next"
            onClick={nextHero}
            aria-label="Next Spotlight"
          >
            <IconChevronRight size={22} />
          </button>

          {/* Carousel Progress Indicators */}
          <div className="hero-indicators">
            {heroVideos.map((_, idx) => (
              <button
                key={idx}
                className={`hero-dot ${idx === heroIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setHeroIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Source Filter Rail */}
      {siteList.length > 0 && (
        <section className="home-sites-section">
          <div className="section-header-compact">
            <span className="section-label">CHANNELS & SOURCES</span>
            <Link to="/sites" className="section-link">View All Channels →</Link>
          </div>
          <SiteChips sites={siteList} />
        </section>
      )}

      {/* Tabbed Video Discovery Section */}
      <section className="home-catalog-section">
        <div className="catalog-tabs-bar">
          <div className="catalog-tabs">
            <button
              className={`catalog-tab ${tab === 'trending' ? 'active' : ''}`}
              onClick={() => switchTab('trending')}
            >
              <IconFlame size={16} />
              <span>Trending</span>
            </button>
            <button
              className={`catalog-tab ${tab === 'latest' ? 'active' : ''}`}
              onClick={() => switchTab('latest')}
            >
              <IconSparkles size={16} />
              <span>Latest Releases</span>
            </button>
            <button
              className={`catalog-tab ${tab === 'longest' ? 'active' : ''}`}
              onClick={() => switchTab('longest')}
            >
              <IconClock size={16} />
              <span>Longest Duration</span>
            </button>
            <button
              className={`catalog-tab ${tab === 'random' ? 'active' : ''}`}
              onClick={() => switchTab('random')}
            >
              <IconShuffle size={16} />
              <span>Random Roll</span>
            </button>
          </div>

          <Link to="/browse" className="catalog-explore-btn">
            Browse All Videos →
          </Link>
        </div>

        {tabLoading ? (
          <div className="spinner" />
        ) : (
          <div className="video-grid">
            {tabVideos.map((v, i) => (
              <VideoCard key={v.id || i} video={v} />
            ))}
          </div>
        )}
      </section>

      {/* What's New Row */}
      {recentVideos.length > 0 && (
        <section className="home-recent-section">
          <div className="section-header">
            <h2 className="section-title">
              <span>Fresh Drops & New Ingestion</span>
              <span className="section-badge">LAST 12H</span>
            </h2>
            <Link to="/browse?sort=newest" className="section-link">See More Fresh →</Link>
          </div>
          <div className="video-grid">
            {recentVideos.slice(0, 12).map((v, i) => (
              <VideoCard key={v.id || i} video={v} />
            ))}
          </div>
        </section>
      )}

      {/* Platform Status Ticker Footer */}
      {stats && (
        <footer className="home-status-ticker">
          <div className="ticker-item">
            <span className="ticker-label">SOURCES</span>
            <span className="ticker-value tnum">{siteList.length} Connected</span>
          </div>
          <div className="ticker-divider">/</div>
          <div className="ticker-item">
            <span className="ticker-label">EXTRACTION ENGINE</span>
            <span className={`ticker-value ${stats.running ? 'running' : 'idle'}`}>
              {stats.running ? 'Indexing Feeds' : 'Standing By'}
            </span>
          </div>
          <div className="ticker-divider">/</div>
          <div className="ticker-item">
            <span className="ticker-label">SYSTEM CLOCK</span>
            <span className="ticker-value tnum">
              {stats.last_full ? formatTimeAgo(stats.last_full) : 'Recently'}
            </span>
          </div>
        </footer>
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
