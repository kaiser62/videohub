import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import WatchPage from './pages/WatchPage';
import SitesPage from './pages/SitesPage';
import ShufflePage from './pages/ShufflePage';
import HealthPage from './pages/HealthPage';
import NotFoundPage from './pages/NotFoundPage';
import DebugPanel from './components/DebugPanel';
import './styles/app.css';

/* Inject mobile CSS directly (bypasses Vite's max-width→width<= transformation) */
const MOBILE_CSS = `
@media (max-width: 768px) {
  .nav-tabs { display: none !important; }
  .hamburger { display: flex !important; }
  .header-inner { height: auto; padding: 8px 12px; gap: 8px; min-width: 0; }
  .logo { font-size: 1rem; flex-shrink: 0; }
  .search-row { flex: 1; margin-left: 0; min-width: 0; }
  .search-row input { flex: 1; width: auto; min-width: 40px; }
  .search-row button { padding: 8px 14px; flex-shrink: 0; }
  .nav-tabs.open { display: flex !important; flex-direction: column !important; background: var(--bg-secondary); border-right: 1px solid var(--border); z-index: 45; max-width: 85vw; padding: 56px 16px 16px; gap: 4px; overflow-y: auto; -webkit-overflow-scrolling: touch; position: fixed; top: 0; left: 0; bottom: 0; width: 260px; }
  .page { padding: 12px; }
  .video-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .section-title { font-size: 1rem; }
  .watch-page .video-player { max-height: 40vh; }
  .video-controls-bar { padding: 6px 8px; gap: 4px; }
  .ctrl-btn { min-height: 40px; min-width: 40px; justify-content: center; padding: 6px 8px; font-size: .75rem; }
  .ctrl-time { min-width: 70px; font-size: .75rem; }
  .video-title { font-size: 1rem; }
  .video-toggles { width: 100%; justify-content: flex-start; gap: 16px; }
  .video-meta { flex-direction: column; align-items: flex-start; gap: 8px; padding: 10px 12px; }
  .meta-actions { width: 100%; flex-wrap: wrap; }
  .meta-btn { flex: 1; justify-content: center; min-height: 44px; padding: 8px 10px; font-size: .8rem; }
  .hero-section { aspect-ratio: 16 / 9; border-radius: 8px; }
  .hero-title { font-size: 1rem; }
  .filter-bar { flex-direction: column; gap: 8px; }
  .filter-bar input, .filter-bar select, .filter-bar button { width: 100%; min-height: 44px; font-size: 16px; }
  .tab-bar { gap: 6px; }
  .tab-btn { flex: 1; min-height: 44px; padding: 10px 12px; font-size: .85rem; }
  .pagination button { min-height: 40px; min-width: 40px; padding: 8px 12px; font-size: .8rem; }
  .site-chip { min-height: 44px; display: flex; align-items: center; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .video-nav { flex-wrap: wrap; justify-content: center; padding: 8px; }
  .nav-btn { flex: 1; min-height: 44px; padding: 8px 10px; font-size: .8rem; }
  .sites-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .card-title { font-size: .8rem; }
  .card-body { padding: 8px 10px 10px; }
  .watch-page .video-player-wrap { border-radius: 6px; max-width: 100%; }
  .video-url-details summary { font-size: .75rem; }
  .hero-overlay { padding: 24px 12px 12px; }
  .hero-dots { bottom: 6px; right: 12px; }
  .hero-dot { width: 7px; height: 7px; }
  .filter-bar input, .filter-bar select { min-width: 0; }
  .nav-pos { min-width: 60px; }
  .nav-tabs.open .tab { font-size: 1rem; padding: 12px 16px; min-height: 44px; display: flex; align-items: center; }
  .mobile-search { display: flex; gap: 6px; margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--border); }
  .mobile-search input { flex: 1; padding: 10px 12px; border: 1px solid #475569; border-radius: 6px; background: var(--bg-primary); color: #e2e8f0; font-size: 16px; }
  .mobile-search button { padding: 10px 16px; border: none; border-radius: 6px; background: var(--accent); color: white; font-size: .9rem; }
  .nav-overlay { display: block; z-index: 44; }
}
@media (max-width: 480px) {
  .page { padding: 10px; }
  .header-inner { gap: 6px; padding: 6px 10px; }
  .nav-tabs.open { width: 240px; }
  .video-grid { gap: 8px; }
  .watch-page .video-player { max-height: 35vh; }
  .video-controls-bar { padding: 4px 6px; gap: 3px; }
  .ctrl-btn { min-height: 36px; min-width: 36px; padding: 4px 8px; font-size: .7rem; }
  .ctrl-time { min-width: 60px; font-size: .7rem; }
  .video-title { font-size: .9rem; }
  .video-meta { gap: 6px; padding: 8px 10px; }
  .meta-btn { min-height: 40px; font-size: .75rem; }
  .section-title { font-size: .9rem; }
  .hero-title { font-size: .9rem; }
  .tab-btn { padding: 8px 10px; font-size: .8rem; }
  .pagination button { min-height: 36px; min-width: 36px; padding: 6px 10px; font-size: .75rem; }
  .site-chip { min-height: 40px; padding: 6px 14px; font-size: .8rem; }
  .stats-grid { gap: 8px; }
  .stat-card { padding: 12px; }
  .stat-value { font-size: 1.1rem; }
  .nav-btn { min-height: 40px; padding: 6px 8px; font-size: .75rem; }
  .sites-grid { gap: 8px; }
  .site-card { padding: 12px; }
  .card-title { font-size: .75rem; }
  .card-body { padding: 6px 8px 8px; }
  .site-footer { font-size: .7rem; }
  .meta-left { width: 100%; }
  .meta-item { font-size: .75rem; }
  .filter-bar { gap: 6px; }
  .filter-bar input, .filter-bar select, .filter-bar button { min-height: 40px; font-size: 16px; }
  .hero-section { border-radius: 6px; }
  .video-nav { flex-wrap: wrap; justify-content: center; }
  .nav-btn { flex: 1; min-height: 38px; }
}
@media (max-width: 360px) {
  .video-grid { grid-template-columns: 1fr; gap: 10px; }
  .sites-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .nav-tabs.open { width: 100%; }
}
`;

function MobileCSS() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = MOBILE_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return null;
}

export default function App() {
  const showDebug = new URLSearchParams(window.location.search).get('debug') === '1';
  return (
    <BrowserRouter>
      <MobileCSS />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/watch" element={<WatchPage />} />
          <Route path="/shuffle" element={<ShufflePage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {showDebug && <DebugPanel />}
    </BrowserRouter>
  );
}
