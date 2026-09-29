import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { shuffle, sites } from '../api/client';
import { IconShuffle, IconRefresh } from '../components/Icons';

const CACHE_KEY = 'videohub_shuffle_state';

export default function ShufflePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const siteParam = searchParams.get('site') || '';

  const [videos, setVideos] = useState([]);
  const [count, setCount] = useState(24);
  const [selectedSite, setSelectedSite] = useState(siteParam);
  const [siteList, setSiteList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    sites().then(data => setSiteList(data || [])).catch(() => {});
  }, []);

  const fetchShuffle = async (c = count, s = selectedSite) => {
    setIsShuffling(true);
    try {
      const data = await shuffle(c, s);
      const vids = data.videos || [];
      setVideos(vids);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ videos: vids, count: c, site: s }));
    } catch {}
    setIsShuffling(false);
    setLoading(false);
  };

  useEffect(() => {
    // Check cached session
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached && !siteParam) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.videos?.length) {
          setVideos(parsed.videos);
          setCount(parsed.count || 24);
          setSelectedSite(parsed.site || '');
          setLoading(false);
          return;
        }
      } catch {}
    }
    fetchShuffle(count, siteParam);
  }, [siteParam]);

  const handleShuffleClick = () => {
    fetchShuffle(count, selectedSite);
  };

  const handleSiteChange = (e) => {
    const s = e.target.value;
    setSelectedSite(s);
    setSearchParams(s ? { site: s } : {});
    fetchShuffle(count, s);
  };

  const handleCountChange = (newCount) => {
    setCount(newCount);
    fetchShuffle(newCount, selectedSite);
  };

  return (
    <div className="page shuffle-page">
      {/* Control Banner */}
      <div className="shuffle-banner">
        <div className="shuffle-title-group">
          <div className="shuffle-icon-wrap">
            <IconShuffle size={24} />
          </div>
          <div>
            <h1 className="shuffle-title">Random Shuffle Reel</h1>
            <p className="shuffle-desc">Roll the dice to discover random uncut video gems from across all channels.</p>
          </div>
        </div>

        <div className="shuffle-actions-group">
          {/* Channel selector */}
          <select
            value={selectedSite}
            onChange={handleSiteChange}
            className="browse-select"
            aria-label="Filter shuffle by source"
          >
            <option value="">All Channels</option>
            {siteList.map(s => (
              <option key={s.label} value={s.label}>{s.label}</option>
            ))}
          </select>

          {/* Count chips */}
          <div className="shuffle-counts">
            {[12, 24, 48].map(c => (
              <button
                key={c}
                className={`shuffle-count-chip ${count === c ? 'active' : ''}`}
                onClick={() => handleCountChange(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Roll Button */}
          <button
            className={`btn-accent ${isShuffling ? 'loading' : ''}`}
            onClick={handleShuffleClick}
            disabled={isShuffling}
          >
            <IconRefresh size={16} className={isShuffling ? 'spin-icon' : ''} />
            <span>{isShuffling ? 'Rolling…' : 'Roll Again 🎲'}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner" />
        </div>
      ) : videos.length === 0 ? (
        <div className="browse-empty-state">
          <h3>No videos found in this roll</h3>
          <button className="btn-accent" onClick={handleShuffleClick}>
            Try Another Roll
          </button>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v, i) => (
            <VideoCard key={v.id || i} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
