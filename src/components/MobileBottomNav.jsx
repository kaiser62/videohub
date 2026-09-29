import { NavLink } from 'react-router-dom';
import { IconFlame, IconFilm, IconGlobe, IconShuffle, IconActivity } from './Icons';

const navItems = [
  { to: '/', label: 'Home', icon: IconFlame },
  { to: '/browse', label: 'Browse', icon: IconFilm },
  { to: '/sites', label: 'Sites', icon: IconGlobe },
  { to: '/shuffle', label: 'Shuffle', icon: IconShuffle },
  { to: '/health', label: 'Health', icon: IconActivity },
];

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-nav-inner">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="mobile-nav-indicator" />
              <Icon size={20} className="mobile-nav-icon" />
              <span className="mobile-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
