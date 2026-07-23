import { Outlet } from 'react-router-dom';
import { Cloud, RefreshCw, AlertCircle } from 'lucide-react';
import NavBar from './NavBar';
import DialogHost from './DialogHost';
import useSync from '../hooks/useSync';

const syncConfig = {
  idle: { text: 'Conectado', tone: 'is-online' },
  syncing: { text: 'Sincronizando', tone: 'is-online', spin: true },
  synced: { text: 'Sincronizado', tone: 'is-online' },
  pending: { text: 'Cambios pendientes', tone: 'is-warning' },
  error: { text: 'Error de sync', tone: 'is-error' },
  offline: { text: 'Sin conexión', tone: 'is-warning' },
  disabled: { text: 'Nube sin configurar', tone: 'is-warning' },
};

export default function Layout() {
  const { syncState, syncError, doSync } = useSync();
  const isOnline = navigator.onLine;

  const config = syncState === 'disabled'
    ? (isOnline ? syncConfig.disabled : syncConfig.offline)
    : (syncConfig[syncState] || syncConfig.idle);
  const canSync = syncState !== 'syncing' && syncState !== 'disabled';

  return (
    <div className="app-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <Cloud size={18} strokeWidth={2.2} />
            <span>Tienda Cielo</span>
          </div>
          <button
            type="button"
            className={`sync-chip ${config.tone}`}
            onClick={() => canSync && doSync()}
            title={canSync ? 'Sincronizar ahora' : undefined}
          >
            {config.spin
              ? <RefreshCw size={11} className="spin" />
              : <span className="sync-dot" />}
            {config.text}
          </button>
        </div>
      </header>

      {syncError && (
        <div className="error-banner">
          <div className="error-banner-inner">
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            <span><strong>Sin sync:</strong> {syncError}</span>
            <button
              onClick={doSync}
              style={{
                marginLeft: 'auto', font: 'inherit', fontWeight: 500,
                color: 'inherit', textDecoration: 'underline',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >Reintentar</button>
          </div>
        </div>
      )}

      <main className="page">
        <Outlet />
      </main>
      <NavBar />
      <DialogHost />
    </div>
  );
}
