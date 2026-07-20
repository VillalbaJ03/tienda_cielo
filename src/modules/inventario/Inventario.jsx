import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle, Upload } from 'lucide-react';
import useInventario from '../../hooks/useInventario';
import { formatMoneda, CATEGORIAS_PRODUCTOS } from '../../utils/formatters';

export default function Inventario() {
  const {
    productos, productosInactivos, totalActivos, totalInactivos,
    productosBajoStock, filtroCategoria,
    busqueda, setBusqueda, setFiltroCategoria,
  } = useInventario();
  const [vista, setVista] = useState('activos');
  const lista = vista === 'activos' ? productos : productosInactivos;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventario</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/inventario/importar" className="btn btn-secondary btn-sm">
            <Upload size={14} /> Importar
          </Link>
          <Link to="/inventario/nuevo" className="btn btn-primary btn-sm">
            <Plus size={14} /> Nuevo
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <Search size={15} />
          <input
            type="text"
            className="input"
            placeholder="Buscar producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select
          className="input"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          style={{ width: 'auto', minWidth: '110px' }}
        >
          <option value="Todas">Todas</option>
          {CATEGORIAS_PRODUCTOS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="seg" style={{ marginBottom: '1rem' }}>
        <button className={`seg-item ${vista === 'activos' ? 'is-active' : ''}`} onClick={() => setVista('activos')}>
          Activos · {totalActivos}
        </button>
        <button className={`seg-item ${vista === 'inactivos' ? 'is-active' : ''}`} onClick={() => setVista('inactivos')}>
          Inactivos · {totalInactivos}
        </button>
      </div>

      {vista === 'activos' && productosBajoStock.length > 0 && (
        <div className="notice notice-warning" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          {productosBajoStock.length} producto{productosBajoStock.length !== 1 ? 's' : ''} con stock bajo
        </div>
      )}

      {lista.length === 0 ? (
        <div className="empty-state">
          <Package size={32} strokeWidth={1.5} />
          <p>{vista === 'activos' ? 'No hay productos registrados' : 'No hay productos inactivos'}</p>
          {vista === 'activos' && (
            <Link to="/inventario/nuevo" className="btn btn-primary btn-sm">Agregar producto</Link>
          )}
        </div>
      ) : (
        <div className="card">
          {lista.map((p) => {
            const inactivo = p.activo === false;
            const sinStock = p.stock === 0;
            const esBajoStock = p.stock <= p.stock_minimo;
            return (
              <Link key={p.id} to={`/inventario/editar/${p.id}`} className="list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title">{p.nombre}</div>
                  <div className="row-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {p.categoria && <span className="badge badge-neutral">{p.categoria}</span>}
                    {p.codigo && <span>{p.codigo}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="row-amount">{formatMoneda(p.precio_venta)}</div>
                  <div className="row-meta num">Costo: {formatMoneda(p.precio_compra)}</div>
                </div>
                <span className={`badge num ${inactivo ? 'badge-neutral' : sinStock ? 'badge-danger' : esBajoStock ? 'badge-warning' : 'badge-neutral'}`}
                  style={{ minWidth: '2.4rem', justifyContent: 'center' }}>
                  {inactivo ? 'Inactivo' : p.stock}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: '0.875rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-ink-3)' }}>
        {lista.length} producto{lista.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
