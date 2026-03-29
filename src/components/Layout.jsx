import { Outlet } from 'react-router-dom';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import NavBar from './NavBar';
import useSync from '../hooks/useSync';

const syncConfig = {
  idle: { text: 'CONECTADO', className: 'status-online', icon: Cloud, spin: false },
  syncing: { text: 'SINCRONIZANDO...', className: 'status-syncing', icon: RefreshCw, spin: true },
  synced: { text: 'SINCRONIZADO ✓', className: 'status-online', icon: CheckCircle2, spin: false },
  pending: { text: 'CAMBIOS PENDIENTES', className: 'status-pending', icon: Cloud, spin: false },
  error: { text: 'ERROR DE SYNC', className: 'status-offline', icon: AlertCircle, spin: false },
  offline: { text: 'SIN CONEXIÓN', className: 'status-offline', icon: CloudOff, spin: false },
  disabled: { text: navigator.onLine ? 'CONECTADO' : 'SIN CONEXIÓN', className: navigator.onLine ? 'status-online' : 'status-offline', icon: navigator.onLine ? Cloud : CloudOff, spin: false },
};

export default function Layout() {
  const { syncState, syncError, doSync } = useSync();
  const isOnline = navigator.onLine;

  const config = syncConfig[syncState] || syncConfig.idle;
  const Icon = config.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div
        className={`status-bar ${config.className}`}
        onClick={() => syncState !== 'syncing' && syncState !== 'disabled' && doSync()}
        style={{ cursor: syncState !== 'syncing' && syncState !== 'disabled' ? 'pointer' : 'default' }}
      >
        <div className="status-dot" />
        <Icon size={10} style={config.spin ? { animation: 'spin 1s linear infinite' } : {}} />
        <span>{syncState === 'disabled' ? (isOnline ? 'CONECTADO' : 'SIN CONEXIÓN') : config.text}</span>
      </div>
      {syncError && (
        <div style={{
          background: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          padding: '0.5rem 1rem',
          fontSize: '0.75rem',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <AlertCircle size={13} />
          <span><strong>Sin sync:</strong> {syncError}</span>
          <button
            onClick={doSync}
            style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >Reintentar</button>
        </div>
      )}
      <main className="page">
        <Outlet />
      </main>
      <NavBar />
    </div>
  );
}
