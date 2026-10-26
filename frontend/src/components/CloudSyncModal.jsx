import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  Flame, 
  AlertCircle,
  Database
} from 'lucide-react';
import { 
  getActiveSyncId, 
  setActiveSyncId, 
  getLastSyncedTime, 
  generateSyncCode, 
  performTwoWaySync,
  getFirebaseConfig,
  setFirebaseConfig
} from '../services/cloudSync';

export default function CloudSyncModal({ isOpen, onClose, onSyncComplete }) {
  const [syncId, setSyncId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbApiKey, setFbApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const active = getActiveSyncId();
      setSyncId(active);
      setInputCode(active);
      setLastSynced(getLastSyncedTime());
      setFeedback(null);
      const fb = getFirebaseConfig();
      if (fb) {
        setFbProjectId(fb.projectId || '');
        setFbApiKey(fb.apiKey || '');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateCode = async () => {
    const newCode = generateSyncCode();
    setSyncId(newCode);
    setInputCode(newCode);
    setActiveSyncId(newCode);
    handleTriggerSync(newCode);
  };

  const handleLinkCode = () => {
    if (!inputCode.trim()) return;
    const clean = inputCode.trim().toUpperCase();
    setSyncId(clean);
    setActiveSyncId(clean);
    handleTriggerSync(clean);
  };

  const handleTriggerSync = async (targetId = syncId) => {
    if (!targetId) return;
    setIsSyncing(true);
    setFeedback(null);
    try {
      const result = await performTwoWaySync();
      setLastSynced(result.lastSynced);
      setFeedback({
        type: 'success',
        text: result.provider === 'local_vault' 
          ? `Synced locally to Code ${targetId}. Connect a backend or Firebase to share across devices!`
          : `Successfully synchronized with cloud (${result.provider})!`
      });
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: 'Sync encountered an issue. Local records are safe and preserved.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCode = async () => {
    if (!syncId) return;
    await navigator.clipboard.writeText(syncId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    if (fbProjectId.trim() && fbApiKey.trim()) {
      setFirebaseConfig({
        projectId: fbProjectId.trim(),
        apiKey: fbApiKey.trim()
      });
      setFeedback({
        type: 'success',
        text: 'Firebase Firestore credentials configured and saved!'
      });
    } else {
      setFirebaseConfig(null);
      setFeedback({
        type: 'success',
        text: 'Custom Firebase configuration cleared.'
      });
    }
  };

  const formatLastSync = (isoString) => {
    if (!isoString) return 'Not yet synced';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + date.toLocaleDateString() + ')';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Device Cloud Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Keep meals and macros synchronized across phone and PC
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
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          
          {/* Status Feedback Banner */}
          {feedback && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300'
            }`}>
              {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Active Sync Code Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold uppercase tracking-wider">Your Device Sync Code</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {syncId ? 'Linked' : 'Standalone'}
              </span>
            </div>

            {syncId ? (
              <div className="flex items-center justify-between bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                <span className="font-mono text-xl font-extrabold tracking-widest text-emerald-300">
                  {syncId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-2 text-slate-400">
                No Sync Code linked. Generate one below or enter an existing code to connect another device.
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Last Synced:</span>
              <span className="font-medium text-slate-300">{formatLastSync(lastSynced)}</span>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTriggerSync()}
                disabled={!syncId || isSyncing}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateCode}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 transition-all"
              >
                Generate Code
              </button>
            </div>

            {/* Pair with another device */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                Link with Another Device
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Enter the exact Sync Code from your phone or PC to merge and access the same meal logs.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. NUTRI-AB1234"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 font-mono text-xs uppercase rounded-xl p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={handleLinkCode}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 active:scale-95 transition-all"
                >
                  Link
                </button>
              </div>
            </div>
          </div>

          {/* Optional Firebase Integration Accordion */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-between w-full py-1"
            >
              <span>Custom Firebase Firestore Cloud (Optional)</span>
              <span>{showAdvanced ? '▲' : '▼'}</span>
            </button>

            {showAdvanced && (
              <form onSubmit={handleSaveFirebase} className="mt-2 space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                  Provide your Firebase Project ID and Web API Key to store encrypted daily logs directly in your private Firebase Firestore cloud.
                </p>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Firebase Project ID</label>
                  <input
                    type="text"
                    placeholder="my-calorie-app"
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Firebase Web API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={fbApiKey}
                    onChange={(e) => setFbApiKey(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                  >
                    Save Firebase Settings
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
