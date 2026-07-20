import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, ScanLine } from 'lucide-react';
import useInventario from '../../hooks/useInventario';
import { obtenerProveedores } from '../../db/database';
import db from '../../db/database';
import { CATEGORIAS_PRODUCTOS } from '../../utils/formatters';
import { toast, confirmar } from '../../ui/dialogos';
import EscanerBarras from '../../components/EscanerBarras';

const camposIniciales = {
  nombre: '', codigo: '', precio_compra: '', precio_venta: '',
  stock: '', stock_minimo: '5', categoria: 'Otros', proveedor_id: '',
};

export default function FormProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { guardarProducto, desactivarProducto, reactivarProducto } = useInventario();
  const [form, setForm] = useState(camposIniciales);
  const [proveedores, setProveedores] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [inactivo, setInactivo] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [busquedaFallida, setBusquedaFallida] = useState('');
  const esEdicion = !!id;

  const cargarDatos = useCallback(async () => {
    try {
      const provs = await obtenerProveedores();
      setProveedores(provs);
      if (id) {
        const producto = await db.productos.get(parseInt(id));
        if (producto) {
          setInactivo(producto.activo === false);
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
  }, [id]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  function handleChange(e) { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

  // Catálogos abiertos y gratuitos, en orden de probabilidad:
  // alimentos → productos generales (limpieza, etc.) → cuidado personal
  const CATALOGOS = [
    'https://world.openfoodfacts.org',
    'https://world.openproductsfacts.org',
    'https://world.openbeautyfacts.org',
  ];

  async function buscarEnCatalogos(codigo) {
    for (const base of CATALOGOS) {
      try {
        const res = await fetch(
          `${base}/api/v2/product/${encodeURIComponent(codigo)}.json?fields=product_name,product_name_es,brands,quantity`
        );
        if (!res.ok) continue;
        const data = await res.json();
        const p = data.status === 1 ? data.product : null;
        const nombre = p ? (p.product_name_es || p.product_name || '') : '';
        if (nombre) {
          const marca = (p.brands || '').split(',')[0].trim();
          const conMarca = marca && !nombre.toLowerCase().includes(marca.toLowerCase()) ? `${marca} ${nombre}` : nombre;
          return [conMarca, p.quantity].filter(Boolean).join(' ');
        }
      } catch { /* catálogo caído o sin conexión: probar el siguiente */ }
    }
    return null;
  }

  async function handleCodigoEscaneado(codigo) {
    setShowScanner(false);
    setForm((prev) => ({ ...prev, codigo }));
    setBusquedaFallida('');
    toast('Buscando en los catálogos...');
    const nombre = await buscarEnCatalogos(codigo);
    if (nombre) {
      setForm((prev) => (prev.nombre ? prev : { ...prev, nombre }));
      toast(`Encontrado: ${nombre}`);
    } else {
      setBusquedaFallida(codigo);
      toast('No está en los catálogos públicos: escribe el nombre o búscalo en Google', 'error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || !form.precio_venta) { toast('El nombre y el precio de venta son obligatorios', 'error'); return; }
    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre, codigo: form.codigo,
        precio_compra: parseFloat(form.precio_compra) || 0, precio_venta: parseFloat(form.precio_venta) || 0,
        stock: parseInt(form.stock) || 0, stock_minimo: parseInt(form.stock_minimo) || 5,
        categoria: form.categoria, proveedor_id: form.proveedor_id ? parseInt(form.proveedor_id) : null,
      };
      const ok = await guardarProducto(datos, id ? parseInt(id) : null);
      if (ok) {
        toast(esEdicion ? 'Producto actualizado' : 'Producto registrado');
        navigate('/inventario');
      } else {
        toast('Error al guardar el producto', 'error');
      }
    } catch { toast('Error al guardar el producto', 'error');
    } finally { setGuardando(false); }
  }

  async function handleEliminar() {
    const ok = await confirmar({
      titulo: `¿Desactivar ${form.nombre || 'este producto'}?`,
      mensaje: 'Dejará de aparecer en ventas y en el inventario activo. Puedes reactivarlo cuando quieras.',
      textoConfirmar: 'Desactivar',
      peligro: true,
    });
    if (!ok) return;
    await desactivarProducto(parseInt(id));
    toast('Producto desactivado');
    navigate('/inventario');
  }

  async function handleReactivar() {
    await reactivarProducto(parseInt(id));
    toast('Producto reactivado');
    navigate('/inventario');
  }

  const ganancia = form.precio_compra && form.precio_venta
    ? (parseFloat(form.precio_venta) - parseFloat(form.precio_compra))
    : null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to="/inventario" className="icon-btn" aria-label="Volver">
            <ArrowLeft size={19} />
          </Link>
          <h1 className="page-title">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card card-pad">
        <div className="field">
          <label className="label">Nombre *</label>
          <input className="input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Coca Cola 500 ml" required />
        </div>
        <div className="field">
          <label className="label">Código / barcode</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input num" name="codigo" value={form.codigo} onChange={handleChange} placeholder="Ej: 7861234567890" inputMode="numeric" />
            <button type="button" className="btn btn-secondary" onClick={() => setShowScanner(true)} aria-label="Escanear código" style={{ flexShrink: 0, padding: '0 0.75rem' }}>
              <ScanLine size={16} />
            </button>
          </div>
          {busquedaFallida ? (
            <p className="form-hint">
              No apareció en los catálogos públicos.{' '}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(busquedaFallida)}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--color-accent)', fontWeight: 500 }}
              >
                Buscar {busquedaFallida} en Google
              </a>{' '}
              y copia el nombre.
            </p>
          ) : (
            <p className="form-hint">Escanea el código y se autocompleta el nombre si está en los catálogos públicos.</p>
          )}
        </div>
        <div className="field field-row">
          <div>
            <label className="label">Precio compra ($)</label>
            <input type="number" step="0.01" inputMode="decimal" className="input num" name="precio_compra" value={form.precio_compra} onChange={handleChange} placeholder="0.00" />
          </div>
          <div>
            <label className="label">Precio venta ($) *</label>
            <input type="number" step="0.01" inputMode="decimal" className="input num" name="precio_venta" value={form.precio_venta} onChange={handleChange} placeholder="0.00" required />
          </div>
        </div>

        {ganancia !== null && ganancia !== 0 && (
          <p className="form-hint num" style={{
            marginTop: '-0.35rem', marginBottom: '0.875rem', fontWeight: 500,
            color: ganancia > 0 ? 'var(--color-positive)' : 'var(--color-danger)',
          }}>
            Ganancia: ${ganancia.toFixed(2)} por unidad
            {parseFloat(form.precio_compra) > 0 && ` · ${((ganancia / parseFloat(form.precio_compra)) * 100).toFixed(0)}%`}
          </p>
        )}

        <div className="field field-row">
          <div>
            <label className="label">Stock actual</label>
            <input type="number" inputMode="numeric" className="input num" name="stock" value={form.stock} onChange={handleChange} placeholder="0" />
          </div>
          <div>
            <label className="label">Stock mínimo</label>
            <input type="number" inputMode="numeric" className="input num" name="stock_minimo" value={form.stock_minimo} onChange={handleChange} placeholder="5" />
          </div>
        </div>
        <div className="field">
          <label className="label">Categoría</label>
          <select className="input" name="categoria" value={form.categoria} onChange={handleChange}>
            {CATEGORIAS_PRODUCTOS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Proveedor</label>
          <select className="input" name="proveedor_id" value={form.proveedor_id} onChange={handleChange}>
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        {inactivo && (
          <div className="notice notice-warning" style={{ marginTop: '1rem' }}>
            Este producto está inactivo: no aparece en ventas ni en el inventario activo.
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          {esEdicion && !inactivo && (
            <button type="button" className="btn btn-danger" onClick={handleEliminar} aria-label="Desactivar producto" style={{ flexShrink: 0, padding: '0 0.75rem' }}>
              <Trash2 size={15} />
            </button>
          )}
          {esEdicion && inactivo && (
            <button type="button" className="btn btn-secondary" onClick={handleReactivar} style={{ flexShrink: 0 }}>
              Reactivar
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>

      {showScanner && (
        <EscanerBarras
          onDetectado={handleCodigoEscaneado}
          onCerrar={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
