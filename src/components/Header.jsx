import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { status } from '../api/client';
import { IconSearch, IconClear, IconFlame, IconFilm, IconGlobe, IconShuffle, IconActivity } from './Icons';

const navItems = [
  { to: '/', label: 'Home', icon: IconFlame },
  { to: '/browse', label: 'Browse', icon: IconFilm },
  { to: '/sites', label: 'Sites', icon: IconGlobe },
  { to: '/shuffle', label: 'Shuffle', icon: IconShuffle },
  { to: '/health', label: 'Health', icon: IconActivity },
];

export default function Header() {
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);

  // Sync search input if browse query changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query !== null) {
      setQ(query);
    }
  }, [location.search]);

  // Header scroll blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Quick live stats in header
  useEffect(() => {
    status().then(data => {
      setStats(data);
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      navigate(`/browse?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/browse');
    }
    setMenuOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleClear = () => {
    setQ('');
    if (location.pathname === '/browse') {
      navigate('/browse');
    }
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        {/* Brand Mark */}
        <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <div className="brand-icon">
            <span className="brand-dot" />
            <span className="brand-triangle">▶</span>
          </div>
          <span className="brand-text">Video<span className="brand-gradient">Hub</span></span>
          <span className="brand-tag">DEV</span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className="nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Global Search Bar */}
        <form className="search-bar" onSubmit={handleSearch}>
          <IconSearch size={16} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search titles, tags, sites..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className="search-clear" onClick={handleClear} title="Clear search">
              <IconClear size={14} />
            </button>
          )}
          <button type="submit" className="search-submit">Search</button>
        </form>

        {/* Quick Stats Beacon */}
        <div className="header-actions">
          {stats && (
            <NavLink to="/health" className="stats-beacon" title="API Status: Online">
              <span className={`beacon-dot ${stats.running ? 'extracting' : 'online'}`} />
              <span className="beacon-text">{stats.running ? 'Extracting' : 'Online'}</span>
            </NavLink>
          )}

          {/* Hamburger toggle for mobile */}
          <button
            className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Navigation</span>
          <button className="drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        <form className="drawer-search" onSubmit={handleSearch}>
          <IconSearch size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search videos..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button type="submit">Go</button>
        </form>

        <div className="drawer-links">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} className="drawer-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {stats && (
          <div className="drawer-footer">
            <span className={`beacon-dot ${stats.running ? 'extracting' : 'online'}`} />
            <span>Server: {stats.running ? 'Worker Running' : 'Healthy'}</span>
          </div>
        )}
      </div>

      {/* Backdrop overlay */}
      {menuOpen && <div className="drawer-overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
