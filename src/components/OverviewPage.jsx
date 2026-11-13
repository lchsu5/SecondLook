import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, MonitorUp, ScanLine, MessageCircle, X } from 'lucide-react';
import './LandingPage.css';
import LandingDemo from './LandingDemo';

const steps = [
  { title: 'Share your screen', text: 'Connect your tablet or share the window where you work. Give SecondLook a view of your math.', icon: MonitorUp },
  { title: 'Write naturally', text: 'Work through your problem as usual. SecondLook follows your handwritten reasoning as you go.', icon: ScanLine },
  { title: 'Get a second look', text: 'When a step needs attention, use the feedback to revisit your reasoning and keep learning.', icon: MessageCircle },
];

export default function OverviewPage({ onEnter }) {
  const [tutorialStep, setTutorialStep] = useState(null);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    if (tutorialStep === null) return;
    closeRef.current?.focus();
    const dismiss = event => {
      if (event.key === 'Escape') setTutorialStep(null);
      if (event.key === 'Tab') {
        const buttons = [...document.querySelectorAll('.sl-dialog button')];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', dismiss);
    return () => { document.removeEventListener('keydown', dismiss); triggerRef.current?.focus(); };
  }, [tutorialStep]);
  const activeStep = tutorialStep === null ? null : steps[tutorialStep];
  return (
    <div className="sl-landing">
      <header className="sl-nav">
        <a href="#overview" className="sl-brand">SecondLook <span className="sl-nav-tagline">Real-Time STEM Vision</span></a>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#learning">Learning first</a><button className="sl-button sl-button-small" onClick={onEnter}>Start session <ArrowRight size={14} /></button></nav>
      </header>
      <main>
        <section className="sl-hero" id="overview">

          <h1>SecondLook</h1>
          <p>SecondLook connects to your screen in real time to help you spot where mathematical reasoning breaks down and catch foundational misconceptions before they compound into habits.</p>
          <div className="sl-actions"><button className="sl-button" onClick={onEnter}>TRY SECONDLOOK</button><button ref={triggerRef} className="sl-text-button" onClick={() => setTutorialStep(0)}>See how it works <ArrowRight size={15} /></button></div>
          <LandingDemo />
        </section>
        <section className="sl-feature-strip" aria-label="SecondLook at a glance"><div className="sl-container">{[['Feedback', 'Real time', 'Revisit reasoning while you work.'], ['Your workspace', 'Screen share', 'Keep your notebook and your approach.'], ['Learning process', 'Step by step', 'Look closer at the transition that needs attention.'], ['The goal', 'Understanding', 'Build confidence in the ideas behind your work.']].map(([label, value, text]) => <div key={label}><span className="sl-eyebrow">{label}</span><strong>{value}</strong><p>{text}</p></div>)}</div></section>
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
      <footer className="sl-footer"><a className="sl-brand" href="#overview"><Eye size={20} /> SecondLook</a><span>Real-time feedback for your math work.</span><a href="#overview">Overview</a><a href="#learning">Learning first</a></footer>
      {activeStep && <div className="sl-modal" onClick={event => { if (event.target === event.currentTarget) setTutorialStep(null); }}><div className="sl-dialog" role="dialog" aria-modal="true" aria-labelledby="sl-dialog-title"><button ref={closeRef} className="sl-close" aria-label="Close walkthrough" onClick={() => setTutorialStep(null)}><X size={22} /></button><span className="sl-eyebrow">Getting started · {tutorialStep + 1} of 3</span><activeStep.icon className="sl-tutorial-icon" size={36} /><h2 id="sl-dialog-title">{activeStep.title}</h2><p>{activeStep.text}</p><div className="sl-dialog-actions"><button className="sl-text-button" disabled={tutorialStep === 0} onClick={() => setTutorialStep(tutorialStep - 1)}>Back</button><button className="sl-button" onClick={() => tutorialStep < 2 ? setTutorialStep(tutorialStep + 1) : onEnter()}>{tutorialStep < 2 ? 'Next' : 'Start session'}<ArrowRight size={16} /></button></div></div></div>}
    </div>
  );
}
