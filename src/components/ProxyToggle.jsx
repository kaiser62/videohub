import { IconShield } from './Icons';

export default function ProxyToggle({ enabled, onToggle, compact = false }) {
  return (
    <div
      className={`toggle-container proxy-toggle-wrap ${enabled ? 'active' : ''} ${compact ? 'compact' : ''}`}
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle();
        }
      }}
      title="Routes video streams through backend proxy to bypass CDN ORB / CORS restrictions"
    >
      <IconShield size={16} className="toggle-icon" />
      <div className="toggle-labels">
        <span className="toggle-title">CDN Proxy</span>
        {!compact && <span className="toggle-hint">Bypass ORB/CORS</span>}
      </div>
      <div className={`switch-pill ${enabled ? 'on' : 'off'}`}>
        <div className="switch-knob" />
      </div>
    </div>
  );
}
