import { useNavigate } from 'react-router-dom';

export default function SiteChips({ sites: siteList = [], activeSite = '' }) {
  const navigate = useNavigate();

  const handleChipClick = (label) => {
    if (activeSite === label) {
      navigate('/browse');
    } else {
      navigate(`/browse?site=${encodeURIComponent(label)}`);
    }
  };

  if (!siteList || siteList.length === 0) return null;

  return (
    <div className="site-chips-rail">
      <button
        className={`site-chip ${!activeSite ? 'active' : ''}`}
        onClick={() => navigate('/browse')}
      >
        <span className="chip-icon">★</span>
        <span className="chip-label">All Sources</span>
      </button>

      {siteList.map(s => {
        const isActive = activeSite.toLowerCase() === s.label.toLowerCase();
        return (
          <button
            key={s.label}
            className={`site-chip ${isActive ? 'active' : ''}`}
            onClick={() => handleChipClick(s.label)}
            title={`Browse ${s.label}`}
          >
            <span className="chip-initial">{s.label.charAt(0).toUpperCase()}</span>
            <span className="chip-label">{s.label}</span>
            {s.count && <span className="chip-count tnum">{s.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
