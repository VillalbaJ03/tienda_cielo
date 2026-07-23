import { useState, useEffect } from 'react';
import { DoorOpen, DoorClosed } from 'lucide-react';
import { abrirCaja, cerrarCaja, obtenerCajaDelDia, obtenerVentasDelDia, obtenerGastosDelDia } from '../../db/database';
import { formatMoneda, formatFechaHora, parseNumero } from '../../utils/formatters';
import { toast, confirmar } from '../../ui/dialogos';

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
    const monto = parseNumero(montoApertura);
    if (isNaN(monto) || monto < 0) { toast('Ingresa un monto válido', 'error'); return; }
    try { await abrirCaja(monto); setMontoApertura(''); toast('Caja abierta'); await cargarCaja(); }
    catch (error) { toast(error.message, 'error'); }
  }

  async function handleCerrarCaja() {
    const ok = await confirmar({
      titulo: '¿Cerrar la caja del día?',
      mensaje: 'Se registrará el cierre con los totales actuales de ventas y gastos.',
      textoConfirmar: 'Cerrar caja',
      peligro: true,
    });
    if (!ok) return;
    try { await cerrarCaja(totalVentas, totalGastos); toast('Caja cerrada'); await cargarCaja(); }
    catch (error) { toast(error.message, 'error'); }
  }

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  const balance = totalVentas - totalGastos;
  const cajaFinal = caja ? caja.apertura + balance : 0;

  const filas = caja ? [
    { label: 'Apertura', texto: formatMoneda(caja.apertura) },
    { label: 'Ventas del día', texto: formatMoneda(totalVentas) },
    { label: 'Gastos del día', texto: `−${formatMoneda(totalGastos)}` },
    { label: 'Balance', texto: formatMoneda(balance), color: balance < 0 ? 'var(--color-danger)' : 'var(--color-positive)' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Caja diaria</h1>
        <span className={`badge ${caja && !caja.cierre ? 'badge-success' : 'badge-neutral'}`}>
          {caja ? (caja.cierre ? 'Cerrada' : 'Abierta') : 'Sin abrir'}
        </span>
      </div>

      {!caja && (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '2rem 1.25rem' }}>
          <DoorOpen size={30} strokeWidth={1.5} style={{ margin: '0 auto 0.75rem', color: 'var(--color-ink-4)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Abrir caja</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-3)', marginBottom: '1.25rem' }}>
            Ingresa el monto con el que inicias el día
          </p>
          <div style={{ maxWidth: '220px', margin: '0 auto 1rem' }}>
            <input
              type="text" inputMode="decimal"
              className="input input-amount" placeholder="0,00"
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={handleAbrirCaja}>
            Abrir caja
          </button>
        </div>
      )}

      {caja && (
        <>
          <div className="card section">
            {filas.map((f) => (
              <div key={f.label} className="list-row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-2)' }}>{f.label}</span>
                <span className="row-amount" style={f.color ? { color: f.color } : undefined}>
                  {f.texto}
                </span>
              </div>
            ))}
            <div className="list-row" style={{ justifyContent: 'space-between', background: '#fafafa', borderRadius: '0 0 12px 12px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Efectivo esperado</span>
              <span className="stat-value" style={{ fontSize: '1.25rem' }}>{formatMoneda(cajaFinal)}</span>
            </div>
          </div>

          {!caja.cierre ? (
            <button className="btn btn-danger btn-block" onClick={handleCerrarCaja}>
              <DoorClosed size={15} /> Cerrar caja
            </button>
          ) : (
            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-ink-3)' }}>
              Caja cerrada a las {formatFechaHora(caja.cierre)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
