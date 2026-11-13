import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  BarChart2,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  BookOpen,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react';
import { GeminiClient } from '../lib/gemini';
import './SummaryView.css';

export default function SummaryView({ interventions, onRestart }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const handleDialogKey = event => {
    if (event.key === 'Escape') onRestart();
    if (event.key !== 'Tab') return;
    const buttons = dialogRef.current?.querySelectorAll('button:not(:disabled)');
    const first = buttons?.[0];
    const last = buttons?.[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const grouped = interventions.reduce((acc, item) => {
    const key = item.category || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  useEffect(() => {
    let mounted = true;

    if (interventions.length > 0) {
      setLoading(true);

      GeminiClient.generateSessionSummary(interventions)
        .then(data => {
          if (!mounted) return;
          setSummaryData(data);
          setLoading(false);
        })
        .catch(() => {
          if (!mounted) return;
          setError('A personalized summary is unavailable. Your recorded feedback is still shown below.');

          const fallbackSummary = {
            summary:
              "We couldn't connect to the AI tutor for a personalized summary right now, but here is an overview based on your session.",
            strengths: [],
            areasForImprovement:
              categories.length > 0
                ? [`Review the ${categories.join(', ')} concepts below.`]
                : ['Review your error log.'],
            recommendations: ['Check the detailed log below for specific hints.'],
          };

          setSummaryData(fallbackSummary);
          setLoading(false);
        });
    } else {
      setSummaryData({
        summary: 'Your screen-sharing session has ended. No AI feedback was recorded, so there is no assessment of your work for this session.',
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
      });
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="summary-overlay">
      <div className="summary-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="summary-title" aria-describedby="summary-description" onKeyDown={handleDialogKey}>
        <div className="summary-header">
          <button
            onClick={onRestart}
            aria-label="Close session summary"
            className="summary-close"
          >
            <X size={16} />
          </button>
          <div className="summary-complete-icon">
            <CheckCircle size={30} strokeWidth={1.5} />
          </div>
          <h2 id="summary-title">Session Complete</h2>
          <p id="summary-description">
            {interventions.length ? 'Review the feedback from your session.' : 'Your screen-sharing session is complete.'}
          </p>
        </div>

        <div className="summary-body">
          <div className="space-y-6">
            <div className="summary-feedback-card">
              <h3 className="summary-section-title">
                <Sparkles size={20} />
                <span>Session feedback</span>
              </h3>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-6 text-blue-700">
                  <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin mb-3" />
                  <p>Analyzing your session...</p>
                </div>
              ) : summaryData ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {summaryData.summary}
                  </p>

                  {(summaryData.strengths?.length > 0 || summaryData.areasForImprovement?.length > 0) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="summary-detail-card">
                      <h4 className="font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                        <ThumbsUp size={16} />
                        <span>Strengths</span>
                      </h4>
                      {summaryData.strengths?.length ? (
                        <ul className="space-y-1">
                          {summaryData.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-gray-700"
                            >
                              <span className="mt-0.5 text-emerald-700">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-xs">No strengths recorded.</p>
                      )}
                    </div>

                    <div className="summary-detail-card">
                      <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                        <TrendingUp size={16} />
                        <span>Focus Areas</span>
                      </h4>
                      {summaryData.areasForImprovement?.length ? (
                        <ul className="space-y-1">
                          {summaryData.areasForImprovement.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-gray-700"
                            >
                              <span className="mt-0.5 text-orange-700">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-xs">No focus areas recorded.</p>
                      )}
                    </div>
                  </div>}

                  {summaryData.recommendations?.length ? (
                    <div className="summary-detail-card">
                      <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <BookOpen size={16} />
                        <span>Recommended Practice</span>
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {summaryData.recommendations.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <ArrowRight size={14} className="mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {error ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-gray-600 italic">
                  No detailed feedback available for this session.
                </p>
              )}
            </div>

            {categories.length > 0 && <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 size={18} />
                <span>Recorded feedback</span>
              </h3>

              <div className="space-y-4">
                {categories.length === 0 ? (
                  <p className="text-gray-600 italic">
                    No feedback was recorded during this session.
                  </p>
                ) : (
                  categories.map(category => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                        {category}
                      </h4>
                      {grouped[category].map((item, idx) => (
                        <div
                          key={`${category}-${idx}`}
                          className="bg-white p-4 rounded-xl border border-gray-200"
                        >
                          <span className="inline-block px-2 py-1 bg-red-500/20 text-red-700 text-xs font-bold rounded mb-2">
                            Issue
                          </span>
                          <div className="font-semibold text-gray-900 mb-1">
                            {item.issueTitle || item.description}
                          </div>
                          <p className="text-gray-600 text-sm">
                            {item.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>}
          </div>
        </div>

        <div className="summary-footer">
          <button
            onClick={onRestart}
            className="summary-restart"
          >
            <RefreshCw size={18} />
            <span>Start New Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
