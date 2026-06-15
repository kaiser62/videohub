export default function AutoplayToggle({ enabled, onToggle }) {
  return (
    <label className="autoplay-toggle">
      <span>Autoplay</span>
      <div className={`toggle-switch${enabled ? ' on' : ''}`} onClick={onToggle}>
        <div className="toggle-knob" />
      </div>
    </label>
  );
}
