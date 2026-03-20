import { useState, useEffect, useCallback, useRef } from 'react';
import { syncAll, getPendingCount } from '../db/syncService';
import { isSupabaseConfigured } from '../db/supabase';

// Sync states: 'idle' | 'syncing' | 'synced' | 'pending' | 'error' | 'offline' | 'disabled'
export default function useSync() {
  const [syncState, setSyncState] = useState(isSupabaseConfigured() ? 'idle' : 'disabled');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const intervalRef = useRef(null);

  const doSync = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    setSyncState('syncing');
    try {
      const result = await syncAll();
      if (result.success) {
        setSyncState('synced');
        setLastSync(new Date());
        setPendingCount(0);
        // Reset to idle after 3 seconds
        setTimeout(() => setSyncState('idle'), 3000);
      } else {
        setSyncState('error');
      }
    } catch (err) {
      console.error('Sync error:', err);
      setSyncState('error');
    }
  }, []);

  const checkPending = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const count = await getPendingCount();
    setPendingCount(count);
    if (count > 0 && navigator.onLine) {
      setSyncState('pending');
    }
  }, []);

  // Auto-sync every 60 seconds
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Initial sync after 2 seconds
    const timeout = setTimeout(() => doSync(), 2000);

    // Periodic sync
    intervalRef.current = setInterval(() => {
      if (navigator.onLine) doSync();
    }, 60000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, [doSync]);

  // Listen for online/offline events
  useEffect(() => {
    function handleOnline() {
      doSync();
    }
    function handleOffline() {
      setSyncState('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [doSync]);

  return {
    syncState,
    pendingCount,
    lastSync,
    doSync,
    checkPending,
  };
}
