import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  Zap,
  Cloud,
  Users,
  Wallet,
  Receipt,
  Clock,
} from 'lucide-react';
import { obtenerVentasDelDia, obtenerGastosDelDia, obtenerProductosBajoStock } from '../../db/database';
import { formatMoneda, formatFechaHora } from '../../utils/formatters';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

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
      {/* ── Brand Header ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #059669, #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(5,150,105,0.2)',
          }}>
            <Cloud size={17} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Tienda Cielo
            </h1>
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          {getSaludo()} · {fecha}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon green"><ArrowUpCircle size={18} /></div>
          <div className="stat-label">Ventas hoy</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{formatMoneda(stats.totalVentas)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Zap size={18} /></div>
          <div className="stat-label">Transacciones</div>
          <div className="stat-value">{stats.numTransacciones}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><ArrowDownCircle size={18} /></div>
          <div className="stat-label">Gastos hoy</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{formatMoneda(stats.totalGastos)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={18} /></div>
          <div className="stat-label">Balance</div>
          <div className="stat-value" style={{ color: stats.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {formatMoneda(stats.balance)}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="section-header">
          <h2 className="section-title">Acceso rápido</h2>
        </div>
        <div className="quick-actions">
          <Link to="/ventas" className="quick-action">
            <div className="quick-action-icon" style={{ background: '#ecfdf5', color: '#059669' }}><ShoppingCart size={20} /></div>
            <span>Vender</span>
          </Link>
          <Link to="/inventario/nuevo" className="quick-action">
            <div className="quick-action-icon" style={{ background: '#eef2ff', color: '#6366f1' }}><Package size={20} /></div>
            <span>Producto</span>
          </Link>
          <Link to="/gastos" className="quick-action">
            <div className="quick-action-icon" style={{ background: '#fff7ed', color: '#f97316' }}><Receipt size={20} /></div>
            <span>Gasto</span>
          </Link>
          <Link to="/caja" className="quick-action">
            <div className="quick-action-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><Wallet size={20} /></div>
            <span>Caja</span>
          </Link>
        </div>
      </div>

      {/* ── Low Stock Alert ── */}
      {productosBajoStock.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="card" style={{ borderColor: '#fde68a', background: '#fffbeb', padding: '0.75rem 0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <AlertTriangle size={15} color="#b45309" />
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400e' }}>
                {productosBajoStock.length} producto{productosBajoStock.length !== 1 ? 's' : ''} con stock bajo
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {productosBajoStock.map((p) => (
                <span key={p.id} className="badge" style={{
                  background: p.stock === 0 ? 'var(--color-danger-dim)' : '#fef3c7',
                  color: p.stock === 0 ? 'var(--color-danger)' : '#92400e',
                  fontSize: '0.68rem',
                }}>
                  {p.nombre} ({p.stock})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Sales ── */}
      <div>
        <div className="section-header">
          <h2 className="section-title"><TrendingUp size={14} /> Últimas ventas</h2>
          <Link to="/historial-ventas" className="section-link">Ver todo <ArrowRight size={12} /></Link>
        </div>

        {ultimasVentas.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <ShoppingCart size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.15, color: 'var(--color-text-muted)' }} />
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>No hay ventas hoy</p>
            <Link to="/ventas" className="btn btn-primary btn-sm">
              <ShoppingCart size={13} /> Ir al Punto de Venta
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {ultimasVentas.map((v, i) => (
              <div key={v.id} className="list-item" style={{ padding: '0.7rem 0.875rem' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '0.5rem', flexShrink: 0,
                  background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShoppingCart size={15} color="#059669" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Venta #{v.id}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={10} /> {formatFechaHora(v.fecha)}
                    <span className="badge badge-neutral" style={{ marginLeft: '0.15rem' }}>{v.metodo_pago}</span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.92rem' }}>
                  +{formatMoneda(v.total)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
