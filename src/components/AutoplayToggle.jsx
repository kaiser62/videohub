export default function AutoplayToggle({ enabled, onToggle, compact = false }) {
  return (
    <div
      className={`toggle-container autoplay-toggle-wrap ${enabled ? 'active' : ''} ${compact ? 'compact' : ''}`}
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
      title="Automatically play the next recommended video when finished"
    >
      <div className="toggle-labels">
        <span className="toggle-title">Autoplay</span>
        {!compact && <span className="toggle-hint">Next video</span>}
      </div>
      <div className={`switch-pill ${enabled ? 'on' : 'off'}`}>
        <div className="switch-knob" />
      </div>
    </div>
  );
}
