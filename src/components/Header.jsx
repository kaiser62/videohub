import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Videos' },
  { to: '/shuffle', label: 'Shuffle' },
  { to: '/sites', label: 'Sites' },
  { to: '/health', label: 'Health' },
];

export default function Header() {
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) navigate(`/browse?q=${encodeURIComponent(trimmed)}`);
    setMenuOpen(false);
  };

  const handleNav = (to) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo" onClick={() => setMenuOpen(false)}>VideoHub</NavLink>
        <nav className={`nav-tabs${menuOpen ? ' open' : ''}`}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <form className="mobile-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search videos..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </nav>
        <form className="search-row" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span className={`hamburger-bar${menuOpen ? ' open' : ''}`} />
          <span className={`hamburger-bar${menuOpen ? ' open' : ''}`} />
          <span className={`hamburger-bar${menuOpen ? ' open' : ''}`} />
        </button>
      </div>
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
