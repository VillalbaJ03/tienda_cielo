import { useState, useEffect } from 'react';
import { Wallet, DoorOpen, DoorClosed, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { abrirCaja, cerrarCaja, obtenerCajaDelDia, obtenerVentasDelDia, obtenerGastosDelDia } from '../../db/database';
import { formatMoneda, formatFechaHora } from '../../utils/formatters';

export default function Caja() {
  const [caja, setCaja] = useState(null);
  const [montoApertura, setMontoApertura] = useState('');
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarCaja(); }, []);

  async function cargarCaja() {
    try {
      const cajaHoy = await obtenerCajaDelDia();
      setCaja(cajaHoy || null);
      const ventas = await obtenerVentasDelDia();
      const gastos = await obtenerGastosDelDia();
      setTotalVentas(ventas.reduce((sum, v) => sum + v.total, 0));
      setTotalGastos(gastos.reduce((sum, g) => sum + g.monto, 0));
    } catch (error) { console.error('Error al cargar caja:', error);
    } finally { setLoading(false); }
  }

  async function handleAbrirCaja() {
    const monto = parseFloat(montoApertura);
    if (isNaN(monto) || monto < 0) { alert('Ingresa un monto válido'); return; }
    try { await abrirCaja(monto); setMontoApertura(''); await cargarCaja(); }
    catch (error) { alert(error.message); }
  }

  async function handleCerrarCaja() {
    try { await cerrarCaja(totalVentas, totalGastos); await cargarCaja(); }
    catch (error) { alert(error.message); }
  }

  if (loading) return <div className="empty-state"><div className="status-dot" style={{ width: 10, height: 10, background: 'var(--color-accent)' }} /><p>Cargando...</p></div>;

  const balance = totalVentas - totalGastos;
  const cajaFinal = caja ? caja.apertura + balance : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Caja Diaria</h1>
        <span className={`badge ${caja && !caja.cierre ? 'badge-success' : 'badge-warning'}`}>
          {caja && !caja.cierre ? '● Abierta' : '● Cerrada'}
        </span>
      </div>

      {!caja && (
        <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '2rem 1.25rem' }}>
          <DoorOpen size={44} style={{ margin: '0 auto 1rem', opacity: 0.2, color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Abrir Caja</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Ingresa el monto con el que inicias el día
          </p>
          <div style={{ maxWidth: '220px', margin: '0 auto 1.25rem' }}>
            <input type="number" className="input" placeholder="0.00" step="0.01" value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
              style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.02em' }} />
          </div>
          <button className="btn btn-primary btn-block" onClick={handleAbrirCaja}>
            <DoorOpen size={15} /> Abrir Caja
          </button>
        </div>
      )}

      {caja && (
        <div className="stagger">
          <div className="stat-card green" style={{ marginBottom: '0.65rem', textAlign: 'center', padding: '1.25rem' }}>
            <Wallet size={24} style={{ color: 'var(--color-accent)', margin: '0 auto 0.3rem', opacity: 0.6 }} />
            <div className="stat-label" style={{ justifyContent: 'center' }}>Apertura</div>
            <div className="stat-value">{formatMoneda(caja.apertura)}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
            <div className="stat-card green">
              <div className="stat-label"><TrendingUp size={12} color="var(--color-success)" /> Ventas</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>{formatMoneda(totalVentas)}</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label"><TrendingDown size={12} color="var(--color-danger)" /> Gastos</div>
              <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{formatMoneda(totalGastos)}</div>
            </div>
          </div>

          <div className="stat-card" style={{ marginBottom: '0.65rem' }}>
            <div className="stat-label"><ArrowRightLeft size={12} color="var(--color-blue)" /> Balance del día</div>
            <div className="stat-value" style={{ color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatMoneda(balance)}</div>
          </div>

          <div className="stat-card green" style={{ textAlign: 'center', marginBottom: '1rem', padding: '1.25rem', borderColor: 'rgba(5,150,105,0.1)' }}>
            <div className="stat-label" style={{ justifyContent: 'center' }}>Efectivo esperado</div>
            <div className="stat-value" style={{ color: 'var(--color-accent)', fontSize: '1.6rem' }}>{formatMoneda(cajaFinal)}</div>
          </div>

          {!caja.cierre ? (
            <button className="btn btn-danger btn-block" onClick={handleCerrarCaja}>
              <DoorClosed size={15} /> Cerrar Caja
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--color-warning-dim)', borderRadius: '0.75rem', color: 'var(--color-warning)', fontSize: '0.82rem', fontWeight: 600, border: '1px solid rgba(251,191,36,0.12)' }}>
              Caja cerrada a las {formatFechaHora(caja.cierre)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
