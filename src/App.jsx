import React, { useEffect, useState } from 'react';
import Workspace from './components/Workspace';
import OverviewPage from './components/OverviewPage';

export default function App() {
  const [page, setPage] = useState(() => window.location.hash === '#session' ? 'session' : 'overview');

  useEffect(() => {
    const navigate = () => setPage(window.location.hash === '#session' ? 'session' : 'overview');
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (page === 'session') window.scrollTo({ top: 0, behavior: 'instant' });
      else document.getElementById(window.location.hash.slice(1) || 'overview')?.scrollIntoView({ behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [page]);

  return page === 'overview'
    ? <OverviewPage onEnter={() => { window.location.hash = 'session'; }} />
    : <Workspace onExitToHome={() => { window.location.hash = 'overview'; }} />;
}
