import { useState, useEffect } from 'react';
import { Receipt, Plus, X } from 'lucide-react';
import { agregarGasto, obtenerGastosDelDia, obtenerGastosDelMes } from '../../db/database';
import { formatMoneda, formatFechaHora, parseNumero, CATEGORIAS_GASTOS } from '../../utils/formatters';
import { toast } from '../../ui/dialogos';

export default function Gastos() {
  const [gastosHoy, setGastosHoy] = useState([]);
  const [gastosMes, setGastosMes] = useState([]);
  const [vista, setVista] = useState('hoy');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoria: 'Otros', descripcion: '', monto: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarGastos(); }, []);

  async function cargarGastos() {
    try {
      const hoy = await obtenerGastosDelDia(); setGastosHoy(hoy.reverse());
      const ahora = new Date();
      const mes = await obtenerGastosDelMes(ahora.getFullYear(), ahora.getMonth() + 1); setGastosMes(mes.reverse());
    } catch (error) { console.error('Error al cargar gastos:', error); }
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!(parseNumero(form.monto) > 0) || !form.descripcion) { toast('La descripción y el monto son obligatorios', 'error'); return; }
    setGuardando(true);
    try {
      await agregarGasto({ categoria: form.categoria, descripcion: form.descripcion, monto: parseNumero(form.monto) });
      setForm({ categoria: 'Otros', descripcion: '', monto: '' }); setShowForm(false);
      toast('Gasto registrado');
      await cargarGastos();
    } catch { toast('Error al registrar gasto', 'error');
    } finally { setGuardando(false); }
  }

  const gastosActivos = vista === 'hoy' ? gastosHoy : gastosMes;
  const totalActivo = gastosActivos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gastos</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Nuevo
        </button>
      </div>

      <div className="seg" style={{ marginBottom: '1rem' }}>
        <button className={`seg-item ${vista === 'hoy' ? 'is-active' : ''}`} onClick={() => setVista('hoy')}>Hoy</button>
        <button className={`seg-item ${vista === 'mes' ? 'is-active' : ''}`} onClick={() => setVista('mes')}>Este mes</button>
      </div>

      <div className="stat-tile section">
        <div className="stat-label">
          Total {vista === 'hoy' ? 'de hoy' : 'del mes'} · {gastosActivos.length} gasto{gastosActivos.length !== 1 ? 's' : ''}
        </div>
        <div className="stat-hero">{formatMoneda(totalActivo)}</div>
      </div>

      {gastosActivos.length === 0 ? (
        <div className="empty-state">
          <Receipt size={32} strokeWidth={1.5} />
          <p>No hay gastos {vista === 'hoy' ? 'hoy' : 'este mes'}</p>
        </div>
      ) : (
        <div className="card">
          {gastosActivos.map((g) => (
            <div key={g.id} className="list-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row-title">{g.descripcion}</div>
                <div className="row-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-neutral">{g.categoria}</span>
                  {formatFechaHora(g.fecha)}
                </div>
              </div>
              <div className="row-amount">−{formatMoneda(g.monto)}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo gasto</h2>
              <button className="icon-btn" onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleGuardar}>
              <div className="field">
                <label className="label">Categoría</label>
                <select className="input" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS_GASTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Descripción *</label>
                <input className="input" placeholder="Ej: Pago de luz" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} required />
              </div>
              <div className="field">
                <label className="label">Monto ($) *</label>
                <input
                  type="text" inputMode="decimal"
                  className="input input-amount" placeholder="0,00"
                  value={form.monto}
                  onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={guardando} style={{ marginTop: '0.5rem' }}>
                {guardando ? 'Guardando...' : 'Registrar gasto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
