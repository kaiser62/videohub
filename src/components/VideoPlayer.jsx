import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { proxyVideoUrl } from '../api/client';
import {
  IconPlay,
  IconPause,
  IconSkipBack10,
  IconSkipForward30,
  IconVolume,
  IconVolumeMute,
  IconMaximize,
  IconMinimize,
  IconTheater,
  IconPip,
  IconDownload,
  IconShield
} from './Icons';

function fmtTime(s) {
  if (!s || !isFinite(s) || isNaN(s) || s < 0) return '0:00';
  const sec = Math.floor(s);
  const m = Math.floor(sec / 60);
  const rem = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  }
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

const VideoPlayer = forwardRef(function VideoPlayer(
  {
    src,
    rawSrc,
    title,
    site,
    onEnded,
    onError,
    autoplay = true,
    isTheater = false,
    onToggleTheater,
    onDurationChange,
    proxyEnabled = false,
    onToggleProxy
  },
  ref
) {
  const videoRef = useRef(null);
  const playerWrapRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBuffering, setIsBuffering] = useState(false);

  // Compute final stream URL
  const streamSrc = proxyVideoUrl(src, proxyEnabled);

  // Expose player methods via ref
  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (time) => {
      if (videoRef.current) videoRef.current.currentTime = time;
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0,
    getVideoElement: () => videoRef.current
  }));

  // Reset states when source changes
  useEffect(() => {
    setFailed(false);
    setErrorMessage('');
    setCurrentTime(0);
    setBufferedEnd(0);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [streamSrc]);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      if (v.duration && onDurationChange) {
        onDurationChange(v.duration);
      }
      // Calculate buffer percentage
      if (v.buffered && v.buffered.length > 0) {
        for (let i = 0; i < v.buffered.length; i++) {
          if (v.buffered.start(i) <= v.currentTime && v.currentTime <= v.buffered.end(i)) {
            setBufferedEnd(v.buffered.end(i));
            break;
          }
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(v.duration || 0);
      if (onDurationChange) onDurationChange(v.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    const handleError = () => {
      setIsBuffering(false);
      setFailed(true);
      const code = v.error?.code;
      if (code === 4) {
        setErrorMessage('Video blocked or stream not supported. Try enabling the proxy toggle.');
      } else {
        setErrorMessage('Unable to load video stream.');
      }
      onError?.();
    };

    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('loadedmetadata', handleLoadedMetadata);
    v.addEventListener('play', handlePlay);
    v.addEventListener('pause', handlePause);
    v.addEventListener('waiting', handleWaiting);
    v.addEventListener('playing', handlePlaying);
    v.addEventListener('error', handleError);

    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('loadedmetadata', handleLoadedMetadata);
      v.removeEventListener('play', handlePlay);
      v.removeEventListener('pause', handlePause);
      v.removeEventListener('waiting', handleWaiting);
      v.removeEventListener('playing', handlePlaying);
      v.removeEventListener('error', handleError);
    };
  }, [onDurationChange, onError]);

  // Autohide controls on mouse inactivity during playback
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const seekRelative = useCallback((seconds) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds));
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleScrubberChange = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const newPercent = parseFloat(e.target.value);
    const newTime = (newPercent / 100) * duration;
    v.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const v = videoRef.current;
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (v) {
      v.volume = val;
      v.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isMuted) {
      v.muted = false;
      setIsMuted(false);
      v.volume = volume || 1;
    } else {
      v.muted = true;
      setIsMuted(true);
    }
  };

  const setSpeed = (rate) => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch {}
  };

  const toggleFullscreen = async () => {
    const wrap = playerWrapRef.current;
    if (!wrap) return;
    try {
      if (!document.fullscreenElement) {
        await wrap.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {}
  };

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
  const downloadUrl = rawSrc || src;

  return (
    <div
      ref={playerWrapRef}
      className={`theater-player-container ${isTheater ? 'theater-mode' : ''} ${controlsVisible ? 'controls-active' : 'controls-hidden'}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      onClick={showControlsTemporarily}
    >
      {/* Ambient optical bloom behind video */}
      <div className="player-ambient-glow" />

      {failed ? (
        <div className="player-error-screen">
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <h3>Playback Restricted</h3>
            <p>{errorMessage}</p>
            <div className="error-actions">
              <button
                className="btn-accent"
                onClick={() => {
                  if (onToggleProxy) onToggleProxy();
                  setFailed(false);
                }}
              >
                <IconShield size={16} />
                {proxyEnabled ? 'Reload via Direct' : 'Bypass via Proxy'}
              </button>
              <button className="btn-secondary" onClick={onError}>
                Play Next Video →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={streamSrc}
            autoPlay={autoplay}
            playsInline
            className="theater-video-element"
            onClick={togglePlay}
            onEnded={onEnded}
          />

          {/* Buffering Indicator */}
          {isBuffering && (
            <div className="player-buffering-overlay">
              <div className="spinner" />
            </div>
          )}

          {/* Top Bar Overlay */}
          <div className="player-overlay-top">
            <div className="top-meta">
              <span className="top-site-badge">{site}</span>
              <span className="top-title" title={title}>{title}</span>
            </div>
            <div className="top-tools">
              <button
                className={`tool-pill ${proxyEnabled ? 'active' : ''}`}
                onClick={onToggleProxy}
                title="Bypass CORS/ORB restrictions via proxy"
              >
                <IconShield size={14} />
                <span>{proxyEnabled ? 'Proxy: ON' : 'Proxy: OFF'}</span>
              </button>
              {onToggleTheater && (
                <button
                  className={`tool-icon-btn ${isTheater ? 'active' : ''}`}
                  onClick={onToggleTheater}
                  title={isTheater ? 'Exit theater mode' : 'Theater mode'}
                >
                  <IconTheater size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Center Play Button on Pause */}
          {!isPlaying && !isBuffering && (
            <button className="center-play-dial" onClick={togglePlay} aria-label="Play video">
              <IconPlay size={36} className="center-play-icon" />
            </button>
          )}

          {/* Bottom HUD Controls Bar */}
          <div className="player-overlay-bottom">
            {/* Scrubber Rail */}
            <div className="scrubber-track-wrap">
              <div className="scrubber-rail">
                <div
                  className="scrubber-buffered"
                  style={{ width: `${Math.min(100, Math.max(0, bufferPercent))}%` }}
                />
                <div
                  className="scrubber-played"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progressPercent || 0}
                  onChange={handleScrubberChange}
                  className="scrubber-input"
                  aria-label="Seek progress"
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="controls-row">
              <div className="controls-left">
                <button className="ctrl-btn main-play" onClick={togglePlay} title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                  {isPlaying ? <IconPause size={20} /> : <IconPlay size={20} />}
                </button>

                <button className="ctrl-btn" onClick={() => seekRelative(-10)} title="Rewind 10s (←)">
                  <IconSkipBack10 size={18} />
                  <span className="ctrl-subtext">-10s</span>
                </button>

                <button className="ctrl-btn" onClick={() => seekRelative(30)} title="Skip 30s (→)">
                  <IconSkipForward30 size={18} />
                  <span className="ctrl-subtext">+30s</span>
                </button>

                <div className="volume-group">
                  <button className="ctrl-btn" onClick={toggleMute} title={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
                    {isMuted || volume === 0 ? <IconVolumeMute size={18} /> : <IconVolume size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                    aria-label="Volume slider"
                  />
                </div>

                <div className="timecode-display tnum">
                  <span className="time-current">{fmtTime(currentTime)}</span>
                  <span className="time-sep">/</span>
                  <span className="time-duration">{fmtTime(duration)}</span>
                </div>
              </div>

              <div className="controls-right">
                {/* Speed selector */}
                <div className="speed-picker-wrap">
                  <button
                    className="ctrl-btn speed-btn tnum"
                    onClick={() => setShowSpeedMenu(s => !s)}
                    title="Playback Speed"
                  >
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="speed-dropdown">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                        <button
                          key={rate}
                          className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                          onClick={() => setSpeed(rate)}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  className="ctrl-btn"
                  href={downloadUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  title="Download MP4"
                >
                  <IconDownload size={18} />
                </a>

                <button className="ctrl-btn" onClick={togglePip} title="Picture-in-Picture">
                  <IconPip size={18} />
                </button>

                <button className="ctrl-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}>
                  {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default VideoPlayer;
