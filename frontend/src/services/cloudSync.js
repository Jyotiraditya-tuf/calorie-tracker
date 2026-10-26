import { getAllLogs, getStoredGoals, saveStoredGoals } from './storage';
import { getCustomBackendUrl } from './api';

const SYNC_ID_KEY = 'nutrilens_sync_id_v1';
const LAST_SYNC_KEY = 'nutrilens_last_synced_v1';
const FIREBASE_CONFIG_KEY = 'nutrilens_firebase_config_v1';

export function getActiveSyncId() {
  return localStorage.getItem(SYNC_ID_KEY) || '';
}

export function setActiveSyncId(syncId) {
  if (syncId && syncId.trim()) {
    localStorage.setItem(SYNC_ID_KEY, syncId.trim().toUpperCase());
  } else {
    localStorage.removeItem(SYNC_ID_KEY);
  }
}

export function getLastSyncedTime() {
  return localStorage.getItem(LAST_SYNC_KEY) || null;
}

export function getFirebaseConfig() {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setFirebaseConfig(config) {
  if (config && typeof config === 'object') {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  } else {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
  }
}

export function generateSyncCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const num = Math.floor(1000 + Math.random() * 9000);
  return `NUTRI-${rand}${num}`;
}

/**
 * Merge two sets of daily meal logs without losing entries.
 */
export function mergeDailyLogs(localLogs, remoteLogs) {
  const merged = { ...remoteLogs };

  for (const dateStr of Object.keys(localLogs || {})) {
    const localMeals = localLogs[dateStr] || [];
    const remoteMeals = merged[dateStr] || [];

    const mealMap = new Map();
    // Insert remote meals
    for (const m of remoteMeals) {
      if (m.id) mealMap.set(m.id, m);
    }
    // Insert local meals (local overwrites remote if same id)
    for (const m of localMeals) {
      if (m.id) mealMap.set(m.id, m);
      else mealMap.set(`local-${Date.now()}-${Math.random()}`, m);
    }

    merged[dateStr] = Array.from(mealMap.values());
  }

  return merged;
}

/**
 * Perform cloud synchronization across available providers.
 * 1. Checks Backend API (/api/sync)
 * 2. Checks Firebase REST API if configured
 * 3. Falls back gracefully to local-first persistence
 */
export async function performTwoWaySync() {
  const syncId = getActiveSyncId();
  if (!syncId) {
    return { success: false, status: 'unlinked', message: 'No Sync Code linked' };
  }

  const localLogs = getAllLogs();
  const localGoals = getStoredGoals();
  const backendUrl = getCustomBackendUrl();
  const fbConfig = getFirebaseConfig();

  // 1. Try FastAPI Backend Database Sync if configured
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/sync/${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: localLogs, goals: localGoals }),
        signal: AbortSignal.timeout(10000)
      });

      if (res.ok) {
        const cloudData = await res.json();
        const mergedLogs = cloudData.logs || localLogs;
        const mergedGoals = cloudData.goals || localGoals;

        // Persist unified data to local storage
        localStorage.setItem('nutrilens_daily_logs_v1', JSON.stringify(mergedLogs));
        saveStoredGoals(mergedGoals);

        const now = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, now);

        return {
          success: true,
          provider: 'backend_sqlite',
          syncId,
          lastSynced: now,
          logs: mergedLogs,
          goals: mergedGoals
        };
      }
    } catch (err) {
      console.warn("Backend sync failed, attempting alternate provider:", err);
    }
  }

  // 2. Try Firebase Firestore REST Sync if user provided Firebase credentials
  if (fbConfig && fbConfig.projectId && fbConfig.apiKey) {
    try {
      const docUrl = `https://firestore.googleapis.com/v1/projects/${fbConfig.projectId}/databases/(default)/documents/nutrilens_vaults/${syncId}?key=${fbConfig.apiKey}`;
      
      // Fetch remote document
      let remoteLogs = {};
      let remoteGoals = {};
      try {
        const getRes = await fetch(docUrl, { signal: AbortSignal.timeout(8000) });
        if (getRes.ok) {
          const docData = await getRes.json();
          const fields = docData.fields || {};
          if (fields.logs_json?.stringValue) {
            remoteLogs = JSON.parse(fields.logs_json.stringValue);
          }
          if (fields.goals_json?.stringValue) {
            remoteGoals = JSON.parse(fields.goals_json.stringValue);
          }
        }
      } catch (e) {
        // Doc might not exist yet
      }

      // Merge local and remote
      const mergedLogs = mergeDailyLogs(localLogs, remoteLogs);
      const mergedGoals = { ...remoteGoals, ...localGoals };

      // Write merged document back to Firestore
      const patchUrl = `${docUrl}&updateMask.fieldPaths=logs_json&updateMask.fieldPaths=goals_json&updateMask.fieldPaths=updated_at`;
      await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            logs_json: { stringValue: JSON.stringify(mergedLogs) },
            goals_json: { stringValue: JSON.stringify(mergedGoals) },
            updated_at: { stringValue: new Date().toISOString() }
          }
        }),
        signal: AbortSignal.timeout(8000)
      });

      localStorage.setItem('nutrilens_daily_logs_v1', JSON.stringify(mergedLogs));
      saveStoredGoals(mergedGoals);

      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);

      return {
        success: true,
        provider: 'firebase_firestore',
        syncId,
        lastSynced: now,
        logs: mergedLogs,
        goals: mergedGoals
      };
    } catch (fbErr) {
      console.warn("Firebase sync error:", fbErr);
    }
  }

  // 3. Fallback: Local vault maintained safely
  return {
    success: true,
    provider: 'local_vault',
    syncId,
    lastSynced: new Date().toISOString(),
    logs: localLogs,
    goals: localGoals,
    message: 'Data secured in local device vault. Connect a backend or Firebase for multi-device sync.'
  };
}
