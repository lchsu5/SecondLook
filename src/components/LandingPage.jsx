import React from 'react';
import { LockKeyhole, Play } from 'lucide-react';
import Header from './Header';
import './SessionReady.css';

export default function LandingPage({ onEnter, onHome, starting = false, error = '' }) {
  return (
    <div className="session-ready">
      <Header onHome={onHome} />
      <main className="session-main"><section className="session-intro" aria-labelledby="session-title">
        <h1 id="session-title">Ready for your session?</h1>
        <p className="session-instructions">Choose <strong>“This Tab”</strong> or <strong>“This Window”</strong> when you start screen sharing.</p>
        <p className="session-note">Share the window where you work, and keep this tab open to view it.</p>
        <button className="session-start" type="button" onClick={onEnter} disabled={starting} aria-busy={starting}><Play size={22} fill="currentColor" strokeWidth={0} aria-hidden="true" />{starting ? 'Starting session…' : 'Start Session'}</button>
        {error && <p role="alert" className="session-start-error">{error}</p>}
        <p className="session-privacy"><LockKeyhole size={14} aria-hidden="true" />Screen sharing starts only with your permission</p>
      </section></main>
      <footer className="session-footer">SecondLook · A second look at your thinking.</footer>
    </div>
  );
}
