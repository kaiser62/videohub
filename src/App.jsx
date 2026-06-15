import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import WatchPage from './pages/WatchPage';
import SitesPage from './pages/SitesPage';
import HealthPage from './pages/HealthPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/app.css';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/watch" element={<WatchPage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
