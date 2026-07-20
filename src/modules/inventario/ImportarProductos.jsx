import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { obtenerTodosProductos, agregarProducto, actualizarProducto } from '../../db/database';
import { CATEGORIAS_PRODUCTOS } from '../../utils/formatters';
import { toast } from '../../ui/dialogos';

const COLUMNAS = ['nombre', 'codigo', 'categoria', 'precio_compra', 'precio_venta', 'stock', 'stock_minimo'];

function normalizarCabecera(texto) {
  return texto.replace(/^\uFEFF/, '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}

// Parser CSV pequeño: comillas dobles y delimitador ; o , (autodetectado)
function parseCSV(texto) {
  const primeraLinea = texto.slice(0, texto.indexOf('\n') === -1 ? texto.length : texto.indexOf('\n'));
  const delim = (primeraLinea.match(/;/g) || []).length >= (primeraLinea.match(/,/g) || []).length ? ';' : ',';

  const filas = [];
  let fila = [];
  let campo = '';
  let enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (enComillas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else enComillas = false;
      } else campo += ch;
    } else if (ch === '"') {
      enComillas = true;
    } else if (ch === delim) {
      fila.push(campo); campo = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      if (fila.some((c) => c.trim() !== '')) filas.push(fila);
      fila = [];
    } else campo += ch;
  }
  fila.push(campo);
  if (fila.some((c) => c.trim() !== '')) filas.push(fila);
  return filas;
}

function descargarPlantilla() {
  const contenido = '\uFEFF' + [
    COLUMNAS.join(';'),
    'Coca Cola 500 ml;7861001234567;Bebidas;0.45;0.75;24;5',
    'Arroz 1 lb;;Granos;0.40;0.60;50;10',
  ].join('\r\n');
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-productos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportarProductos() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [filas, setFilas] = useState(null); // [{datos, accion: 'crear'|'actualizar'|'error', motivo?, idExistente?}]
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [importando, setImportando] = useState(false);

  async function handleArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setNombreArchivo(archivo.name);
    try {
      const texto = await archivo.text();
      const tabla = parseCSV(texto);
      if (tabla.length < 2) { toast('El archivo no tiene filas de datos', 'error'); return; }

      const cabeceras = tabla[0].map(normalizarCabecera);
      if (!cabeceras.includes('nombre')) {
        toast('El archivo debe tener una columna "nombre" (usa la plantilla)', 'error');
        return;
      }

      const existentes = await obtenerTodosProductos();
      const porCodigo = new Map(existentes.filter((p) => p.codigo).map((p) => [String(p.codigo).trim(), p]));
      const porNombre = new Map(existentes.map((p) => [(p.nombre || '').trim().toLowerCase(), p]));

      const resultado = tabla.slice(1).map((celdas, idx) => {
        const datos = {};
        cabeceras.forEach((col, i) => { if (COLUMNAS.includes(col)) datos[col] = (celdas[i] || '').trim(); });

        const nombre = datos.nombre || '';
        const precioVenta = parseFloat(String(datos.precio_venta).replace(',', '.'));
        if (!nombre) return { linea: idx + 2, datos, accion: 'error', motivo: 'Falta el nombre' };
        if (isNaN(precioVenta) || precioVenta <= 0) return { linea: idx + 2, datos, accion: 'error', motivo: 'Precio de venta inválido' };

        const limpio = {
          nombre,
          codigo: datos.codigo || '',
          categoria: CATEGORIAS_PRODUCTOS.includes(datos.categoria) ? datos.categoria : 'Otros',
          precio_compra: parseFloat(String(datos.precio_compra || '0').replace(',', '.')) || 0,
          precio_venta: precioVenta,
          stock: parseInt(datos.stock) || 0,
          stock_minimo: parseInt(datos.stock_minimo) || 5,
        };

        const existente = (limpio.codigo && porCodigo.get(limpio.codigo))
          || porNombre.get(nombre.toLowerCase());
        if (existente) return { linea: idx + 2, datos: limpio, accion: 'actualizar', idExistente: existente.id };
        return { linea: idx + 2, datos: limpio, accion: 'crear' };
      });

      setFilas(resultado);
    } catch (error) {
      console.error('Error al leer el archivo:', error);
      toast('No se pudo leer el archivo', 'error');
    } finally {
      e.target.value = '';
    }
  }

  async function handleImportar() {
    if (!filas) return;
    setImportando(true);
    try {
      let creados = 0;
      let actualizados = 0;
      for (const f of filas) {
        if (f.accion === 'crear') { await agregarProducto(f.datos); creados++; }
        else if (f.accion === 'actualizar') { await actualizarProducto(f.idExistente, f.datos); actualizados++; }
      }
      toast(`Importación lista: ${creados} nuevos, ${actualizados} actualizados`);
      navigate('/inventario');
    } catch (error) {
      console.error('Error al importar:', error);
      toast('Error durante la importación', 'error');
    } finally {
      setImportando(false);
    }
  }

  const nuevos = filas?.filter((f) => f.accion === 'crear').length || 0;
  const aActualizar = filas?.filter((f) => f.accion === 'actualizar').length || 0;
  const conError = filas?.filter((f) => f.accion === 'error').length || 0;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to="/inventario" className="icon-btn" aria-label="Volver">
            <ArrowLeft size={19} />
          </Link>
          <h1 className="page-title">Importar productos</h1>
        </div>
      </div>

      <div className="card card-pad section">
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-2)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          Llena la plantilla en Excel y guárdala como CSV. Si un producto ya existe
          (mismo código o mismo nombre), se actualizan sus precios y stock en lugar de duplicarlo.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={descargarPlantilla}>
            <Download size={15} /> Descargar plantilla
          </button>
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
            <Upload size={15} /> Elegir archivo CSV
          </button>
          <input ref={inputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleArchivo} />
        </div>
        {nombreArchivo && (
          <p className="form-hint" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileSpreadsheet size={13} /> {nombreArchivo}
          </p>
        )}
      </div>

      {filas && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div className="stat-tile">
              <div className="stat-label">Nuevos</div>
              <div className="stat-value">{nuevos}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">A actualizar</div>
              <div className="stat-value">{aActualizar}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Con errores</div>
              <div className="stat-value" style={conError > 0 ? { color: 'var(--color-danger)' } : undefined}>{conError}</div>
            </div>
          </div>

          <div className="card section">
            {filas.map((f) => (
              <div key={f.linea} className="list-row" style={{ padding: '0.55rem 1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title" style={{ fontWeight: 450 }}>
                    {f.datos.nombre || <span style={{ color: 'var(--color-ink-4)' }}>(sin nombre)</span>}
                  </div>
                  <div className="row-meta">
                    {f.accion === 'error'
                      ? `Línea ${f.linea}: ${f.motivo}`
                      : `${f.datos.categoria} · Venta ${f.datos.precio_venta} · Stock ${f.datos.stock}`}
                  </div>
                </div>
                <span className={`badge ${f.accion === 'crear' ? 'badge-success' : f.accion === 'actualizar' ? 'badge-warning' : 'badge-danger'}`}>
                  {f.accion === 'crear' ? 'Nuevo' : f.accion === 'actualizar' ? 'Actualizar' : 'Error'}
                </span>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={handleImportar}
            disabled={importando || (nuevos + aActualizar === 0)}
          >
            {importando
              ? 'Importando...'
              : `Importar ${nuevos + aActualizar} producto${nuevos + aActualizar !== 1 ? 's' : ''}`}
          </button>
        </>
      )}
    </div>
  );
}
