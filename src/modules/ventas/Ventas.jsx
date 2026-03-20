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
} from 'lucide-react';
import useVentas from '../../hooks/useVentas';
import useFiados from '../../hooks/useFiados';
import { formatMoneda, METODOS_PAGO } from '../../utils/formatters';

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
    } catch (error) {
      alert('Error al procesar la venta');
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
        <h1 className="page-title">Punto de Venta</h1>
        <Link to="/historial-ventas" className="btn btn-secondary btn-sm">
          <History size={13} /> Historial
        </Link>
      </div>

      {ventaExitosa && (
        <div className="toast-success" style={{ marginBottom: '0.75rem' }}>
          <Check size={16} /> ¡Venta registrada con éxito!
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', pointerEvents: 'none',
          }} />
          <input
            ref={inputRef}
            type="text"
            className="input"
            placeholder="Buscar producto por nombre o código..."
            value={busqueda}
            onChange={(e) => buscar(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        {resultados.length > 0 && (
          <div className="animate-fade-in" style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
            background: '#fff', border: '1px solid var(--color-border)', borderRadius: '0.625rem',
            maxHeight: '240px', overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
          }}>
            {resultados.map((p, i) => (
              <button key={p.id} onClick={() => agregarAlCarrito(p)} style={{
                width: '100%', padding: '0.6rem 0.875rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'transparent', border: 'none',
                borderBottom: i < resultados.length - 1 ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Stock: {p.stock} · {p.codigo || 'Sin código'}
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatMoneda(p.precio_venta)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      {carrito.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={40} />
          <p>Busca un producto para comenzar</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, marginBottom: '0.75rem' }}>
            {carrito.map((item, i) => (
              <div key={item.producto_id} className="list-item" style={{ padding: '0.6rem 0.875rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatMoneda(item.precio_unitario)} c/u</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.15rem' }}>
                  <button className="btn btn-ghost" style={{ padding: '0.2rem', borderRadius: '0.35rem' }}
                    onClick={() => actualizarCantidad(item.producto_id, item.cantidad - 1)}>
                    <Minus size={13} />
                  </button>
                  <span style={{ fontWeight: 700, minWidth: '22px', textAlign: 'center', fontSize: '0.88rem' }}>{item.cantidad}</span>
                  <button className="btn btn-ghost" style={{ padding: '0.2rem', borderRadius: '0.35rem' }}
                    onClick={() => actualizarCantidad(item.producto_id, item.cantidad + 1)}>
                    <Plus size={13} />
                  </button>
                </div>

                <span style={{ fontWeight: 700, minWidth: '55px', textAlign: 'right', fontSize: '0.88rem' }}>{formatMoneda(item.subtotal)}</span>

                <button onClick={() => quitarDelCarrito(item.producto_id)}
                  className="btn btn-ghost" style={{ padding: '0.2rem', color: 'var(--color-danger)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="card" style={{
            background: '#ecfdf5', borderColor: '#a7f3d0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46' }}>Total a cobrar</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>{formatMoneda(total)}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={limpiarCarrito} style={{ flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
              <button className="btn btn-primary btn-block" onClick={() => setShowPago(true)}>
                Cobrar {formatMoneda(total)}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPago && (
        <div className="modal-overlay" onClick={() => setShowPago(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Método de Pago</h2>
              <button className="btn btn-ghost" onClick={() => setShowPago(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
              {METODOS_PAGO.map((m) => (
                <button key={m.value}
                  className={`btn ${metodoPago === m.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setMetodoPago(m.value)} style={{ flex: 1 }}>
                  {iconoPago[m.value]} {m.label}
                </button>
              ))}
            </div>

            {metodoPago === 'efectivo' && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Monto recibido</label>
                <input type="number" className="input" placeholder="0.00" value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  style={{ fontSize: '1.2rem', fontWeight: 800, textAlign: 'center' }} />
                {montoPago && (
                  <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '1rem', fontWeight: 700,
                    color: vuelto >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    Vuelto: {formatMoneda(Math.max(0, vuelto))}
                  </div>
                )}
              </div>
            )}

            {metodoPago === 'fiado' && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Cliente</label>
                <select className="input" value={clienteFiado} onChange={(e) => setClienteFiado(e.target.value)}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            <div style={{
              textAlign: 'center', padding: '1rem', background: '#ecfdf5', borderRadius: '0.875rem',
              marginBottom: '1rem', border: '1px solid #a7f3d0',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669' }}>{formatMoneda(total)}</div>
            </div>

            <button className="btn btn-primary btn-block" onClick={handleCompletarVenta}
              disabled={loading || (metodoPago === 'fiado' && !clienteFiado)}
              style={{ padding: '0.75rem' }}>
              <Check size={16} /> {loading ? 'Procesando...' : 'Confirmar Venta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
