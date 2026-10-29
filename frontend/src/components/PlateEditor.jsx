import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Edit2, 
  Sparkles, 
  Flame, 
  Beef, 
  Wheat, 
  Droplet,
  ChevronDown,
  ChevronUp,
  Sliders,
  Utensils,
  Brain,
  Wand2
} from 'lucide-react';
import ClarificationChips from './ClarificationChips';
import { submitDishFeedback, getSimulatedFallback } from '../services/api';

export default function PlateEditor({ 
  initialAnalysis, 
  category = 'Lunch', 
  onSaveMeal, 
  onCancel,
  imagePreviewUrl 
}) {
  const originalSuggestedName = initialAnalysis.meal_name || '';
  const [mealName, setMealName] = useState(initialAnalysis.meal_name || 'Logged Meal');
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [items, setItems] = useState(initialAnalysis.items || []);
  const [coachTip, setCoachTip] = useState(initialAnalysis.coach_tip || '');
  const [confidence, setConfidence] = useState(initialAnalysis.confidence || 'high');
  const [chips, setChips] = useState(initialAnalysis.clarification_chips || []);
  const [editingItemId, setEditingItemId] = useState(null);

  // Check if dish name has been corrected by the user compared to AI suggestion
  const isNameCorrected = 
    Boolean(originalSuggestedName.trim()) &&
    mealName.trim().toLowerCase() !== originalSuggestedName.trim().toLowerCase();

  // Auto-adapt plate ingredients and macros to the corrected dish name
  const handleAdaptIngredients = () => {
    if (!mealName.trim()) return;
    const adapted = getSimulatedFallback(mealName.trim());
    if (adapted && adapted.items && adapted.items.length > 0) {
      setItems(adapted.items);
      if (adapted.coach_tip) setCoachTip(adapted.coach_tip);
      if (adapted.clarification_chips) setChips(adapted.clarification_chips);
      setConfidence(adapted.confidence || 'high');
    }
  };

  // New item draft state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPortion, setNewItemPortion] = useState('1 serving');
  const [newItemCalories, setNewItemCalories] = useState(100);
  const [newItemProtein, setNewItemProtein] = useState(5);
  const [newItemCarbs, setNewItemCarbs] = useState(15);
  const [newItemFat, setNewItemFat] = useState(3);
  const [newItemFiber, setNewItemFiber] = useState(1);

  // Calculate live recalculated totals
  const liveTotals = items.reduce(
    (acc, it) => {
      acc.calories += Number(it.calories) || 0;
      acc.protein_g += Number(it.protein_g) || 0;
      acc.carbs_g += Number(it.carbs_g) || 0;
      acc.fat_g += Number(it.fat_g) || 0;
      acc.fiber_g += Number(it.fiber_g) || 0;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  );

  // Adjust item portion multiplier (e.g. 0.5x, 1.25x, etc.)
  const handleScaleItem = (index, factor) => {
    setItems(prev => {
      const next = [...prev];
      const target = next[index];
      next[index] = {
        ...target,
        calories: Math.round(target.calories * factor),
        protein_g: Math.round((target.protein_g * factor) * 10) / 10,
        carbs_g: Math.round((target.carbs_g * factor) * 10) / 10,
        fat_g: Math.round((target.fat_g * factor) * 10) / 10,
        fiber_g: Math.round((target.fiber_g * factor) * 10) / 10,
        estimated_portion: `${target.estimated_portion} (scaled ${factor}x)`
      };
      return next;
    });
  };

  // Delete an item from the plate
  const handleDeleteItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Add custom manual item to plate
  const handleAddCustomItem = () => {
    if (!newItemName.trim()) return;
    const item = {
      name: newItemName.trim(),
      estimated_portion: newItemPortion.trim() || '1 serving',
      calories: Number(newItemCalories) || 0,
      protein_g: Number(newItemProtein) || 0,
      carbs_g: Number(newItemCarbs) || 0,
      fat_g: Number(newItemFat) || 0,
      fiber_g: Number(newItemFiber) || 0
    };
    setItems(prev => [...prev, item]);
    setIsAddingItem(false);
    setNewItemName('');
    setNewItemPortion('1 serving');
    setNewItemCalories(100);
    setNewItemProtein(5);
    setNewItemCarbs(15);
    setNewItemFat(3);
    setNewItemFiber(1);
  };

  // 1-Tap Clarification Chip Selection
  const handleSelectChip = (chipText) => {
    const chipLower = chipText.toLowerCase();

    // Check if chip is a modifier (e.g., skim milk vs whole milk, low fat, dressing)
    if (chipLower.includes('skim') || chipLower.includes('low-fat') || chipLower.includes('light')) {
      setItems(prev => prev.map(item => {
        if (item.name.toLowerCase().includes('milk') || item.name.toLowerCase().includes('paneer') || item.name.toLowerCase().includes('dressing')) {
          return {
            ...item,
            name: `${item.name} (${chipText})`,
            calories: Math.round(item.calories * 0.75),
            fat_g: Math.round(item.fat_g * 0.5 * 10) / 10
          };
        }
        return item;
      }));
    } else if (chipLower.includes('butter') || chipLower.includes('whole milk') || chipLower.includes('oil')) {
      setItems(prev => prev.map(item => {
        if (item.name.toLowerCase().includes('egg') || item.name.toLowerCase().includes('toast') || item.name.toLowerCase().includes('curry')) {
          return {
            ...item,
            name: `${item.name} (${chipText})`,
            calories: Math.round(item.calories * 1.2),
            fat_g: Math.round(item.fat_g * 1.3 * 10) / 10
          };
        }
        return item;
      }));
    } else {
      // General variation: append as an ingredient or note
      setMealName(prev => `${prev} (${chipText})`);
    }

    setConfidence('high');
    setChips(prev => prev.filter(c => c !== chipText));
  };

  // Commit to daily log
  const handleConfirm = () => {
    // If the user corrected the dish name, submit RL feedback for reinforcement learning
    if (isNameCorrected) {
      submitDishFeedback({
        original_name: originalSuggestedName,
        corrected_name: mealName.trim(),
        details: {
          items: items,
          totals: liveTotals,
          coach_tip: coachTip
        }
      });
    }

    const finalizedMeal = {
      meal_name: mealName,
      category: selectedCategory,
      confidence: confidence,
      coach_tip: coachTip,
      items: items,
      totals: {
        calories: Math.round(liveTotals.calories),
        protein_g: Math.round(liveTotals.protein_g * 10) / 10,
        carbs_g: Math.round(liveTotals.carbs_g * 10) / 10,
        fat_g: Math.round(liveTotals.fat_g * 10) / 10,
        fiber_g: Math.round(liveTotals.fiber_g * 10) / 10,
      },
      imagePreviewUrl: imagePreviewUrl || null
    };
    onSaveMeal(finalizedMeal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Multi-Item Plate Breakdown
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  confidence === 'high' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {confidence} confidence
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust portion multipliers or delete items before logging
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Meal Name & Category Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Meal Name
              </label>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="w-full text-sm font-semibold rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Meal Slot
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-sm font-semibold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reinforcement Learning Banner when user corrects dish name */}
          {isNameCorrected && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 animate-fade-in text-xs">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-purple-700 dark:text-purple-300">RLHF Learning:</span> AI will remember{' '}
                  <span className="line-through opacity-75">{originalSuggestedName}</span> →{' '}
                  <span className="font-bold text-purple-900 dark:text-purple-100 underline decoration-purple-400">{mealName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdaptIngredients}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold text-xs transition-all shadow-sm flex-shrink-0 self-end sm:self-auto cursor-pointer"
                title="Automatically adapt plate ingredients and nutrition to the corrected dish name"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Re-align Plate Items
              </button>
            </div>
          )}

          {/* 1-Tap Clarification Chips (USP 2) */}
          {confidence !== 'high' && chips.length > 0 && (
            <ClarificationChips 
              chips={chips} 
              confidence={confidence} 
              onSelectChip={handleSelectChip} 
            />
          )}

          {/* AI Coach Tip Banner */}
          {coachTip && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold mr-1">Dietitian Tip:</span>
                {coachTip}
              </div>
            </div>
          )}

          {/* Decomposed Items List (USP 1) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Detected Plate Components ({items.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Missing Item
              </button>
            </div>

            {/* Inline Add Item Form */}
            {isAddingItem && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Add Item to Plate
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Item name (e.g. Sliced Almonds)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="text-xs rounded-xl p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Portion (e.g. 1 tbsp)"
                    value={newItemPortion}
                    onChange={(e) => setNewItemPortion(e.target.value)}
                    className="text-xs rounded-xl p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">Calories (kcal)</span>
                    <input
                      type="number"
                      value={newItemCalories}
                      onChange={(e) => setNewItemCalories(e.target.value)}
                      className="w-full text-xs rounded-lg p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Protein (g)</span>
                    <input
                      type="number"
                      value={newItemProtein}
                      onChange={(e) => setNewItemProtein(e.target.value)}
                      className="w-full text-xs rounded-lg p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Carbs (g)</span>
                    <input
                      type="number"
                      value={newItemCarbs}
                      onChange={(e) => setNewItemCarbs(e.target.value)}
                      className="w-full text-xs rounded-lg p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Fat (g)</span>
                    <input
                      type="number"
                      value={newItemFat}
                      onChange={(e) => setNewItemFat(e.target.value)}
                      className="w-full text-xs rounded-lg p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {items.map((item, idx) => (
              <div 
                key={idx}
                className="group relative p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Portion: <span className="font-medium text-slate-700 dark:text-slate-300">{item.estimated_portion}</span>
                    </p>

                    {/* Macro pills */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                        <Flame className="w-3 h-3 text-emerald-500" />
                        {Math.round(item.calories)} kcal
                      </span>
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md font-medium text-[11px]">
                        P: {item.protein_g}g
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md font-medium text-[11px]">
                        C: {item.carbs_g}g
                      </span>
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md font-medium text-[11px]">
                        F: {item.fat_g}g
                      </span>
                      {item.fiber_g > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                          Fiber: {item.fiber_g}g
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Multipliers */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Quick Portion Steppers */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/80 p-0.5 rounded-lg text-slate-700 dark:text-slate-200">
                      <button
                        type="button"
                        onClick={() => handleScaleItem(idx, 0.75)}
                        className="px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-white dark:hover:bg-slate-600"
                        title="Reduce portion by 25%"
                      >
                        0.75x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleItem(idx, 1.25)}
                        className="px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-white dark:hover:bg-slate-600"
                        title="Increase portion by 25%"
                      >
                        1.25x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleItem(idx, 1.5)}
                        className="px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-white dark:hover:bg-slate-600"
                        title="Increase portion by 50%"
                      >
                        1.5x
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recalculated Live Totals Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Recalculated Plate Totals</span>
              <span className="text-emerald-400 font-bold">{items.length} components</span>
            </div>
            
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white">
                  {Math.round(liveTotals.calories)}
                </span>
                <span className="ml-1 text-xs text-slate-400 font-medium">kcal</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
                <span className="text-indigo-300">P: {Math.round(liveTotals.protein_g)}g</span>
                <span className="text-amber-300">C: {Math.round(liveTotals.carbs_g)}g</span>
                <span className="text-rose-300">F: {Math.round(liveTotals.fat_g)}g</span>
                <span className="text-emerald-300 text-xs font-medium">Fiber: {Math.round(liveTotals.fiber_g)}g</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Check className="w-4 h-4" />
            Log Meal to {selectedCategory}
          </button>
        </div>

      </div>
    </div>
  );
}
