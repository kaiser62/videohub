import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import WatchPage from './pages/WatchPage';
import SitesPage from './pages/SitesPage';
import ShufflePage from './pages/ShufflePage';
import HealthPage from './pages/HealthPage';
import NotFoundPage from './pages/NotFoundPage';
import DebugPanel from './components/DebugPanel';
import { ToastProvider } from './components/Toast';
import './styles/app.css';

export default function App() {
  const showDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-shell">
          <Header />
          <main className="app-main">
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
          <MobileBottomNav />
          {showDebug && <DebugPanel />}
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
