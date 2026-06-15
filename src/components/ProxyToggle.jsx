export default function ProxyToggle({ enabled, onToggle }) {
  return (
    <label className="proxy-toggle">
      <span>Proxy</span>
      <span className="proxy-hint">(bypass CDN blocks)</span>
      <div className={`toggle-switch${enabled ? ' on' : ''}`} onClick={onToggle}>
        <div className="toggle-knob" />
      </div>
    </label>
  );
}
