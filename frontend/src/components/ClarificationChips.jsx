import React from 'react';
import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

export default function ClarificationChips({ chips, confidence, onSelectChip }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-3.5 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
        <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
        <span>1-Tap Clarification Chips</span>
        <span className="ml-auto text-[10px] font-normal uppercase px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
          Confidence: {confidence}
        </span>
      </div>

      <p className="text-xs text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
        Food preparation details are ambiguous. Tap a chip to refine ingredients instantly:
      </p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectChip(chip)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700 hover:bg-amber-100/60 dark:hover:bg-amber-900/60 transition-all hover:scale-105 active:scale-95 shadow-xs"
          >
            <span>{chip}</span>
            <ArrowRight className="w-3 h-3 text-amber-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
