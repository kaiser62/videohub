import { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import { shuffle } from '../api/client';

const CACHE_KEY = 'videohub_shuffle';

export default function ShufflePage() {
  const [videos, setVideos] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchShuffle = async (shouldCache = true) => {
    setLoading(true);
    try {
      const data = await shuffle(30);
      const vids = data.videos || [];
      setVideos(vids);
      setCount(data.total || vids.length);
      if (shouldCache) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ videos: vids, count: data.total || vids.length }));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.videos?.length) {
          setVideos(parsed.videos);
          setCount(parsed.count || parsed.videos.length);
          setLoading(false);
          return;
        }
      } catch {
        // corrupted cache, fall through
      }
    }
    fetchShuffle();
  }, []);

  const handleShuffle = () => {
    sessionStorage.removeItem(CACHE_KEY);
    fetchShuffle(false);
  };

  return (
    <div className="page">
      <div className="filter-bar" style={{ alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>🎲 Shuffle</h2>
        <button onClick={handleShuffle} disabled={loading}>
          {loading ? 'Shuffling…' : 'Shuffle Again'}
        </button>
      </div>

      {!loading && <p className="result-count">{count} results</p>}

      {loading ? (
        <div className="spinner" />
      ) : videos.length === 0 ? (
        <p className="error-msg">No videos found.</p>
      ) : (
        <div className="video-grid">
          {videos.map(v => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
