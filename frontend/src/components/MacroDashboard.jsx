import React from 'react';
import { Sparkles, Trophy, AlertTriangle, ArrowUpRight, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MacroDashboard({ meals, goals }) {
  // Aggregate totals for the day
  const consumed = meals.reduce(
    (acc, meal) => {
      acc.calories += meal.totals.calories || 0;
      acc.protein += meal.totals.protein_g || 0;
      acc.carbs += meal.totals.carbs_g || 0;
      acc.fat += meal.totals.fat_g || 0;
      acc.fiber += meal.totals.fiber_g || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const calRemaining = Math.max(0, goals.calories - consumed.calories);
  const calPercent = Math.min(100, Math.round((consumed.calories / goals.calories) * 100)) || 0;

  const proteinRemaining = Math.max(0, goals.protein - consumed.protein);
  const proteinPercent = Math.min(100, Math.round((consumed.protein / goals.protein) * 100)) || 0;

  const carbsRemaining = Math.max(0, goals.carbs - consumed.carbs);
  const carbsPercent = Math.min(100, Math.round((consumed.carbs / goals.carbs) * 100)) || 0;

  const fatRemaining = Math.max(0, goals.fat - consumed.fat);
  const fatPercent = Math.min(100, Math.round((consumed.fat / goals.fat) * 100)) || 0;

  // Generate dynamic smart coach advice based on remaining balance
  const generateDynamicCoachAdvice = () => {
    if (meals.length === 0) {
      return "Start your day with high-quality protein and complex carbs (e.g., oatmeal with berries and eggs) to stabilize blood sugar and prime muscle protein synthesis.";
    }

    if (consumed.calories >= goals.calories) {
      if (consumed.protein >= goals.protein) {
        return "Daily targets achieved! You met your protein and calorie target. Stay hydrated and prioritize restorative sleep.";
      }
      return "You have reached your calorie ceiling, but are still under your protein goal. If hungry, opt for zero-fat Greek yogurt, egg white scramble, or a light whey shake.";
    }

    // Still have calorie budget
    if (proteinRemaining > 40 && calRemaining < 400) {
      return `Target Alert: You need ${Math.round(proteinRemaining)}g protein with only ${Math.round(calRemaining)} kcal left. Prioritize pure lean protein: grilled chicken breast, white fish, seitan, or isolate protein.`;
    }

    if (proteinRemaining > 35) {
      return `Next Meal Recommendation: Anchor your next plate with at least 35-40g of protein (e.g., 200g paneer, 180g chicken/tofu, or 4 eggs) alongside fibrous vegetables.`;
    }

    if (carbsRemaining > 100 && calRemaining > 600) {
      return `Fueling Window: You have room for clean complex carbohydrates (sweet potatoes, quinoa, brown rice, or fruits) to replenish glycogen stores.`;
    }

    if (calRemaining <= 300) {
      return `Evening Wind-Down: You have ${Math.round(calRemaining)} kcal left for today. A light herbal tea with a small handful of berries or cottage cheese will keep you satisfied.`;
    }

    return `Steady Progress: You have consumed ${Math.round(consumed.calories)} kcal across ${meals.length} meal${meals.length > 1 ? 's' : ''}. Keep pacing your hydration and macros evenly.`;
  };

  const coachAdvice = generateDynamicCoachAdvice();

  // Trigger celebration confetti
  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Smart Coach Recommendation Banner (USP 3) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-0.5 shadow-lg shadow-emerald-500/10">
        <div className="relative rounded-[15px] bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  Dynamic Macro Coach
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </span>
                {consumed.protein >= goals.protein && consumed.calories <= goals.calories + 100 && (
                  <button 
                    onClick={handleCelebrate}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" /> Goal Hit!
                  </button>
                )}
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                {coachAdvice}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        
        {/* Calories Ring / Main Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Calories</span>
            <Flame className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {Math.round(consumed.calories)}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              / {goals.calories} kcal
            </span>
          </div>

          {/* Calorie Bar & Remaining */}
          <div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  consumed.calories > goals.calories 
                    ? 'bg-rose-500' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, calPercent)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {calPercent}% consumed
              </span>
              <span className={`font-semibold ${
                consumed.calories > goals.calories ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {consumed.calories > goals.calories 
                  ? `+${Math.round(consumed.calories - goals.calories)} over` 
                  : `${Math.round(calRemaining)} left`}
              </span>
            </div>
          </div>
        </div>

        {/* Protein, Carbs, Fat Cards */}
        <div className="md:col-span-3 grid grid-cols-3 gap-3">
          
          {/* Protein */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Protein</span>
              <Beef className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {Math.round(consumed.protein)}<span className="text-xs font-medium text-slate-500">g</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Goal: {goals.protein}g
              </div>
            </div>
            <div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 text-right">
                {proteinRemaining > 0 ? `${Math.round(proteinRemaining)}g left` : 'Completed'}
              </div>
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Carbs</span>
              <Wheat className="w-4 h-4 text-amber-500" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {Math.round(consumed.carbs)}<span className="text-xs font-medium text-slate-500">g</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Goal: {goals.carbs}g
              </div>
            </div>
            <div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 text-right">
                {carbsRemaining > 0 ? `${Math.round(carbsRemaining)}g left` : 'Completed'}
              </div>
            </div>
          </div>

          {/* Fat */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Fats</span>
              <Droplet className="w-4 h-4 text-rose-500" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {Math.round(consumed.fat)}<span className="text-xs font-medium text-slate-500">g</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Goal: {goals.fat}g
              </div>
            </div>
            <div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 text-right">
                {fatRemaining > 0 ? `${Math.round(fatRemaining)}g left` : 'Completed'}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
