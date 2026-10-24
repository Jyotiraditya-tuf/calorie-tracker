import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MacroDashboard from './components/MacroDashboard';
import MealTimeline from './components/MealTimeline';
import CameraModal from './components/CameraModal';
import PlateEditor from './components/PlateEditor';
import GoalSettingsModal from './components/GoalSettingsModal';
import BackupModal from './components/BackupModal';

import { 
  getStoredGoals, 
  saveStoredGoals, 
  getLogsForDate, 
  saveMealForDate, 
  deleteMealForDate,
  getThemePreference, 
  setThemePreference 
} from './services/storage';
import { checkBackendHealth, analyzeMealFood } from './services/api';
import { getTodayDateString } from './types/nutrition';
import { Camera, Sparkles, Plus, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentDate, setCurrentDate] = useState(getTodayDateString());
  const [goals, setGoals] = useState(getStoredGoals);
  const [meals, setMeals] = useState([]);
  const [backendStatus, setBackendStatus] = useState({ status: 'checking', gemini_configured: false });
  const [isDark, setIsDark] = useState(getThemePreference);

  // Modal open states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Lunch');
  const [pendingAnalysis, setPendingAnalysis] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initial theme sync
  useEffect(() => {
    setThemePreference(isDark);
  }, [isDark]);

  // Load meals on date change
  useEffect(() => {
    setMeals(getLogsForDate(currentDate));
  }, [currentDate]);

  // Check backend health periodically / on mount
  useEffect(() => {
    const checkHealth = async () => {
      const status = await checkBackendHealth();
      setBackendStatus(status);
    };
    checkHealth();
    const timer = setInterval(checkHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  // Handle Goal Update
  const handleSaveGoals = (newGoals) => {
    setGoals(newGoals);
    saveStoredGoals(newGoals);
  };

  // Open camera logger for specific category
  const handleOpenLogModal = (category = 'Lunch') => {
    setActiveCategory(category);
    setIsCameraOpen(true);
  };

  // Run analysis via API service
  const handleAnalyzeMeal = async ({ imageBlob, textPrompt, category, previewUrl }) => {
    setErrorMessage('');
    try {
      const result = await analyzeMealFood({ imageBlob, textPrompt });
      if (!result || !result.items || result.items.length === 0) {
        throw new Error('Analysis returned no food items');
      }
      setPendingPreviewUrl(previewUrl);
      setActiveCategory(category);
      setPendingAnalysis(result);
    } catch (err) {
      console.error('Meal analysis error:', err);
      setErrorMessage('Could not analyze the plate. Please verify food description or photo and try again.');
    }
  };

  // Save reviewed plate to daily timeline
  const handleSaveReviewedMeal = (finalizedMeal) => {
    const updatedDayLogs = saveMealForDate(currentDate, finalizedMeal);
    setMeals(updatedDayLogs);
    setPendingAnalysis(null);
    setPendingPreviewUrl(null);
  };

  // Delete a meal entry
  const handleDeleteMeal = (mealId) => {
    const updated = deleteMealForDate(currentDate, mealId);
    setMeals(updated);
  };

  // Reload data after restore
  const handleDataRestored = () => {
    setGoals(getStoredGoals());
    setMeals(getLogsForDate(currentDate));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        backendStatus={backendStatus}
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenGoals={() => setIsGoalsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Error Notification Banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-shake">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => setErrorMessage('')}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Macro Dashboard & Next Meal Coach Banner (USP 3) */}
        <MacroDashboard meals={meals} goals={goals} />

        {/* Daily Meal Timeline */}
        <MealTimeline
          meals={meals}
          onLogCategory={handleOpenLogModal}
          onDeleteMeal={handleDeleteMeal}
        />

      </main>

      {/* Floating Action Button for Quick Photo Log */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => handleOpenLogModal('Lunch')}
          className="group flex items-center gap-2 px-5 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all hover:shadow-2xl"
          title="Snap or log food"
        >
          <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Log Meal with AI</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
        </button>
      </div>

      {/* Modals */}
      {/* 1. Camera & Upload Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onAnalyze={handleAnalyzeMeal}
        initialCategory={activeCategory}
      />

      {/* 2. USP 1 & 2: Interactive Plate Editor & Decomposition */}
      {pendingAnalysis && (
        <PlateEditor
          initialAnalysis={pendingAnalysis}
          category={activeCategory}
          imagePreviewUrl={pendingPreviewUrl}
          onSaveMeal={handleSaveReviewedMeal}
          onCancel={() => {
            setPendingAnalysis(null);
            setPendingPreviewUrl(null);
          }}
        />
      )}

      {/* 3. Goal Customization Modal */}
      <GoalSettingsModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        currentGoals={goals}
        onSaveGoals={handleSaveGoals}
      />

      {/* 4. Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataRestored={handleDataRestored}
      />

    </div>
  );
}
