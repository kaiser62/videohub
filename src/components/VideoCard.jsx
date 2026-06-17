import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

function isNew(addedAt) {
  if (!addedAt) return false;
  return (Date.now() / 1000) - addedAt < 21600; // 6 hours
}

export default function VideoCard({ video, index, queueIndex }) {
  const navigate = useNavigate();
  const isUpNext = queueIndex !== undefined && index === queueIndex;
  const recent = useMemo(() => isNew(video.added_at), [video.added_at]);

  const handleClick = () => {
    navigate('/watch', { state: { video } });
  };

  const handleSiteClick = (e) => {
    e.stopPropagation();
    navigate(`/browse?site=${encodeURIComponent(video.site)}`);
  };

  return (
    <div
      className={`video-card${isUpNext ? ' up-next' : ''}`}
      onClick={handleClick}
    >
      <div className="thumb-wrap">
        {video.thumbnail ? (
          <img
            className="thumb"
            src={video.thumbnail}
            alt=""
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="thumb-placeholder">{video.site?.charAt(0) || '?'}</div>
        )}
        <div className="thumb-overlay">
          <span className="play-icon">▶</span>
        </div>
        <span className="duration-badge" style={{cursor:'pointer'}} onClick={handleSiteClick} title="Browse this site">{video.site}</span>
        {isUpNext && <span className="up-next-badge">Up next</span>}
        {recent && <span className="new-badge">New</span>}
      </div>
      <div className="card-body">
        <p className="card-title">{video.title}</p>
        <span className="card-site" style={{cursor:'pointer'}} onClick={handleSiteClick} title="Browse this site">{video.site}</span>
      </div>
    </div>
  );
}
