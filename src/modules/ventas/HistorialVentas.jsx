import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Clock } from 'lucide-react';
import useVentas from '../../hooks/useVentas';
import { formatMoneda, formatFechaHora } from '../../utils/formatters';

export default function HistorialVentas() {
  const { ventasHoy, cargarVentasHoy } = useVentas();

  useEffect(() => {
    cargarVentasHoy();
  }, [cargarVentasHoy]);

  const metodoIcon = { efectivo: '💵', transferencia: '💳', fiado: '📝' };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/ventas" className="btn btn-ghost" style={{ padding: '0.3rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">Ventas de Hoy</h1>
        </div>
      </div>

      {ventasHoy.length > 0 && (
        <div className="stat-card green" style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <div className="stat-label" style={{ justifyContent: 'center' }}>Total del día</div>
          <div className="stat-value" style={{ color: 'var(--color-success)', fontSize: '1.6rem' }}>
            {formatMoneda(ventasHoy.reduce((sum, v) => sum + v.total, 0))}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            {ventasHoy.length} venta{ventasHoy.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {ventasHoy.length === 0 ? (
        <div className="empty-state">
          <Clock size={44} />
          <p>No hay ventas registradas hoy</p>
          <Link to="/ventas" className="btn btn-primary btn-sm">Ir al Punto de Venta</Link>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ventasHoy.map((v) => (
            <div key={v.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Venta #{v.id}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                    <Clock size={10} /> {formatFechaHora(v.fecha)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1rem' }}>
                    {formatMoneda(v.total)}
                  </span>
                  <span className="badge badge-info">
                    {metodoIcon[v.metodo_pago]} {v.metodo_pago}
                  </span>
                </div>
              </div>
              {v.detalles && v.detalles.length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.4rem', marginTop: '0.3rem' }}>
                  {v.detalles.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '0.1rem 0' }}>
                      <span>{d.cantidad}x Producto #{d.producto_id}</span>
                      <span>{formatMoneda(d.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
