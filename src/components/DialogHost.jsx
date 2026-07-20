import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { _registrarEmisor } from '../ui/dialogos';

export default function DialogHost() {
  const [toasts, setToasts] = useState([]);
  const [confirmacion, setConfirmacion] = useState(null);

  useEffect(() => {
    return _registrarEmisor((evt) => {
      if (evt.kind === 'toast') {
        setToasts((prev) => [...prev, evt]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== evt.id));
        }, 2800);
      } else if (evt.kind === 'confirm') {
        setConfirmacion(evt);
      }
    });
  }, []);

  const cerrar = useCallback((ok) => {
    confirmacion?.resolve(ok);
    setConfirmacion(null);
  }, [confirmacion]);

  useEffect(() => {
    if (!confirmacion) return;
    const onKey = (e) => {
      if (e.key === 'Escape') cerrar(false);
      if (e.key === 'Enter') cerrar(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmacion, cerrar]);

  return (
    <>
      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-item is-${t.tipo}`}>
              {t.tipo === 'error'
                ? <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                : <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />}
              <span>{t.mensaje}</span>
            </div>
          ))}
        </div>
      )}

      {confirmacion && (
        <div className="dialog-overlay" onClick={() => cerrar(false)}>
          <div className="dialog-card" role="alertdialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="dialog-title">{confirmacion.titulo}</h2>
            {confirmacion.mensaje && <p className="dialog-message">{confirmacion.mensaje}</p>}
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => cerrar(false)}>
                {confirmacion.textoCancelar}
              </button>
              <button
                className={`btn ${confirmacion.peligro ? 'btn-danger-solid' : 'btn-primary'}`}
                onClick={() => cerrar(true)}
                autoFocus
              >
                {confirmacion.textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
