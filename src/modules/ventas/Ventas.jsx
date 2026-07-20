import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Users,
  X,
  Check,
  History,
  ScanLine,
} from 'lucide-react';
import useVentas from '../../hooks/useVentas';
import useFiados from '../../hooks/useFiados';
import db from '../../db/database';
import { formatMoneda, METODOS_PAGO } from '../../utils/formatters';
import { toast } from '../../ui/dialogos';
import EscanerBarras from '../../components/EscanerBarras';

export default function Ventas() {
  const {
    carrito, busqueda, resultados, total, vuelto,
    montoPago, metodoPago, loading,
    buscar, agregarAlCarrito, quitarDelCarrito,
    actualizarCantidad, completarVenta,
    limpiarCarrito, setMontoPago, setMetodoPago,
  } = useVentas();

  const { clientes } = useFiados();
  const [showPago, setShowPago] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [clienteFiado, setClienteFiado] = useState('');
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  async function handleCompletarVenta() {
    try {
      await completarVenta(metodoPago, clienteFiado ? parseInt(clienteFiado) : null);
      setShowPago(false);
      setClienteFiado('');
      setVentaExitosa(true);
      setTimeout(() => setVentaExitosa(false), 2500);
    } catch {
      toast('Error al procesar la venta', 'error');
    }
  }

  async function handleCodigoEscaneado(codigo) {
    setShowScanner(false);
    try {
      const producto = await db.productos.where('codigo').equals(codigo).first();
      if (producto && producto.activo !== false) {
        agregarAlCarrito(producto);
        toast(`${producto.nombre} agregado`);
      } else {
        toast(`No hay ningún producto con el código ${codigo}`, 'error');
      }
    } catch {
      toast('Error al buscar el producto', 'error');
    }
  }

  const iconoPago = {
    efectivo: <Banknote size={14} />,
    transferencia: <CreditCard size={14} />,
    fiado: <Users size={14} />,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Punto de venta</h1>
        <Link to="/historial-ventas" className="btn btn-secondary btn-sm">
          <History size={14} /> Historial
        </Link>
      </div>

      {ventaExitosa && (
        <div className="notice notice-success animate-fade-in" style={{ marginBottom: '0.75rem' }}>
          <Check size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          Venta registrada con éxito
        </div>
      )}

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <Search size={15} />
            <input
              ref={inputRef}
              type="text"
              className="input"
              placeholder="Buscar producto por nombre o código"
              value={busqueda}
              onChange={(e) => buscar(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowScanner(true)}
            aria-label="Escanear código de barras"
            style={{ flexShrink: 0, padding: '0 0.75rem' }}
          >
            <ScanLine size={16} />
          </button>
        </div>

        {resultados.length > 0 && (
          <div className="search-results animate-fade-in">
            {resultados.map((p) => (
              <button key={p.id} className="search-result" onClick={() => agregarAlCarrito(p)}>
                <div style={{ minWidth: 0 }}>
                  <div className="row-title">{p.nombre}</div>
                  <div className="row-meta">Stock: {p.stock}{p.codigo ? ` · ${p.codigo}` : ''}</div>
                </div>
                <span className="row-amount">{formatMoneda(p.precio_venta)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carrito */}
      {carrito.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={32} strokeWidth={1.5} />
          <p>Busca un producto para comenzar</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '0.75rem' }}>
            {carrito.map((item) => (
              <div key={item.producto_id} className="list-row" style={{ padding: '0.65rem 0.875rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.nombre}
                  </div>
                  <div className="row-meta num">{formatMoneda(item.precio_unitario)} c/u</div>
                </div>

                <div className="stepper">
                  <button onClick={() => actualizarCantidad(item.producto_id, item.cantidad - 1)} aria-label="Restar">
                    <Minus size={13} />
                  </button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => actualizarCantidad(item.producto_id, item.cantidad + 1)} aria-label="Sumar">
                    <Plus size={13} />
                  </button>
                </div>

                <span className="row-amount" style={{ minWidth: '58px' }}>{formatMoneda(item.subtotal)}</span>

                <button
                  onClick={() => quitarDelCarrito(item.producto_id)}
                  className="icon-btn is-danger"
                  aria-label="Quitar del carrito"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-ink-3)' }}>Total a cobrar</span>
              <span className="stat-hero" style={{ fontSize: '1.5rem' }}>{formatMoneda(total)}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={limpiarCarrito} aria-label="Vaciar carrito" style={{ flexShrink: 0, padding: '0 0.75rem' }}>
                <Trash2 size={15} />
              </button>
              <button className="btn btn-primary btn-block" onClick={() => setShowPago(true)}>
                Cobrar
              </button>
            </div>
          </div>
        </>
      )}

      {showScanner && (
        <EscanerBarras
          onDetectado={handleCodigoEscaneado}
          onCerrar={() => setShowScanner(false)}
        />
      )}

      {/* Modal de pago */}
      {showPago && (
        <div className="modal-overlay" onClick={() => setShowPago(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Cobrar venta</h2>
              <button className="icon-btn" onClick={() => setShowPago(false)} aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>

            <div className="field">
              <label className="label">Método de pago</label>
              <div className="seg">
                {METODOS_PAGO.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`seg-item ${metodoPago === m.value ? 'is-active' : ''}`}
                    onClick={() => setMetodoPago(m.value)}
                  >
                    {iconoPago[m.value]} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div className="field">
                <label className="label">Monto recibido</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="input input-amount"
                  placeholder="0.00"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                />
                {montoPago && (
                  <p className="form-hint num" style={{
                    textAlign: 'center',
                    fontWeight: 600,
                    color: vuelto >= 0 ? 'var(--color-positive)' : 'var(--color-danger)',
                  }}>
                    Vuelto: {formatMoneda(Math.max(0, vuelto))}
                  </p>
                )}
              </div>
            )}

            {metodoPago === 'fiado' && (
              <div className="field">
                <label className="label">Cliente</label>
                <select className="input" value={clienteFiado} onChange={(e) => setClienteFiado(e.target.value)}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-ink-3)' }}>Total</span>
              <span className="stat-hero" style={{ fontSize: '1.5rem' }}>{formatMoneda(total)}</span>
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handleCompletarVenta}
              disabled={loading || (metodoPago === 'fiado' && !clienteFiado)}
            >
              {loading ? 'Procesando...' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
