import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import AutoplayToggle from '../components/AutoplayToggle';
import ProxyToggle from '../components/ProxyToggle';
import useAutoplay from '../hooks/useAutoplay';
import useProxy from '../hooks/useProxy';
import { shuffle, videoById } from '../api/client';
import { useToast } from '../components/Toast';
import {
  IconCopy,
  IconCheck,
  IconDownload,
  IconExternal,
  IconShuffle,
  IconChevronLeft,
  IconChevronRight,
  IconFilm
} from '../components/Icons';

const STUDIO_BASE = 'http://192.168.1.109:7860/studio/';
const isStudio = typeof window !== 'undefined' && window.location.hostname.startsWith('studio');

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  fallbackCopy(text);
  return Promise.resolve();
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {}
  document.body.removeChild(ta);
}

export default function WatchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const queryId = searchParams.get('id');
  const locationVideo = location.state?.video;

  const { autoplay, toggle: toggleAutoplay } = useAutoplay();
  const { proxy, toggle: toggleProxy } = useProxy();

  const [currentVideo, setCurrentVideo] = useState(locationVideo || null);
  const [loadingVideo, setLoadingVideo] = useState(!locationVideo && !!queryId);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isTheater, setIsTheater] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const playerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // If opened directly by ?id=... without state, fetch video details from API
  useEffect(() => {
    if (!currentVideo && queryId) {
      setLoadingVideo(true);
      videoById(queryId)
        .then(data => {
          if (data && data.video_url) {
            setCurrentVideo(data);
          } else {
            navigate('/browse', { replace: true });
          }
        })
        .catch(() => {
          navigate('/browse', { replace: true });
        })
        .finally(() => setLoadingVideo(false));
    } else if (!currentVideo && !queryId) {
      navigate('/browse', { replace: true });
    }
  }, [currentVideo, queryId, navigate]);

  // Load recommendations / Up Next queue when active video changes
  useEffect(() => {
    if (!currentVideo) return;
    shuffle(16, currentVideo.site)
      .then(data => {
        const list = (data.videos || []).filter(v => v.id !== currentVideo.id);
        setQueue(list);
        setQueueIndex(0);
      })
      .catch(() => {});
  }, [currentVideo?.id, currentVideo?.site]);

  // Play next video in queue
  const playNext = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);

    if (queue.length === 0) return;
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      const nextVid = queue[nextIdx];
      setCurrentVideo(nextVid);
      navigate(`/watch?id=${nextVid.id}`, { state: { video: nextVid }, replace: true });
    } else {
      // Re-fetch more related
      shuffle(16, currentVideo?.site).then(data => {
        const fresh = (data.videos || []).filter(v => v.id !== currentVideo?.id);
        if (fresh.length > 0) {
          setQueue(fresh);
          setQueueIndex(0);
          setCurrentVideo(fresh[0]);
          navigate(`/watch?id=${fresh[0].id}`, { state: { video: fresh[0] }, replace: true });
        }
      });
    }
  }, [queue, queueIndex, currentVideo?.site, currentVideo?.id, navigate]);

  // Play previous video in queue
  const playPrev = useCallback(() => {
    if (queueIndex <= 0 || queue.length === 0) return;
    const prevIdx = queueIndex - 1;
    setQueueIndex(prevIdx);
    const prevVid = queue[prevIdx];
    setCurrentVideo(prevVid);
    navigate(`/watch?id=${prevVid.id}`, { state: { video: prevVid }, replace: true });
  }, [queueIndex, queue, navigate]);

  // Handle video end with autoplay countdown
  const handleEnded = useCallback(() => {
    if (!autoplay || queue.length === 0) return;
    let secondsLeft = 3;
    setCountdown(secondsLeft);
    addToast('Autoplaying next video in 3s...', 'info', 3000);

    countdownTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setCountdown(null);
        playNext();
      } else {
        setCountdown(secondsLeft);
      }
    }, 1000);
  }, [autoplay, queue.length, playNext, addToast]);

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  };

  const handleSelectFromQueue = (v, idx) => {
    cancelCountdown();
    setQueueIndex(idx);
    setCurrentVideo(v);
    navigate(`/watch?id=${v.id}`, { state: { video: v }, replace: true });
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    copyToClipboard(url);
    setCopiedLink(true);
    addToast('Direct link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleTheater = () => {
    setIsTheater(prev => !prev);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is focused inside an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        const v = playerRef.current?.getVideoElement();
        if (v) {
          if (v.paused) v.play().catch(() => {});
          else v.pause();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        e.preventDefault();
        const v = playerRef.current?.getVideoElement();
        if (v) v.currentTime = Math.max(0, v.currentTime - 10);
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        const v = playerRef.current?.getVideoElement();
        if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToggleTheater();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        const v = playerRef.current?.getVideoElement();
        if (v) v.muted = !v.muted;
      } else if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        playNext();
      } else if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        playPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playNext, playPrev]);

  if (loadingVideo || !currentVideo) {
    return (
      <div className="page page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const rawUrl = currentVideo.video_url;
  const studioUrl = isStudio ? `${STUDIO_BASE}?url=${encodeURIComponent(rawUrl)}` : '';
  const hasPrev = queueIndex > 0;
  const hasNext = queueIndex < queue.length - 1;

  return (
    <div className={`page watch-page ${isTheater ? 'theater-active' : ''}`}>
      {/* Top Breadcrumb / Stage Controls */}
      <div className="watch-stage-nav">
        <button className="stage-back-btn" onClick={() => navigate('/browse')}>
          <IconChevronLeft size={16} />
          <span>Back to Catalog</span>
        </button>

        <div className="stage-nav-center">
          <button
            className="queue-step-btn"
            onClick={playPrev}
            disabled={!hasPrev}
            title="Previous (Shift+P)"
          >
            <IconChevronLeft size={16} />
            <span>Prev</span>
          </button>
          <span className="queue-position-pill tnum">
            REEL {queueIndex + 1} / {queue.length + 1}
          </span>
          <button
            className="queue-step-btn"
            onClick={playNext}
            disabled={!hasNext && queue.length === 0}
            title="Next (Shift+N)"
          >
            <span>Next</span>
            <IconChevronRight size={16} />
          </button>
        </div>

        <div className="stage-tools-bar">
          <ProxyToggle enabled={proxy} onToggle={toggleProxy} compact={true} />
          <AutoplayToggle enabled={autoplay} onToggle={toggleAutoplay} compact={true} />
        </div>
      </div>

      {/* Main Watch Layout Grid */}
      <div className="watch-layout">
        {/* Left Column: Player & Meta */}
        <div className="watch-main-stage">
          <VideoPlayer
            ref={playerRef}
            key={currentVideo.id}
            src={rawUrl}
            rawSrc={rawUrl}
            title={currentVideo.title}
            site={currentVideo.site}
            onEnded={handleEnded}
            onError={() => {
              if (autoplay) playNext();
            }}
            autoplay={true}
            isTheater={isTheater}
            onToggleTheater={handleToggleTheater}
            proxyEnabled={proxy}
            onToggleProxy={toggleProxy}
          />

          {/* Autoplay Countdown Cancel Banner */}
          {countdown !== null && (
            <div className="autoplay-countdown-strip">
              <span>Next video begins in <strong>{countdown}s</strong></span>
              <button className="btn-cancel-countdown" onClick={cancelCountdown}>
                Cancel
              </button>
              <button className="btn-play-now" onClick={playNext}>
                Play Now →
              </button>
            </div>
          )}

          {/* Video Metadata Panel */}
          <div className="video-metadata-panel">
            <div className="meta-headline-row">
              <h1 className="watch-title">{currentVideo.title}</h1>
            </div>

            <div className="meta-details-row">
              <div className="meta-chips-left">
                <button
                  className="meta-channel-chip"
                  onClick={() => navigate(`/browse?site=${encodeURIComponent(currentVideo.site)}`)}
                >
                  <span className="channel-dot">●</span>
                  <span>{currentVideo.site}</span>
                </button>
                <span className="meta-tag tnum">ID: {currentVideo.id}</span>
                {currentVideo.duration && (
                  <span className="meta-tag tnum">
                    {Math.round(currentVideo.duration)}s runtime
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="meta-actions-right">
                <button
                  className={`btn-action-pill ${copiedLink ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                  title="Copy shareable link"
                >
                  {copiedLink ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  <span>{copiedLink ? 'Copied' : 'Share'}</span>
                </button>

                <a
                  className="btn-action-pill"
                  href={rawUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  title="Direct download file"
                >
                  <IconDownload size={16} />
                  <span>Download</span>
                </a>

                {currentVideo.post_url && (
                  <a
                    className="btn-action-pill"
                    href={currentVideo.post_url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open original website post"
                  >
                    <IconExternal size={16} />
                    <span>Source Post</span>
                  </a>
                )}

                {isStudio && (
                  <a
                    className="btn-action-pill"
                    href={studioUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open in studio editor"
                  >
                    <span>🎬 Studio</span>
                  </a>
                )}
              </div>
            </div>

            {/* Stream Diagnostics Accordion */}
            <details className="stream-diagnostics-box">
              <summary>
                <span>Stream & Network Inspector</span>
                <span className="stream-protocol-tag">MP4 DIRECT</span>
              </summary>
              <div className="diagnostics-content">
                <div className="diag-row">
                  <span className="diag-label">Source URL:</span>
                  <code className="diag-code">{rawUrl}</code>
                </div>
                <div className="diag-row">
                  <span className="diag-label">Proxy Engine:</span>
                  <span>{proxy ? 'Active (ORB/CORS Bypass)' : 'Disabled (Direct CDN)'}</span>
                </div>
                <div className="diag-row">
                  <span className="diag-label">Keyboard Shortcuts:</span>
                  <span className="diag-keys">Space (Play/Pause) · ←/→ (±10s) · Shift+N (Next) · T (Theater) · F (Fullscreen) · M (Mute)</span>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Right Column: Up Next Queue Rail */}
        <aside className="watch-queue-sidebar">
          <div className="queue-header">
            <div className="queue-title-wrap">
              <IconFilm size={18} />
              <h3>Up Next Playlist</h3>
            </div>
            <button
              className="queue-reshuffle-btn"
              onClick={() => {
                shuffle(16, currentVideo.site).then(d => {
                  setQueue((d.videos || []).filter(v => v.id !== currentVideo.id));
                  setQueueIndex(0);
                });
              }}
              title="Reshuffle playlist"
            >
              <IconShuffle size={14} />
              <span>Shuffle</span>
            </button>
          </div>

          <div className="queue-items-list">
            {queue.map((item, idx) => {
              const isSelected = idx === queueIndex;
              return (
                <div
                  key={item.id}
                  className={`queue-item-card ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectFromQueue(item, idx)}
                >
                  <div className="queue-thumb-wrap">
                    <img src={item.thumbnail} alt="" loading="lazy" />
                    {item.duration && (
                      <span className="queue-duration tnum">
                        {Math.round(item.duration)}s
                      </span>
                    )}
                    {isSelected && <span className="queue-playing-indicator">PLAYING</span>}
                  </div>
                  <div className="queue-info">
                    <p className="queue-title">{item.title}</p>
                    <span className="queue-site">{item.site}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
