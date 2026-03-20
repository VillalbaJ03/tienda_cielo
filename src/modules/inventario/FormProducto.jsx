import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import useInventario from '../../hooks/useInventario';
import { obtenerProveedores } from '../../db/database';
import db from '../../db/database';
import { CATEGORIAS_PRODUCTOS } from '../../utils/formatters';

const camposIniciales = {
  nombre: '', codigo: '', precio_compra: '', precio_venta: '',
  stock: '', stock_minimo: '5', categoria: 'Otros', proveedor_id: '',
};

export default function FormProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { guardarProducto, desactivarProducto } = useInventario();
  const [form, setForm] = useState(camposIniciales);
  const [proveedores, setProveedores] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const esEdicion = !!id;

  useEffect(() => { cargarDatos(); }, [id]);

  async function cargarDatos() {
    try {
      const provs = await obtenerProveedores();
      setProveedores(provs);
      if (id) {
        const producto = await db.productos.get(parseInt(id));
        if (producto) {
          setForm({
            nombre: producto.nombre || '', codigo: producto.codigo || '',
            precio_compra: producto.precio_compra?.toString() || '',
            precio_venta: producto.precio_venta?.toString() || '',
            stock: producto.stock?.toString() || '', stock_minimo: producto.stock_minimo?.toString() || '5',
            categoria: producto.categoria || 'Otros', proveedor_id: producto.proveedor_id?.toString() || '',
          });
        }
      }
    } catch (error) { console.error('Error al cargar datos:', error); }
  }

  function handleChange(e) { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || !form.precio_venta) { alert('El nombre y precio de venta son obligatorios'); return; }
    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre, codigo: form.codigo,
        precio_compra: parseFloat(form.precio_compra) || 0, precio_venta: parseFloat(form.precio_venta) || 0,
        stock: parseInt(form.stock) || 0, stock_minimo: parseInt(form.stock_minimo) || 5,
        categoria: form.categoria, proveedor_id: form.proveedor_id ? parseInt(form.proveedor_id) : null,
      };
      const ok = await guardarProducto(datos, id ? parseInt(id) : null);
      if (ok) navigate('/inventario');
    } catch (error) { alert('Error al guardar el producto');
    } finally { setGuardando(false); }
  }

  async function handleEliminar() {
    if (!confirm('¿Deseas desactivar este producto?')) return;
    await desactivarProducto(parseInt(id));
    navigate('/inventario');
  }

  const ganancia = form.precio_compra && form.precio_venta
    ? (parseFloat(form.precio_venta) - parseFloat(form.precio_compra))
    : null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/inventario" className="btn btn-ghost" style={{ padding: '0.3rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label className="label">Nombre *</label>
            <input className="input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Coca Cola 500ml" required />
          </div>
          <div>
            <label className="label">Código / Barcode</label>
            <input className="input" name="codigo" value={form.codigo} onChange={handleChange} placeholder="Ej: 7861234567890" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div>
              <label className="label">Precio compra ($)</label>
              <input type="number" step="0.01" className="input" name="precio_compra" value={form.precio_compra} onChange={handleChange} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Precio venta ($) *</label>
              <input type="number" step="0.01" className="input" name="precio_venta" value={form.precio_venta} onChange={handleChange} placeholder="0.00" required />
            </div>
          </div>

          {ganancia !== null && ganancia !== 0 && (
            <div style={{
              background: ganancia > 0 ? 'var(--color-success-dim)' : 'var(--color-danger-dim)',
              borderRadius: '0.6rem', padding: '0.5rem 0.75rem', fontSize: '0.78rem',
              color: ganancia > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600,
              border: `1px solid ${ganancia > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'}`,
            }}>
              Ganancia: ${ganancia.toFixed(2)}/ud · {((ganancia / parseFloat(form.precio_compra)) * 100).toFixed(0)}%
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div>
              <label className="label">Stock actual</label>
              <input type="number" className="input" name="stock" value={form.stock} onChange={handleChange} placeholder="0" />
            </div>
            <div>
              <label className="label">Stock mínimo</label>
              <input type="number" className="input" name="stock_minimo" value={form.stock_minimo} onChange={handleChange} placeholder="5" />
            </div>
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="input" name="categoria" value={form.categoria} onChange={handleChange}>
              {CATEGORIAS_PRODUCTOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Proveedor</label>
            <select className="input" name="proveedor_id" value={form.proveedor_id} onChange={handleChange}>
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', marginTop: '1.5rem' }}>
          {esEdicion && (
            <button type="button" className="btn btn-danger btn-sm" onClick={handleEliminar}>
              <Trash2 size={14} />
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={guardando}>
            <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
