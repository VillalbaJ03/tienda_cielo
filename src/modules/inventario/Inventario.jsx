import { Link } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import useInventario from '../../hooks/useInventario';
import { formatMoneda, CATEGORIAS_PRODUCTOS } from '../../utils/formatters';

export default function Inventario() {
  const {
    productos, productosBajoStock, filtroCategoria,
    busqueda, setBusqueda, setFiltroCategoria,
  } = useInventario();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventario</h1>
        <Link to="/inventario/nuevo" className="btn btn-primary btn-sm">
          <Plus size={13} /> Nuevo
        </Link>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ paddingLeft: '2.3rem' }}
          />
        </div>
        <select
          className="input"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          style={{ width: 'auto', minWidth: '100px' }}
        >
          <option value="Todas">Todas</option>
          {CATEGORIAS_PRODUCTOS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {productosBajoStock.length > 0 && (
        <div className="toast-success" style={{ marginBottom: '1rem', background: 'var(--color-warning-dim)', borderColor: 'rgba(251,191,36,0.15)', color: 'var(--color-warning)' }}>
          <AlertTriangle size={14} />
          {productosBajoStock.length} producto{productosBajoStock.length !== 1 ? 's' : ''} con stock bajo
        </div>
      )}

      {productos.length === 0 ? (
        <div className="empty-state">
          <Package size={44} />
          <p>No hay productos registrados</p>
          <Link to="/inventario/nuevo" className="btn btn-primary btn-sm">Agregar producto</Link>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {productos.map((p) => {
            const esBajoStock = p.stock <= p.stock_minimo;
            const sinStock = p.stock === 0;
            return (
              <Link key={p.id} to={`/inventario/editar/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderColor: sinStock ? 'rgba(248,113,113,0.12)' : esBajoStock ? 'rgba(251,191,36,0.12)' : undefined,
                  padding: '0.8rem 1rem',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{p.nombre}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {p.categoria && <span className="badge badge-blue">{p.categoria}</span>}
                      {p.codigo && <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{p.codigo}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-accent)' }}>{formatMoneda(p.precio_venta)}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Costo: {formatMoneda(p.precio_compra)}</div>
                    </div>
                    <span className={`badge ${sinStock ? 'badge-danger' : esBajoStock ? 'badge-warning' : 'badge-success'}`}>
                      <Package size={9} /> {p.stock}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
        {productos.length} producto{productos.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
