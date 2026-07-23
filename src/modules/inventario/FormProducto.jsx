import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, ScanLine, Camera } from 'lucide-react';
import useInventario from '../../hooks/useInventario';
import { obtenerProveedores } from '../../db/database';
import db from '../../db/database';
import { CATEGORIAS_PRODUCTOS, parseNumero } from '../../utils/formatters';
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
  const [identificando, setIdentificando] = useState(false);
  const fotoRef = useRef(null);
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

  // Reduce la foto (máx. 1024 px, JPEG) antes de enviarla a la IA
  async function comprimirImagen(archivo, maxDim = 1024) {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }

  async function handleFoto(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) { toast('Configura Supabase para usar la identificación por foto', 'error'); return; }
    setIdentificando(true);
    try {
      const imagen = await comprimirImagen(archivo);
      const res = await fetch(`${supabaseUrl}/functions/v1/reconocer-producto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.nombre) {
        setForm((prev) => ({ ...prev, nombre: data.nombre }));
        toast(`Identificado: ${data.nombre}`);
      } else if (res.ok) {
        toast('No se distinguió ningún producto en la foto', 'error');
      } else {
        toast(data.error || 'La identificación por foto aún no está activa', 'error');
      }
    } catch {
      toast('No se pudo procesar la foto', 'error');
    } finally { setIdentificando(false); }
  }

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
    if (!form.nombre || !(parseNumero(form.precio_venta) > 0)) { toast('El nombre y el precio de venta son obligatorios', 'error'); return; }
    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre, codigo: form.codigo,
        precio_compra: parseNumero(form.precio_compra) || 0, precio_venta: parseNumero(form.precio_venta) || 0,
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
    ? (parseNumero(form.precio_venta) - parseNumero(form.precio_compra))
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Coca Cola 500 ml" required />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fotoRef.current?.click()}
              disabled={identificando}
              aria-label="Identificar por foto"
              title="Tomar foto del empaque e identificarlo con IA"
              style={{ flexShrink: 0, padding: '0 0.75rem' }}
            >
              <Camera size={16} />
            </button>
            <input ref={fotoRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFoto} />
          </div>
          {identificando && <p className="form-hint">Identificando el producto con IA...</p>}
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
            <input type="text" inputMode="decimal" className="input num" name="precio_compra" value={form.precio_compra} onChange={handleChange} placeholder="0,00" />
          </div>
          <div>
            <label className="label">Precio venta ($) *</label>
            <input type="text" inputMode="decimal" className="input num" name="precio_venta" value={form.precio_venta} onChange={handleChange} placeholder="0,00" required />
          </div>
        </div>

        {ganancia !== null && ganancia !== 0 && (
          <p className="form-hint num" style={{
            marginTop: '-0.35rem', marginBottom: '0.875rem', fontWeight: 500,
            color: ganancia > 0 ? 'var(--color-positive)' : 'var(--color-danger)',
          }}>
            Ganancia: ${ganancia.toFixed(2)} por unidad
            {parseNumero(form.precio_compra) > 0 && ` · ${((ganancia / parseNumero(form.precio_compra)) * 100).toFixed(0)}%`}
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
