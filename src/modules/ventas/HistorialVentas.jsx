import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import useVentas from '../../hooks/useVentas';
import { formatMoneda, formatFechaHora } from '../../utils/formatters';

export default function HistorialVentas() {
  const { ventasHoy, cargarVentasHoy } = useVentas();

  useEffect(() => {
    cargarVentasHoy();
  }, [cargarVentasHoy]);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to="/ventas" className="icon-btn" aria-label="Volver">
            <ArrowLeft size={19} />
          </Link>
          <h1 className="page-title">Ventas de hoy</h1>
        </div>
      </div>

      {ventasHoy.length > 0 && (
        <div className="stat-tile section">
          <div className="stat-label">Total del día · {ventasHoy.length} venta{ventasHoy.length !== 1 ? 's' : ''}</div>
          <div className="stat-hero">
            {formatMoneda(ventasHoy.reduce((sum, v) => sum + v.total, 0))}
          </div>
        </div>
      )}

      {ventasHoy.length === 0 ? (
        <div className="empty-state">
          <Clock size={32} strokeWidth={1.5} />
          <p>No hay ventas registradas hoy</p>
          <Link to="/ventas" className="btn btn-primary btn-sm">Ir al punto de venta</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ventasHoy.map((v) => (
            <div key={v.id} className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="row-title" style={{ fontWeight: 600 }}>Venta #{v.id}</div>
                  <div className="row-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={11} /> {formatFechaHora(v.fecha)}
                    <span className="badge badge-neutral">{v.metodo_pago}</span>
                  </div>
                </div>
                <span className="row-amount" style={{ fontSize: '0.9375rem' }}>{formatMoneda(v.total)}</span>
              </div>
              {v.detalles && v.detalles.length > 0 && (
                <>
                  <div className="divider" style={{ margin: '0.6rem 0 0.4rem' }} />
                  {v.detalles.map((d, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '0.75rem', color: 'var(--color-ink-3)', padding: '0.12rem 0',
                    }}>
                      <span>{d.cantidad} × Producto #{d.producto_id}</span>
                      <span className="num">{formatMoneda(d.subtotal)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
