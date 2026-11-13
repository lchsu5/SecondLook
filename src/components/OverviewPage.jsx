import React from 'react';
import { ArrowRight } from 'lucide-react';
import './LandingPage.css';
import LandingDemo from './LandingDemo';
import Header from './Header';
import PracticeStory from './PracticeStory';

export default function OverviewPage({ onEnter }) {
  return (
    <div className="sl-landing">
      <Header><nav className="site-navigation" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#learning">Learning first</a><button className="sl-button sl-button-small" onClick={onEnter}>Start Session <ArrowRight size={14} aria-hidden="true" /></button></nav></Header>
      <main>
        <section className="sl-hero" id="overview">

          <h1>SecondLook</h1>
          <p>SecondLook connects to your screen in real time to help you spot where mathematical reasoning breaks down and catch foundational misconceptions before they compound into habits.</p>
          <div className="sl-actions"><button className="sl-button" onClick={onEnter}>Start Session</button><a className="sl-text-button" href="#how-it-works">See how it works <ArrowRight size={15} aria-hidden="true" /></a></div>
          <LandingDemo />
        </section>
        <PracticeStory />
        <section className="sl-section" id="learning"><div className="sl-container">
          <div className="sl-card sl-learning"><span className="sl-eyebrow">Built around understanding</span><h2>Your thinking.<br />With a second set of eyes.</h2><p className="sl-learning-intro">Keep your own workspace and your own approach. SecondLook brings attention back to your reasoning, helping you understand the mistake behind an incorrect answer.</p><div className="sl-learning-grid"><article><h3>Feedback in the moment</h3><p>Revisit a questionable step while your thought process is still fresh, rather than waiting until the work is graded.</p></article><article><h3>Build stronger foundations</h3><p>Recognize recurring mistakes and practice the ideas behind them, so the next problem starts on firmer ground.</p></article></div></div>
        </div></section>
      </main>
      <footer className="sl-footer"><a className="sl-brand" href="#overview">SecondLook</a><span>Real-time feedback for your math work.</span><a href="#overview">Overview</a><a href="#learning">Learning first</a></footer>

    </div>
  );
}
