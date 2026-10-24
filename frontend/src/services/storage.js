import { DEFAULT_GOALS, getTodayDateString } from '../types/nutrition';

const GOALS_KEY = 'nutrilens_goals_v1';
const LOGS_KEY = 'nutrilens_daily_logs_v1';
const THEME_KEY = 'nutrilens_theme_v1';

// Seed initial meal data if empty so new users immediately see a beautiful populated dashboard
const SEED_DATA = {
  [getTodayDateString()]: [
    {
      id: 'seed-breakfast-1',
      category: 'Breakfast',
      meal_name: 'Warm Berry & Chia Oatmeal Bowl',
      confidence: 'high',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      coach_tip: 'Outstanding gut-friendly fiber (>10g) with sustained slow-release energy for your morning.',
      clarification_chips: ['Made with Whole Milk', 'Made with Oat Milk'],
      items: [
        { name: 'Rolled Oats (cooked)', estimated_portion: '1 cup (234g)', calories: 166, protein_g: 5.9, carbs_g: 28.1, fat_g: 3.6, fiber_g: 4.0 },
        { name: 'Fresh Blueberries & Strawberries', estimated_portion: '1/2 cup (75g)', calories: 42, protein_g: 0.7, carbs_g: 10.2, fat_g: 0.3, fiber_g: 2.4 },
        { name: 'Chia Seeds & Crushed Almonds', estimated_portion: '1 tbsp chia + 6 almonds', calories: 105, protein_g: 3.8, carbs_g: 5.4, fat_g: 8.2, fiber_g: 4.2 }
      ],
      totals: {
        calories: 313,
        protein_g: 10.4,
        carbs_g: 43.7,
        fat_g: 12.1,
        fiber_g: 10.6
      }
    }
  ]
};

export function getStoredGoals() {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return DEFAULT_GOALS;
    return { ...DEFAULT_GOALS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to read goals from localStorage', e);
    return DEFAULT_GOALS;
  }
}

export function saveStoredGoals(goals) {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals', e);
  }
}

export function getAllLogs() {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) {
      localStorage.setItem(LOGS_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read logs from localStorage', e);
    return {};
  }
}

export function getLogsForDate(dateStr) {
  const all = getAllLogs();
  return all[dateStr] || [];
}

export function saveMealForDate(dateStr, mealData) {
  const all = getAllLogs();
  const dayLogs = all[dateStr] || [];
  
  const newMeal = {
    ...mealData,
    id: mealData.id || `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: mealData.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  all[dateStr] = [newMeal, ...dayLogs];
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save meal', e);
  }
  return all[dateStr];
}

export function updateMealForDate(dateStr, updatedMeal) {
  const all = getAllLogs();
  const dayLogs = all[dateStr] || [];
  const idx = dayLogs.findIndex(m => m.id === updatedMeal.id);
  if (idx !== -1) {
    dayLogs[idx] = updatedMeal;
    all[dateStr] = [...dayLogs];
    localStorage.setItem(LOGS_KEY, JSON.stringify(all));
  }
  return all[dateStr] || [];
}

export function deleteMealForDate(dateStr, mealId) {
  const all = getAllLogs();
  const dayLogs = all[dateStr] || [];
  all[dateStr] = dayLogs.filter(m => m.id !== mealId);
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to delete meal', e);
  }
  return all[dateStr];
}

export function exportBackupData() {
  const payload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    goals: getStoredGoals(),
    logs: getAllLogs()
  };
  return JSON.stringify(payload, null, 2);
}

export function importBackupData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.goals) {
      saveStoredGoals(parsed.goals);
    }
    if (parsed.logs && typeof parsed.logs === 'object') {
      localStorage.setItem(LOGS_KEY, JSON.stringify(parsed.logs));
    }
    return true;
  } catch (err) {
    console.error('Invalid backup data file', err);
    throw new Error('Invalid JSON backup file format');
  }
}

export function getThemePreference() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved !== null) return saved === 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function setThemePreference(isDark) {
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
