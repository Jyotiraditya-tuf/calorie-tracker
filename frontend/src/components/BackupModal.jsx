import React, { useState } from 'react';
import { Database, Download, Upload, Copy, Check, X, AlertCircle } from 'lucide-react';
import { exportBackupData, importBackupData } from '../services/storage';

export default function BackupModal({ isOpen, onClose, onDataRestored }) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleDownload = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nutrilens-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Backup file downloaded successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCopyClipboard = async () => {
    try {
      const jsonStr = exportBackupData();
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          importBackupData(content);
          setSuccessMsg('Data restored successfully!');
          setErrorMsg('');
          onDataRestored();
          setTimeout(() => {
            onClose();
          }, 1000);
        } catch (err) {
          setErrorMsg('Invalid backup file. Please verify JSON format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportText = () => {
    if (!importText.trim()) return;
    try {
      importBackupData(importText.trim());
      setSuccessMsg('Data restored successfully!');
      setErrorMsg('');
      onDataRestored();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg('Invalid JSON string format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Backup & Restore Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Keep your local meal logs safe across devices
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
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Export Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Export Daily Logs & Targets
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all"
              >
                <Download className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Download JSON File
              </button>
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Restore from Backup
            </label>
            
            <div>
              <label className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300 transition-all">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Upload backup .json file</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-slate-400">Or paste JSON string:</span>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"version": "1.0", "goals": {...}, "logs": {...}}'
                rows={3}
                className="w-full mt-1 text-xs font-mono rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleImportText}
                disabled={!importText.trim()}
                className="mt-2 w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
              >
                Restore Pasted Data
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
