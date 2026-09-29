import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useCallback } from 'react';
import { proxyImageUrl } from '../api/client';
import { IconPlay } from './Icons';

function formatDuration(sec) {
  if (!sec || isNaN(sec) || sec <= 0) return null;
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const remSec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
  }
  return `${m}:${remSec.toString().padStart(2, '0')}`;
}

function isNewVideo(addedAt) {
  if (!addedAt) return false;
  // Within last 12 hours
  return (Date.now() / 1000) - addedAt < 43200;
}

export default function VideoCard({ video, index, queueIndex, compact = false }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [usedProxy, setUsedProxy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isUpNext = queueIndex !== undefined && index === queueIndex;
  const isRecent = useMemo(() => isNewVideo(video.added_at), [video.added_at]);
  const formattedDuration = useMemo(() => formatDuration(video.duration), [video.duration]);

  // Determine current image source
  const currentImgSrc = useMemo(() => {
    if (!video.thumbnail) return null;
    if (usedProxy) {
      return proxyImageUrl(video.thumbnail);
    }
    return video.thumbnail;
  }, [video.thumbnail, usedProxy]);

  const handleImgError = useCallback(() => {
    if (!usedProxy && video.thumbnail) {
      // First attempt failed, retry with backend image proxy
      setUsedProxy(true);
    } else {
      // Proxy also failed, show graphic placeholder
      setImgError(true);
    }
  }, [usedProxy, video.thumbnail]);

  const handleClick = () => {
    navigate(`/watch?id=${video.id}`, { state: { video } });
  };

  const handleSiteClick = (e) => {
    e.stopPropagation();
    navigate(`/browse?site=${encodeURIComponent(video.site)}`);
  };

  const showPlaceholder = !currentImgSrc || imgError;

  return (
    <article
      className={`video-card ${isUpNext ? 'up-next' : ''} ${compact ? 'compact' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Watch ${video.title}`}
    >
      <div className="thumb-container">
        {showPlaceholder ? (
          <div className="thumb-placeholder">
            <div className="placeholder-pattern" />
            <span className="placeholder-monogram">{video.site?.charAt(0) || '▶'}</span>
            <span className="placeholder-label">{video.site || 'Video'}</span>
          </div>
        ) : (
          <img
            className={`thumb-img ${loaded ? 'loaded' : ''}`}
            src={currentImgSrc}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={handleImgError}
          />
        )}

        {/* Ambient Hover Overlay with glowing play button */}
        <div className="thumb-overlay">
          <div className="play-dial">
            <IconPlay size={20} className="play-dial-icon" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="card-top-badges">
          <span
            className="site-badge"
            onClick={handleSiteClick}
            title={`Filter by ${video.site}`}
          >
            {video.site}
          </span>
          {isRecent && <span className="badge-new">NEW</span>}
          {isUpNext && <span className="badge-up-next">UP NEXT</span>}
        </div>

        {/* Bottom Duration Badge */}
        {formattedDuration && (
          <span className="duration-pill tnum">
            {formattedDuration}
          </span>
        )}
      </div>

      {/* Card Info */}
      <div className="card-body">
        <h4 className="card-title" title={video.title}>
          {video.title || 'Untitled Video'}
        </h4>
        <div className="card-meta">
          <span className="card-site-name" onClick={handleSiteClick}>
            {video.site}
          </span>
          <span className="card-meta-dot">·</span>
          <span className="card-id tnum">#{video.id}</span>
        </div>
      </div>
    </article>
  );
}
