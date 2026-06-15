import { useNavigate } from 'react-router-dom';

export default function SiteChips({ sites }) {
  const navigate = useNavigate();

  return (
    <div className="site-chips">
      {sites.map(s => (
        <button
          key={s.label}
          className="site-chip"
          onClick={() => navigate(`/browse?site=${encodeURIComponent(s.label)}`)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
