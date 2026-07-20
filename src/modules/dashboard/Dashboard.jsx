import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Package,
  Wallet,
  Receipt,
  Clock,
} from 'lucide-react';
import { obtenerVentasDelDia, obtenerGastosDelDia, obtenerProductosBajoStock } from '../../db/database';
import { formatMoneda, formatFechaHora } from '../../utils/formatters';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export default function Dashboard() {
  const [stats, setStats] = useState({ totalVentas: 0, numTransacciones: 0, totalGastos: 0, balance: 0 });
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      const ventas = await obtenerVentasDelDia();
      const gastos = await obtenerGastosDelDia();
      const bajoStock = await obtenerProductosBajoStock();
      const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
      const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
      setStats({ totalVentas, numTransacciones: ventas.length, totalGastos, balance: totalVentas - totalGastos });
      setUltimasVentas(ventas.slice(-5).reverse());
      setProductosBajoStock(bajoStock.slice(0, 5));
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally { setLoading(false); }
  }

  if (loading) {
    return <div className="empty-state"><p>Cargando...</p></div>;
  }

  const hoy = new Date();
  const fecha = `${DIAS[hoy.getDay()]}, ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Resumen</h1>
          <p className="page-subtitle">{fecha}</p>
        </div>
      </div>

      {/* KPI del día */}
      <div className="card section" style={{ padding: '1rem' }}>
        <div className="stat-label">Ventas de hoy</div>
        <div className="stat-hero">{formatMoneda(stats.totalVentas)}</div>

        <div className="divider" style={{ margin: '0.875rem 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <div className="stat-label">Transacciones</div>
            <div className="stat-value" style={{ fontSize: '1rem' }}>{stats.numTransacciones}</div>
          </div>
          <div>
            <div className="stat-label">Gastos</div>
            <div className="stat-value" style={{ fontSize: '1rem' }}>{formatMoneda(stats.totalGastos)}</div>
          </div>
          <div>
            <div className="stat-label">Balance</div>
            <div className="stat-value" style={{
              fontSize: '1rem',
              color: stats.balance < 0 ? 'var(--color-danger)' : 'var(--color-positive)',
            }}>
              {formatMoneda(stats.balance)}
            </div>
          </div>
        </div>
      </div>

      {/* Acceso rápido */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Acceso rápido</h2>
        </div>
        <div className="quick-actions">
          <Link to="/ventas" className="quick-action">
            <ShoppingCart size={20} strokeWidth={1.8} />
            <span>Vender</span>
          </Link>
          <Link to="/inventario/nuevo" className="quick-action">
            <Package size={20} strokeWidth={1.8} />
            <span>Producto</span>
          </Link>
          <Link to="/gastos" className="quick-action">
            <Receipt size={20} strokeWidth={1.8} />
            <span>Gasto</span>
          </Link>
          <Link to="/caja" className="quick-action">
            <Wallet size={20} strokeWidth={1.8} />
            <span>Caja</span>
          </Link>
        </div>
      </div>

      {/* Alerta de stock bajo */}
      {productosBajoStock.length > 0 && (
        <div className="section">
          <div className="card">
            <div className="list-row" style={{ paddingBottom: '0.5rem' }}>
              <AlertTriangle size={15} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-2)' }}>
                Stock bajo · {productosBajoStock.length} producto{productosBajoStock.length !== 1 ? 's' : ''}
              </span>
              <Link to="/inventario" className="section-link" style={{ marginLeft: 'auto' }}>
                Ver inventario
              </Link>
            </div>
            {productosBajoStock.map((p) => (
              <div key={p.id} className="list-row" style={{ padding: '0.55rem 1rem' }}>
                <span className="row-title" style={{ flex: 1, fontWeight: 450 }}>{p.nombre}</span>
                <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'} num`}>
                  {p.stock === 0 ? 'Agotado' : `${p.stock} uds.`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas ventas */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Últimas ventas</h2>
          <Link to="/historial-ventas" className="section-link">Ver todo <ArrowRight size={12} /></Link>
        </div>

        {ultimasVentas.length === 0 ? (
          <div className="card empty-state" style={{ padding: '2rem 1rem' }}>
            <ShoppingCart size={28} strokeWidth={1.5} />
            <p>No hay ventas hoy</p>
            <Link to="/ventas" className="btn btn-primary btn-sm">Ir al punto de venta</Link>
          </div>
        ) : (
          <div className="card">
            {ultimasVentas.map((v) => (
              <div key={v.id} className="list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title">Venta #{v.id}</div>
                  <div className="row-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={11} /> {formatFechaHora(v.fecha)}
                    <span className="badge badge-neutral">{v.metodo_pago}</span>
                  </div>
                </div>
                <div className="row-amount">{formatMoneda(v.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
