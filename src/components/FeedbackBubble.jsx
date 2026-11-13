import React from 'react';
import { Lightbulb, X, CheckCircle } from 'lucide-react';

export default function FeedbackBubble({ intervention, onClose }) {
  if (!intervention) return null;

  // Use hint if available, otherwise use explanation (shortened), otherwise generic message
  let content = intervention.hint;
  let label = "Hint";

  if (!content && intervention.explanation) {
    content = intervention.explanation;
    label = "Explanation";
  }

  // Handle Success State (and Prompt State)
  const isSuccess = intervention.errorFound === false;
  const isPrompt = intervention.category === "Prompt";

  if (isSuccess) {
      label = intervention.issueTitle || "Great Job!";
      content = intervention.explanation || "No errors found.";
  }

  // Custom styling for Prompts (Show Work)
  if (isPrompt) {
      label = intervention.issueTitle || "Prompt";
      content = intervention.explanation || "Please show your work.";
  }

  if (!content) return null;

  let borderColor = 'border-blue-100';
  let badgeColor = 'text-blue-600 bg-blue-50';
  let Icon = Lightbulb;
  let iconClass = 'fill-blue-600';

  if (isSuccess && !isPrompt) {
      borderColor = 'border-green-100';
      badgeColor = 'text-green-600 bg-green-50';
      Icon = CheckCircle;
      iconClass = 'fill-green-600 text-white';
  } else if (isPrompt) {
      borderColor = 'border-purple-100';
      badgeColor = 'text-purple-600 bg-purple-50';
      Icon = Lightbulb; // Or maybe a Pencil/Edit icon
      iconClass = 'fill-purple-600 text-white';
  }

  return (
    <div className={`absolute top-20 right-4 max-w-xs bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border ${borderColor} overflow-hidden animate-in slide-in-from-right fade-in duration-300 z-50 transform transition-all hover:scale-105`}>
      <div className="p-5">
        <div className="flex justify-between items-start gap-3 mb-3">
            <div className={`flex items-center gap-2 ${badgeColor} font-bold text-xs uppercase tracking-wider px-2 py-1 rounded-full`}>
                <Icon size={14} className={iconClass} />
                {label}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X size={16} />
            </button>
        </div>
        <p className="text-gray-800 text-sm font-medium leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
}
