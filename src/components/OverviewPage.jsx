import React from 'react';
import { ArrowRight, MonitorUp, ScanLine, MessageCircle } from 'lucide-react';
import './LandingPage.css';
import LandingDemo from './LandingDemo';
import Header from './Header';

const steps = [
  { title: 'Share your screen', text: 'Share the window or tab where you work. Give SecondLook a view of your math.', icon: MonitorUp },
  { title: 'Write naturally', text: 'Work through your problem as usual. SecondLook follows your handwritten reasoning as you go.', icon: ScanLine },
  { title: 'Get a second look', text: 'When a step needs attention, use the feedback to revisit your reasoning and keep learning.', icon: MessageCircle },
];

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
        <section className="sl-section" id="how-it-works">
          <div className="sl-container">
            <div className="sl-section-heading"><div><span className="sl-eyebrow">The learning process</span><h2>Why students plateau &amp;<br />how SecondLook intervenes.</h2></div><p>Uncorrected algebraic shortcuts quietly compound over time. Bring feedback into the moment you’re working through a problem.</p></div>
            <div className="sl-process-grid">
              <article className="sl-card sl-problem">
                <div className="sl-card-meta"><span className="sl-red">Compounding fracture</span><span>Step 2 divergence</span></div>
                <h3>The silent compounding trap</h3>
                <p>When a student writes <code>(a + b)² = a² + b²</code>, they can spend the next ten minutes building on a mistake. A grade days later comes too late to guide that moment.</p>
                <div className="sl-equation"><span className="sl-equation-label">A SMALL SHORTCUT. A DIFFERENT PATH.</span><div>(a + b)² = a² <span className="sl-missing">+ 2ab</span> + b²</div><span className="sl-equation-note">The middle term makes all the difference.</span></div>
                <div className="sl-path"><div className="sl-card-meta"><span>VERIFIED REASONING PATH</span><span className="sl-red">LOGIC GAP</span></div><svg viewBox="0 0 520 80" role="img" aria-label="An error causes a student's reasoning to diverge from the verified path"><path d="M10 60 H510" stroke="#d2d2d7" strokeDasharray="4 4" fill="none" /><path d="M130 60 Q230 55 310 30 T510 10" stroke="#ff3b30" strokeWidth="2" fill="none" /><circle cx="130" cy="60" r="5" fill="#ff3b30" /><text x="145" y="52" fill="#e53830" fontSize="11">Omitted +2ab term</text></svg></div>
              </article>
              <div className="sl-steps">{steps.map(({ title, text, icon: Icon }, index) => <article className="sl-card sl-step" key={title}><div className="sl-step-title"><span>0{index + 1} <span className="sl-step-dot">·</span> {title}</span><Icon size={18} strokeWidth={1.5} /></div><p>{text}</p></article>)}</div>
            </div>
          </div>
        </section>
        <section className="sl-section" id="learning"><div className="sl-container">
          <div className="sl-card sl-learning"><span className="sl-eyebrow">Built around understanding</span><h2>Your thinking.<br />With a second set of eyes.</h2><p className="sl-learning-intro">Keep your own workspace and your own approach. SecondLook brings attention back to your reasoning, helping you understand the mistake behind an incorrect answer.</p><div className="sl-learning-grid"><article><h3>Feedback in the moment</h3><p>Revisit a questionable step while your thought process is still fresh, rather than waiting until the work is graded.</p></article><article><h3>Build stronger foundations</h3><p>Recognize recurring mistakes and practice the ideas behind them, so the next problem starts on firmer ground.</p></article></div></div>
        </div></section>
      </main>
      <footer className="sl-footer"><a className="sl-brand" href="#overview">SecondLook</a><span>Real-time feedback for your math work.</span><a href="#overview">Overview</a><a href="#learning">Learning first</a></footer>

    </div>
  );
}
