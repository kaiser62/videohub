import { useRef, useEffect, useState, useCallback } from 'react';
import { proxyVideoUrl } from '../api/client';

export default function VideoPlayer({ src, rawSrc, onEnded, onError, autoplay }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const proxiedSrc = proxyVideoUrl(src);

  useEffect(() => {
    setFailed(false);
    if (videoRef.current) videoRef.current.load();
  }, [proxiedSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => { setCurrentTime(v.currentTime); setDuration(v.duration || 0); };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onTime);
    return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('loadedmetadata', onTime); };
  }, [proxiedSrc]);

  const handleError = () => {
    const code = videoRef.current?.error?.code;
    if (code === 3 || code === 4) { setFailed(true); onError?.(); }
  };

  const skip = useCallback((s) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + s));
  }, []);

  const togglePip = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {}
  }, []);

  const downloadUrl = rawSrc || src;

  if (failed) {
    return (
      <div className="video-player-wrap">
        <div className="video-error">
          <span className="video-error-icon">⚠️</span>
          <p className="video-error-text">Video blocked by CDN security.</p>
          <button className="btn-primary" onClick={onError}>Try next video</button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-wrap">
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className="video-player"
        onEnded={onEnded}
        onError={handleError}
      >
        <source src={proxiedSrc} type="video/mp4" />
      </video>
      <div className="video-controls-bar">
        <button className="ctrl-btn" onClick={() => skip(-10)} title="Rewind 10s">
          <span className="ctrl-icon">↺</span>10
        </button>
        <span className="ctrl-time">{fmtTime(currentTime)} / {fmtTime(duration)}</span>
        <button className="ctrl-btn" onClick={() => skip(30)} title="Forward 30s">
          30<span className="ctrl-icon">↻</span>
        </button>
        <span className="ctrl-spacer" />
        <a className="ctrl-btn ctrl-link" href={downloadUrl} download target="_blank" title="Download video">
          <span className="ctrl-icon">⬇</span>
        </a>
        <button className="ctrl-btn" onClick={togglePip} title="Picture-in-Picture">
          <span className="ctrl-icon">⊞</span>
        </button>
      </div>
    </div>
  );
}

function fmtTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
