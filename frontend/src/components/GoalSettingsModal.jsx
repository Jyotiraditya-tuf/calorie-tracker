import React, { useState } from 'react';
import { Target, X, Check, Sparkles } from 'lucide-react';
import { GOAL_PRESETS } from '../types/nutrition';

export default function GoalSettingsModal({ isOpen, onClose, currentGoals, onSaveGoals }) {
  const [goals, setGoals] = useState(currentGoals);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setGoals(preset.goals);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveGoals({
      calories: Number(goals.calories) || 2000,
      protein: Number(goals.protein) || 150,
      carbs: Number(goals.carbs) || 200,
      fat: Number(goals.fat) || 65,
      fiber: Number(goals.fiber) || 30,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Customize Daily Macro Goals
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set personalized caloric and macronutrient targets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Quick Diet Archetypes
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 transition-all hover:scale-[1.02]"
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Calorie Target (kcal)
              </label>
              <input
                type="number"
                min="500"
                max="8000"
                value={goals.calories}
                onChange={(e) => setGoals({ ...goals, calories: e.target.value })}
                className="w-full text-sm font-bold rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={goals.protein}
                  onChange={(e) => setGoals({ ...goals, protein: e.target.value })}
                  className="w-full text-sm font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  min="0"
                  max="800"
                  value={goals.carbs}
                  onChange={(e) => setGoals({ ...goals, carbs: e.target.value })}
                  className="w-full text-sm font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  min="10"
                  max="400"
                  value={goals.fat}
                  onChange={(e) => setGoals({ ...goals, fat: e.target.value })}
                  className="w-full text-sm font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                Dietary Fiber Target (g)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={goals.fiber}
                onChange={(e) => setGoals({ ...goals, fiber: e.target.value })}
                className="w-full text-sm font-bold rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" /> Save Goals
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
