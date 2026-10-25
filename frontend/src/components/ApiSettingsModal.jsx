import React, { useState, useEffect } from 'react';
import { Key, Server, Check, X, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { 
  getClientGeminiApiKey, 
  setClientGeminiApiKey, 
  getCustomBackendUrl, 
  setCustomBackendUrl 
} from '../services/api';

export default function ApiSettingsModal({ isOpen, onClose, onSettingsSaved }) {
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getClientGeminiApiKey());
      setBackendUrl(getCustomBackendUrl());
      setSavedNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setClientGeminiApiKey(apiKey.trim());
    setCustomBackendUrl(backendUrl.trim());
    setSavedNotice(true);
    if (onSettingsSaved) onSettingsSaved();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI & API Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure live Gemini AI for mobile/cloud use
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
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto text-xs">
          
          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-500" />
              Settings saved! Live AI is active.
            </div>
          )}

          {/* Gemini Direct API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                Gemini API Key (Recommended for Mobile)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                Get Free Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Enables live multimodal AI directly from your phone browser when using Vercel without needing a local server.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full text-xs font-mono rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Stored securely in your device's browser only.
            </div>
          </div>

          {/* Custom Backend URL */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-500" />
              Custom Backend URL (Optional)
            </label>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              If you deployed the FastAPI backend (e.g. Render, Railway, or local IP like <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">http://192.168.1.5:8000</code>).
            </p>
            <input
              type="text"
              placeholder="e.g. https://my-fastapi-backend.onrender.com"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="w-full text-xs font-mono rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Configuration
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
