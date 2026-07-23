import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, ChevronDown, ChevronUp } from 'lucide-react';
import useFiados from '../../hooks/useFiados';
import { formatMoneda, formatFechaHora, parseNumero } from '../../utils/formatters';
import { toast } from '../../ui/dialogos';

export default function Fiados() {
  const { clientes, clientesConDeuda, totalDeudas, registrarPago } = useFiados();
  const [expandido, setExpandido] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [fiadoSeleccionado, setFiadoSeleccionado] = useState(null);

  async function handlePago() {
    if (!fiadoSeleccionado || !montoPago) return;
    const monto = parseNumero(montoPago);
    if (isNaN(monto) || monto <= 0) { toast('Ingresa un monto válido', 'error'); return; }
    try {
      await registrarPago(fiadoSeleccionado, monto);
      setMontoPago('');
      setFiadoSeleccionado(null);
      toast('Abono registrado');
    } catch { toast('Error al registrar pago', 'error'); }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fiados</h1>
        <Link to="/fiados/nuevo" className="btn btn-primary btn-sm"><Plus size={14} /> Nuevo</Link>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        <div className="stat-tile">
          <div className="stat-label">Deuda total</div>
          <div className="stat-value">{formatMoneda(totalDeudas)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Clientes con deuda</div>
          <div className="stat-value">{clientesConDeuda.length}</div>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="empty-state">
          <Users size={32} strokeWidth={1.5} />
          <p>No hay clientes registrados</p>
          <Link to="/fiados/nuevo" className="btn btn-primary btn-sm">Registrar cliente</Link>
        </div>
      ) : (
        <div className="card">
          {clientes.map((c, i) => (
            <div key={c.id} style={i > 0 ? { borderTop: '1px solid var(--color-border)' } : undefined}>
              <div
                className="list-row"
                style={{ cursor: 'pointer', borderTop: 'none' }}
                onClick={() => setExpandido(expandido === c.id ? null : c.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title">{c.nombre}</div>
                  <div className="row-meta">{c.telefono || 'Sin teléfono'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="row-amount">{formatMoneda(c.deuda_total || 0)}</div>
                  <span className={`badge ${c.deuda_total > 0 ? 'badge-warning' : 'badge-success'}`}>
                    {c.deuda_total > 0 ? 'Debe' : 'Al día'}
                  </span>
                </div>
                {expandido === c.id
                  ? <ChevronUp size={15} style={{ color: 'var(--color-ink-4)', flexShrink: 0 }} />
                  : <ChevronDown size={15} style={{ color: 'var(--color-ink-4)', flexShrink: 0 }} />}
              </div>

              {expandido === c.id && c.fiados && c.fiados.length > 0 && (
                <div style={{ padding: '0 1rem 0.75rem' }}>
                  {c.fiados.map((f) => (
                    <div key={f.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: '0.5rem', padding: '0.5rem 0',
                      borderTop: '1px solid var(--color-border)',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-2)' }}>
                          Fiado #{f.id} · {formatFechaHora(f.fecha)}
                        </div>
                        <div className="row-meta num">
                          Total: {formatMoneda(f.total)} · Pendiente: {formatMoneda(f.saldo_pendiente)}
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => { e.stopPropagation(); setFiadoSeleccionado(f.id); }}
                      >
                        Abonar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {fiadoSeleccionado && (
        <div className="modal-overlay" onClick={() => setFiadoSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Registrar abono</h2>
            </div>
            <div className="field">
              <label className="label">Monto del abono</label>
              <input
                type="text" inputMode="decimal"
                className="input input-amount" placeholder="0,00"
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary btn-block" onClick={() => setFiadoSeleccionado(null)}>Cancelar</button>
              <button className="btn btn-primary btn-block" onClick={handlePago}>Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
