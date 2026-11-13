import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Workspace from './components/Workspace';
import OverviewPage from './components/OverviewPage';

function App() {
  const [mode, setMode] = useState('landing');

  useEffect(() => {
    const handlePointerMove = ev => {
      const x = `${ev.clientX}px`;
      const y = `${ev.clientY}px`;
      document.documentElement.style.setProperty('--mouse-x', x);
      document.documentElement.style.setProperty('--mouse-y', y);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  if (mode === 'landing') {
    return <LandingPage onEnter={() => setMode('workspace')} onHome={() => setMode('overview')} />;
  }

  if (mode === 'overview') {
    return <OverviewPage onEnter={() => setMode('landing')} />;
  }

  return <Workspace onExitToHome={() => setMode('landing')} />;
}

export default App;
