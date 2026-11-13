import React from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, X } from 'lucide-react';

export default function InterventionCard({ intervention, onClose }) {
  if (!intervention) return null;

  const isNoIssue = intervention.errorFound === false || intervention.category === 'Correct';
  const borderClass = isNoIssue ? 'border-emerald-500' : 'border-amber-500';
  const titleClass = isNoIssue ? 'text-emerald-600' : 'text-amber-600';
  const hintBoxClass = isNoIssue ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100';
  const hintTitleClass = isNoIssue ? 'text-emerald-700' : 'text-amber-700';

  return (
    <div className={`absolute top-4 right-4 w-80 bg-white rounded-xl shadow-lg border-l-4 ${borderClass} overflow-hidden animate-in slide-in-from-right fade-in duration-300 z-50`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className={`flex items-center gap-2 ${titleClass} font-bold`}>
            {isNoIssue ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{intervention.issueTitle || "Feedback"}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {intervention.explanation && (
          <p className="text-gray-700 text-sm mb-3 font-medium whitespace-pre-wrap">
            {intervention.explanation}
          </p>
        )}
        <p className="text-gray-700 text-sm mb-2 font-medium">
          {intervention.issueTitle || intervention.description}
        </p>

        {intervention.incorrectSnippet && (
          <div className="mb-3 text-sm text-gray-800">
            <span
              className="math-error-underline"
              title={intervention.explanation || ''}
            >
              {intervention.incorrectSnippet}
            </span>
          </div>
        )}

        <div className={`p-3 rounded-lg border ${hintBoxClass}`}>
          <div className={`flex gap-2 mb-1 text-xs font-bold uppercase tracking-wider ${hintTitleClass}`}>
            <Lightbulb size={14} />
            Hint
          </div>
          <p className="text-gray-600 text-sm">
            {intervention.hint || intervention.explanation}
            {intervention.hint || ""}
          </p>
        </div>
      </div>
    </div>
  );
}
