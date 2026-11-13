import React from 'react';
import { ArrowLeft, LockKeyhole, Play } from 'lucide-react';
import './SessionReady.css';

export default function LandingPage({ onEnter, onHome }) {
  return (
    <div className="session-ready">
      <header className="session-header"><div className="session-header-inner">
        <a className="session-brand" href="#overview" onClick={onHome}>SecondLook</a>
        <a className="session-back" href="#overview" onClick={onHome}><ArrowLeft size={16} aria-hidden="true" />Back Home</a>
      </div></header>
      <main className="session-main"><section className="session-intro" aria-labelledby="session-title">
        <h1 id="session-title">Ready for your session?</h1>
        <p className="session-instructions">Choose <strong>“This Tab”</strong> or <strong>“This Window”</strong> when you start screen sharing.</p>
        <p className="session-note">Keep this tab open while you write on the whiteboard.</p>
        <button className="session-start" type="button" onClick={onEnter}><Play size={22} fill="currentColor" strokeWidth={0} aria-hidden="true" />Start Session</button>
        <p className="session-privacy"><LockKeyhole size={14} aria-hidden="true" />Screen sharing starts only with your permission</p>
      </section></main>
      <footer className="session-footer">© 2025 SecondLook AI · Real-Time Multimodal STEM Vision Engine</footer>
    </div>
  );
}
