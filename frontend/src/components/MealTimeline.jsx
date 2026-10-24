import React from 'react';
import { 
  Sun, 
  Utensils, 
  Moon, 
  Coffee, 
  Plus, 
  Trash2, 
  Sparkles, 
  Flame, 
  ChevronRight,
  Clock,
  Camera
} from 'lucide-react';
import { MEAL_CATEGORIES } from '../types/nutrition';

const CATEGORY_ICONS = {
  Breakfast: Sun,
  Lunch: Utensils,
  Dinner: Moon,
  Snacks: Coffee,
};

export default function MealTimeline({ meals, onLogCategory, onDeleteMeal }) {
  // Group meals by category
  const grouped = MEAL_CATEGORIES.map(cat => {
    const categoryMeals = meals.filter(m => m.category === cat.id);
    const totalCal = categoryMeals.reduce((sum, m) => sum + (m.totals.calories || 0), 0);
    const totalProtein = categoryMeals.reduce((sum, m) => sum + (m.totals.protein_g || 0), 0);
    const totalCarbs = categoryMeals.reduce((sum, m) => sum + (m.totals.carbs_g || 0), 0);
    const totalFat = categoryMeals.reduce((sum, m) => sum + (m.totals.fat_g || 0), 0);

    return {
      ...cat,
      meals: categoryMeals,
      totals: {
        calories: Math.round(totalCal),
        protein_g: Math.round(totalProtein),
        carbs_g: Math.round(totalCarbs),
        fat_g: Math.round(totalFat)
      }
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Today's Meal Timeline
        </h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {meals.length} meal{meals.length === 1 ? '' : 's'} logged
        </span>
      </div>

      <div className="space-y-3.5">
        {grouped.map((group) => {
          const Icon = CATEGORY_ICONS[group.id] || Utensils;
          const hasMeals = group.meals.length > 0;

          return (
            <div 
              key={group.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
            >
              {/* Category Header */}
              <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${group.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {group.label}
                      </h4>
                      {hasMeals && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          {group.totals.calories} kcal
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {group.timeHint}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasMeals && (
                    <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">
                      <span className="text-indigo-600 dark:text-indigo-400">P: {group.totals.protein_g}g</span>
                      <span className="text-amber-600 dark:text-amber-400">C: {group.totals.carbs_g}g</span>
                      <span className="text-rose-600 dark:text-rose-400">F: {group.totals.fat_g}g</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onLogCategory(group.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-all border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </div>
              </div>

              {/* Meals List */}
              {hasMeals ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {group.meals.map((meal) => (
                    <div 
                      key={meal.id}
                      className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        
                        {/* Meal info & decomposed items */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {meal.meal_name}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock className="w-3 h-3" />
                              {meal.timestamp}
                            </span>
                          </div>

                          {/* Ingredient Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {meal.items.map((it, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                              >
                                {it.name}
                                <span className="ml-1 text-[10px] text-slate-400">
                                  ({Math.round(it.calories)} kcal)
                                </span>
                              </span>
                            ))}
                          </div>

                          {/* AI Coach Tip if present */}
                          {meal.coach_tip && (
                            <div className="mt-2.5 flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-xl">
                              <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              <span>{meal.coach_tip}</span>
                            </div>
                          )}
                        </div>

                        {/* Nutrition Summary & Actions */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {Math.round(meal.totals.calories)} kcal
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              P: {Math.round(meal.totals.protein_g)}g • C: {Math.round(meal.totals.carbs_g)}g • F: {Math.round(meal.totals.fat_g)}g
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeleteMeal(meal.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Delete meal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No {group.label.toLowerCase()} logged yet today.{' '}
                  <button
                    onClick={() => onLogCategory(group.id)}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-1"
                  >
                    Snap or describe food
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
