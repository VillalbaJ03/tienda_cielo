import { useState, useEffect, useCallback, useRef } from 'react';
import { syncAll, getPendingCount, initRealtimeSubscription } from '../db/syncService';
import { isSupabaseConfigured } from '../db/supabase';

// Sync states: 'idle' | 'syncing' | 'synced' | 'pending' | 'error' | 'offline' | 'disabled'
export default function useSync() {
  const [syncState, setSyncState] = useState(isSupabaseConfigured() ? 'idle' : 'disabled');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null); // mensaje de error visible al usuario
  const intervalRef = useRef(null);

  const doSync = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    setSyncState('syncing');
    setSyncError(null);
    try {
      const result = await syncAll();
      if (result.success) {
        setSyncState('synced');
        setLastSync(new Date());
        setPendingCount(0);
        setSyncError(null);
        setTimeout(() => setSyncState('idle'), 3000);
      } else {
        setSyncState('error');
        setSyncError(result.message || 'Error al sincronizar. El registro puede no estar visible en el bot aún.');
      }
    } catch (err) {
      console.error('Sync error:', err);
      setSyncState('error');
      setSyncError('Error de conexión. El registro puede no estar visible en el bot hasta que se sincronice.');
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

  // Efecto Principal de Sincronización
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    console.log('[SYNC] Hook inicializado');
    initRealtimeSubscription();

    // Sync completo al abrir la app
    const initialTimeout = setTimeout(() => doSync(), 2000);

    // Fallback sync periódico (5 minutos)
    intervalRef.current = setInterval(() => {
      if (navigator.onLine) doSync();
    }, 300000);

    // Push inmediato cuando cambia algo local (debounce reducido a 500ms)
    let pushTimeout = null;
    function handleLocalDbPush() {
      if (navigator.onLine) {
        if (pushTimeout) clearTimeout(pushTimeout);
        pushTimeout = setTimeout(() => doSync(), 500);
      }
    }
    window.addEventListener('local-db-changed', handleLocalDbPush);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalRef.current);
      if (pushTimeout) clearTimeout(pushTimeout);
      window.removeEventListener('local-db-changed', handleLocalDbPush);
    };
  }, [doSync]);

  // Escuchar online/offline
  useEffect(() => {
    function handleOnline() { doSync(); }
    function handleOffline() { setSyncState('offline'); }
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
    syncError,
    doSync,
    checkPending,
  };
}
