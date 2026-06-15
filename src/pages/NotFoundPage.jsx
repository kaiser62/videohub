import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
      <h1 style={{ fontSize: '3rem', marginBottom: 12 }}>404</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
      <Link to="/" style={{ color: 'var(--accent)', marginTop: 20, display: 'inline-block' }}>
        Go Home
      </Link>
    </div>
  );
}
