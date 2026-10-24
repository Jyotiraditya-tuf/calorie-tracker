export const DEFAULT_GOALS = {
  calories: 2200,
  protein: 150,
  carbs: 220,
  fat: 70,
  fiber: 35
};

export const MEAL_CATEGORIES = [
  { id: 'Breakfast', label: 'Breakfast', icon: 'Sun', timeHint: '7:00 AM - 10:30 AM', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { id: 'Lunch', label: 'Lunch', icon: 'Utensils', timeHint: '12:00 PM - 2:30 PM', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'Dinner', label: 'Dinner', icon: 'Moon', timeHint: '7:00 PM - 9:30 PM', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
  { id: 'Snacks', label: 'Snacks', icon: 'Coffee', timeHint: 'Anytime fuel', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
];

export const GOAL_PRESETS = [
  {
    name: 'Balanced Lifestyle',
    description: '40% Carbs, 30% Protein, 30% Fat for general fitness',
    goals: { calories: 2200, protein: 165, carbs: 220, fat: 73, fiber: 35 }
  },
  {
    name: 'Lean Muscle Hypertrophy',
    description: 'High protein focus with caloric surplus for muscle building',
    goals: { calories: 2600, protein: 195, carbs: 290, fat: 72, fiber: 40 }
  },
  {
    name: 'Fat Loss & High Protein',
    description: 'Moderate calorie deficit preserving lean muscle tissue',
    goals: { calories: 1800, protein: 160, carbs: 150, fat: 60, fiber: 35 }
  },
  {
    name: 'Low Carb / Ketogenic',
    description: 'Higher healthy fats, moderate protein, under 50g net carbs',
    goals: { calories: 2000, protein: 125, carbs: 45, fat: 145, fiber: 30 }
  }
];

export function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function formatDateLabel(dateStr) {
  const todayStr = getTodayDateString();
  const date = new Date(dateStr + 'T00:00:00');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}
