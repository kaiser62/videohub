import { Link } from 'react-router-dom';
import { IconFilm, IconFlame } from '../components/Icons';

export default function NotFoundPage() {
  return (
    <div className="page not-found-page">
      <div className="not-found-card">
        <span className="not-found-code tnum">404</span>
        <h2>Reel Not Found</h2>
        <p>The video or page you requested could not be located in the catalog archives.</p>
        <div className="not-found-actions">
          <Link to="/" className="btn-accent">
            <IconFlame size={16} />
            <span>Return to Home</span>
          </Link>
          <Link to="/browse" className="btn-secondary">
            <IconFilm size={16} />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
