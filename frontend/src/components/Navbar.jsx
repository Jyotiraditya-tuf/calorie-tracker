import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Sparkles, 
  Target, 
  Database, 
  Sun, 
  Moon, 
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatDateLabel, getTodayDateString } from '../types/nutrition';

export default function Navbar({
  currentDate,
  setCurrentDate,
  backendStatus,
  isDark,
  setIsDark,
  onOpenGoals,
  onOpenBackup
}) {
  const isToday = currentDate === getTodayDateString();

  const handlePrevDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setCurrentDate(getTodayDateString());
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* Brand & AI Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-300 dark:to-teal-200 bg-clip-text text-transparent">
                NutriLens
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/50">
                AI
              </span>
            </div>
            
            {/* Connection badge */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              {backendStatus.status === 'healthy' ? (
                backendStatus.gemini_configured ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Gemini 2.5 Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Demo Fallback
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Local Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center px-2 py-0.5 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
            <span className="mr-1.5">{formatDateLabel(currentDate)}</span>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Pick Date"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleSetToday}
              className="ml-1 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-md hover:bg-emerald-100 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Target Goals */}
          <button
            onClick={onOpenGoals}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all hover:scale-105"
            title="Macro Goals"
          >
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Backup / Export */}
          <button
            onClick={onOpenBackup}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all hover:scale-105"
            title="Backup & Restore Data"
          >
            <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all hover:scale-105"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>

      </div>
    </header>
  );
}
