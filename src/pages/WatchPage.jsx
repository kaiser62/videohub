import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import VideoCard from '../components/VideoCard';
import AutoplayToggle from '../components/AutoplayToggle';
import ProxyToggle from '../components/ProxyToggle';
import useAutoplay from '../hooks/useAutoplay';
import useProxy from '../hooks/useProxy';
import { shuffle } from '../api/client';

const STUDIO_BASE = 'http://192.168.1.109:7860/studio/';

export default function WatchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { autoplay, toggle: toggleAutoplay } = useAutoplay();
  const { proxy, toggle: toggleProxy } = useProxy();
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);

  const video = location.state?.video;
  const [related, setRelated] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(video);
  const [loading, setLoading] = useState(true);

  if (!video) return <Navigate to="/browse" replace />;

  const uniqueVideos = (arr, excludeId) => {
    const seen = new Set();
    seen.add(excludeId);
    return arr.filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });
  };

  useEffect(() => {
    setLoading(true);
    shuffle(12, video.site)
      .then(data => {
        setRelated(uniqueVideos(data.videos || [], video.id));
        setQueueIndex(0);
        setCurrentVideo(video);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [video.id, video.site]);

  const playNext = useCallback(() => {
    if (related.length === 0) return;
    const nextIndex = queueIndex + 1;
    if (nextIndex < related.length) {
      setQueueIndex(nextIndex);
      setCurrentVideo(related[nextIndex]);
    } else {
      shuffle(12, video.site).then(data => {
        const existingIds = new Set(related.map(v => v.id));
        existingIds.add(currentVideo?.id);
        const fresh = (data.videos || []).filter(v => !existingIds.has(v.id));
        if (fresh.length > 0) {
          setRelated(prev => [...prev, ...fresh]);
          setQueueIndex(prev => prev + 1);
          setCurrentVideo(fresh[0]);
        }
      }).catch(() => {});
    }
  }, [related, queueIndex, video.site, currentVideo]);

  const handleEnded = () => { if (autoplay) playNext(); };
  const handleError = () => { if (autoplay) playNext(); };

  const cv = currentVideo || video;
  const rawUrl = cv?.video_url || video.video_url;
  const studioUrl = `${STUDIO_BASE}?url=${encodeURIComponent(rawUrl)}`;

  return (
    <div className="page watch-page">
      <VideoPlayer
        key={cv.id}
        src={rawUrl}
        rawSrc={rawUrl}
        onEnded={handleEnded}
        onError={handleError}
        autoplay={true}
        onDurationChange={setDuration}
        ref={playerRef}
      />

      {/* Title + toggles */}
      <div className="video-info">
        <h1 className="video-title">{cv.title}</h1>
        <div className="video-toggles">
          <AutoplayToggle enabled={autoplay} onToggle={toggleAutoplay} />
          <ProxyToggle enabled={proxy} onToggle={toggleProxy} />
        </div>
      </div>

      {/* Metadata + actions */}
      <div className="video-meta">
        <div className="meta-left">
          <span className="meta-badge site-badge">{cv.site}</span>
          <span className="meta-item">ID: {cv.id}</span>
          <span className="meta-item">Duration: {fmtDuration(duration) || '—'}</span>
        </div>
        <div className="meta-actions">
          <button className="meta-btn studio-btn" title="Open in external editor"
            onClick={() => window.open(studioUrl, '_blank')}>
            <span className="meta-btn-icon">🎬</span> Studio
          </button>
          <a className="meta-btn" href={rawUrl} download target="_blank" rel="noopener" title="Download video">
            <span className="meta-btn-icon">⬇</span> Download
          </a>
          <button className="meta-btn" onClick={() => { navigator.clipboard?.writeText(rawUrl); }} title="Copy video URL">
            <span className="meta-btn-icon">🔗</span> Copy URL
          </button>
        </div>
      </div>

      {/* Video URL (collapsed, copy-friendly) */}
      <details className="video-url-details">
        <summary>Video URL</summary>
        <code className="video-url-text">{rawUrl}</code>
      </details>

      {/* Related */}
      <section style={{ marginTop: 24 }}>
        <h3 className="section-title">
          {autoplay && related.length > 0 ? 'Up Next' : 'Related Videos'}
        </h3>
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="video-grid">
            {related.map((v, i) => (
              <VideoCard
                key={v.id}
                video={v}
                index={i}
                queueIndex={autoplay ? queueIndex : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function fmtDuration(s) {
  if (!s || !isFinite(s)) return null;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
