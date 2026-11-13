import React from 'react';

export default function Header({ onHome }) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="text-lg font-semibold text-white tracking-tight italic">
          <span
            style={{
              fontFamily: '"Instrument Serif", "Times New Roman", serif',
              textShadow: '0 0 22px rgba(0,0,0,0.75)'
            }}
          >
            SecondLook
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onHome}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    </header>
  );
}
