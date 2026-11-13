import React, { useState } from 'react';
import { ArrowUpRight, Check, PencilLine, RotateCcw } from 'lucide-react';
import './PracticeStory.css';

const moments = [
  { title: 'Work through it.', description: 'Share your notebook or whiteboard and work the way you normally do.', label: 'Writing the next line' },
  { title: 'Pause at the right step.', description: 'A small question brings your attention back to the line that needs another look.', label: 'Taking a second look' },
  { title: 'Make the connection.', description: 'You revisit the step and make the correction yourself. Then keep going.', label: 'Back on track' },
];

export default function PracticeStory() {
  const [moment, setMoment] = useState(1);
  const corrected = moment === 2;

  return <section className="practice-story" id="how-it-works" aria-labelledby="practice-title">
    <div className="practice-layout">
      <div className="practice-copy">
        <span className="practice-eyebrow">How it works</span>
        <h2 id="practice-title">A little nudge.<br />Your own “aha.”</h2>
        <p className="practice-introduction">You know that moment when one small mistake throws off the rest of a problem? Catch it while your thinking is still fresh.</p>
        <div className="practice-moments" role="group" aria-label="Explore the example session">
          {moments.map((item, index) => <button key={item.title} className={`practice-moment ${moment === index ? 'is-current' : ''}`} aria-pressed={moment === index} onClick={() => setMoment(index)}>
            <span className="practice-number">0{index + 1}</span>
            <span><strong>{item.title}</strong><span className="practice-description">{item.description}</span></span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>)}
        </div>
        <p className="practice-disclaimer">An interactive example, not a live student session.<br />Select a step to follow the work.</p>
      </div>

      <div className="practice-session">
        <div className="practice-toolbar"><span><PencilLine size={15} aria-hidden="true" />Algebra practice</span><span>Example notebook</span></div>
        <div className="practice-paper" aria-label="Sample handwritten work" aria-live="polite">
          <div className="practice-paper-heading"><span>Expanding brackets</span><span>04</span></div>
          <p className="practice-problem">Expand and simplify (x + 3)²</p>
          <div className="practice-handwriting">
            <p className="practice-line-one">(x + 3)² = (x + 3)(x + 3)</p>
            <p className={`practice-line-two ${moment > 0 ? 'needs-review' : ''} ${corrected ? 'is-crossed' : ''}`}>= x² + 9</p>
            {moment === 0 && <span className="practice-pencil"><PencilLine size={23} aria-hidden="true" /><span>Working…</span></span>}
            {corrected && <div className="practice-correction"><p>= x² + 3x + 3x + 9</p><p>= x² + 6x + 9 <Check size={22} aria-label="Correct expansion" /></p><span className="practice-margin-note">both middle terms!</span></div>}
          </div>
          {moment === 1 && <div className="practice-annotation" role="note"><span className="practice-annotation-line" aria-hidden="true" /><span>Something missing here?</span></div>}
          {moment > 0 && <aside className={`practice-hint ${corrected ? 'is-resolved' : ''}`} aria-label="Example SecondLook feedback">
            <div className="practice-hint-heading"><span className="practice-hint-mark">{corrected ? <Check size={13} aria-hidden="true" /> : 'S'}</span><strong>SecondLook</strong><span>{corrected ? 'Revisited' : 'A quick question'}</span></div>
            <p>{corrected ? 'That’s it. Both middle terms are accounted for. Keep going.' : 'You multiplied x by x, and 3 by 3. What about x by 3?'}</p>
            {!corrected && <button onClick={() => setMoment(2)}>Revisit this step <ArrowUpRight size={14} aria-hidden="true" /></button>}
          </aside>}
        </div>
        <div className="practice-session-footer"><span><i className={corrected ? 'is-resolved' : ''} />{moments[moment].label}</span><button onClick={() => setMoment(0)} aria-label="Replay example from the first step"><RotateCcw size={13} aria-hidden="true" />Replay</button></div>
      </div>
    </div>
  </section>;
}
