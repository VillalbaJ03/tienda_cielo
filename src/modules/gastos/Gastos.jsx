import { useState, useEffect } from 'react';
import { Receipt, Plus, Calendar, X, Save } from 'lucide-react';
import { agregarGasto, obtenerGastosDelDia, obtenerGastosDelMes } from '../../db/database';
import { formatMoneda, formatFechaHora, CATEGORIAS_GASTOS } from '../../utils/formatters';

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
    if (!form.monto || !form.descripcion) { alert('La descripción y el monto son obligatorios'); return; }
    setGuardando(true);
    try {
      await agregarGasto({ categoria: form.categoria, descripcion: form.descripcion, monto: parseFloat(form.monto) });
      setForm({ categoria: 'Otros', descripcion: '', monto: '' }); setShowForm(false); await cargarGastos();
    } catch (error) { alert('Error al registrar gasto');
    } finally { setGuardando(false); }
  }

  const gastosActivos = vista === 'hoy' ? gastosHoy : gastosMes;
  const totalActivo = gastosActivos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gastos</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={13} /> Nuevo
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <button className={`btn ${vista === 'hoy' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setVista('hoy')} style={{ flex: 1 }}>Hoy</button>
        <button className={`btn ${vista === 'mes' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setVista('mes')} style={{ flex: 1 }}>
          <Calendar size={13} /> Mes
        </button>
      </div>

      <div className="stat-card red" style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <div className="stat-label" style={{ justifyContent: 'center' }}>Total {vista === 'hoy' ? 'de hoy' : 'del mes'}</div>
        <div className="stat-value" style={{ color: 'var(--color-danger)', fontSize: '1.5rem' }}>{formatMoneda(totalActivo)}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
          {gastosActivos.length} gasto{gastosActivos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {gastosActivos.length === 0 ? (
        <div className="empty-state"><Receipt size={44} /><p>No hay gastos {vista === 'hoy' ? 'hoy' : 'este mes'}</p></div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {gastosActivos.map((g) => (
            <div key={g.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{g.descripcion}</div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.15rem' }}>
                  <span className="badge badge-blue">{g.categoria}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{formatFechaHora(g.fecha)}</span>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: '0.95rem' }}>-{formatMoneda(g.monto)}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Nuevo Gasto</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleGuardar}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
                    {CATEGORIAS_GASTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Descripción *</label>
                  <input className="input" placeholder="Ej: Pago de luz" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Monto ($) *</label>
                  <input type="number" step="0.01" className="input" placeholder="0.00" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                    style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center' }} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={guardando} style={{ marginTop: '1.25rem' }}>
                <Save size={15} /> {guardando ? 'Guardando...' : 'Registrar Gasto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
