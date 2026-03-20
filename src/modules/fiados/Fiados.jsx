import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import useFiados from '../../hooks/useFiados';
import { formatMoneda, formatFechaHora } from '../../utils/formatters';

export default function Fiados() {
  const { clientes, clientesConDeuda, totalDeudas, loading, registrarPago } = useFiados();
  const [expandido, setExpandido] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [fiadoSeleccionado, setFiadoSeleccionado] = useState(null);

  async function handlePago() {
    if (!fiadoSeleccionado || !montoPago) return;
    const monto = parseFloat(montoPago);
    if (isNaN(monto) || monto <= 0) { alert('Ingresa un monto válido'); return; }
    try { await registrarPago(fiadoSeleccionado, monto); setMontoPago(''); setFiadoSeleccionado(null); }
    catch (error) { alert('Error al registrar pago'); }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fiados</h1>
        <Link to="/fiados/nuevo" className="btn btn-primary btn-sm"><Plus size={13} /> Nuevo</Link>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
        <div className="stat-card yellow">
          <div className="stat-label">Deuda total</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{formatMoneda(totalDeudas)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Con deuda</div>
          <div className="stat-value" style={{ color: 'var(--color-blue)' }}>{clientesConDeuda.length}</div>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="empty-state">
          <Users size={44} />
          <p>No hay clientes registrados</p>
          <Link to="/fiados/nuevo" className="btn btn-primary btn-sm">Registrar cliente</Link>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {clientes.map((c) => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpandido(expandido === c.id ? null : c.id)}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{c.nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{c.telefono || 'Sin teléfono'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: c.deuda_total > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {formatMoneda(c.deuda_total || 0)}
                    </div>
                    <span className={c.deuda_total > 0 ? 'badge badge-warning' : 'badge badge-success'}>
                      {c.deuda_total > 0 ? 'Debe' : 'Al día'}
                    </span>
                  </div>
                  {expandido === c.id ? <ChevronUp size={15} color="var(--color-text-muted)" /> : <ChevronDown size={15} color="var(--color-text-muted)" />}
                </div>
              </div>

              {expandido === c.id && c.fiados && c.fiados.length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.6rem', paddingTop: '0.6rem' }}>
                  {c.fiados.map((f) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem' }}>Fiado #{f.id} — {formatFechaHora(f.fecha)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          Total: {formatMoneda(f.total)} · Pendiente: {formatMoneda(f.saldo_pendiente)}
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem' }}
                        onClick={(e) => { e.stopPropagation(); setFiadoSeleccionado(f.id); }}>
                        <DollarSign size={11} /> Abonar
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
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Registrar Abono</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Monto del abono</label>
              <input type="number" className="input" placeholder="0.00" step="0.01" value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
                style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button className="btn btn-secondary btn-block" onClick={() => setFiadoSeleccionado(null)}>Cancelar</button>
              <button className="btn btn-primary btn-block" onClick={handlePago}><DollarSign size={15} /> Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
