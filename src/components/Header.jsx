import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Videos' },
  { to: '/sites', label: 'Sites' },
  { to: '/health', label: 'Health' },
];

export default function Header() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) navigate(`/browse?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo">VideoHub</NavLink>
        <nav className="nav-tabs">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <form className="search-row" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search videos..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>
    </header>
  );
}
