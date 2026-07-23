import { useState, useEffect } from 'react';
import { Truck, Plus, X, Edit3, Trash2, Phone, Mail, RotateCcw } from 'lucide-react';
import { obtenerProveedoresTodos, agregarProveedor, actualizarProveedor, desactivarProveedor } from '../../db/database';
import { toast, confirmar } from '../../ui/dialogos';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [vista, setVista] = useState('activos');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', ruc: '', telefono: '', email: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarProveedores(); }, []);

  async function cargarProveedores() {
    try { setProveedores(await obtenerProveedoresTodos()); }
    catch (error) { console.error('Error al cargar proveedores:', error); }
  }

  const activos = proveedores.filter((p) => p.activo !== false);
  const inactivos = proveedores.filter((p) => p.activo === false);
  const lista = vista === 'activos' ? activos : inactivos;

  function abrirEdicion(p) {
    setEditando(p.id);
    setForm({ nombre: p.nombre, ruc: p.ruc || '', telefono: p.telefono || '', email: p.email || '' });
    setShowForm(true);
  }

  function abrirNuevo() { setEditando(null); setForm({ nombre: '', ruc: '', telefono: '', email: '' }); setShowForm(true); }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre) { toast('El nombre es obligatorio', 'error'); return; }
    setGuardando(true);
    try {
      if (editando) await actualizarProveedor(editando, form);
      else await agregarProveedor(form);
      setShowForm(false); setEditando(null); setForm({ nombre: '', ruc: '', telefono: '', email: '' });
      toast(editando ? 'Proveedor actualizado' : 'Proveedor registrado');
      await cargarProveedores();
    } catch { toast('Error al guardar proveedor', 'error');
    } finally { setGuardando(false); }
  }

  async function handleDesactivar(p) {
    const ok = await confirmar({
      titulo: `¿Desactivar a ${p.nombre}?`,
      mensaje: 'Dejará de aparecer en la lista de proveedores activos. Puedes reactivarlo cuando quieras.',
      textoConfirmar: 'Desactivar',
      peligro: true,
    });
    if (!ok) return;
    try { await desactivarProveedor(p.id); toast('Proveedor desactivado'); await cargarProveedores(); }
    catch { toast('Error al desactivar proveedor', 'error'); }
  }

  async function handleReactivar(p) {
    try { await actualizarProveedor(p.id, { activo: true }); toast('Proveedor reactivado'); await cargarProveedores(); }
    catch { toast('Error al reactivar proveedor', 'error'); }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Proveedores</h1>
        <button className="btn btn-primary btn-sm" onClick={abrirNuevo}><Plus size={14} /> Nuevo</button>
      </div>

      <div className="seg" style={{ marginBottom: '1rem' }}>
        <button className={`seg-item ${vista === 'activos' ? 'is-active' : ''}`} onClick={() => setVista('activos')}>
          Activos · {activos.length}
        </button>
        <button className={`seg-item ${vista === 'inactivos' ? 'is-active' : ''}`} onClick={() => setVista('inactivos')}>
          Inactivos · {inactivos.length}
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="empty-state">
          <Truck size={32} strokeWidth={1.5} />
          <p>{vista === 'activos' ? 'No hay proveedores registrados' : 'No hay proveedores inactivos'}</p>
          {vista === 'activos' && (
            <button className="btn btn-primary btn-sm" onClick={abrirNuevo}>Agregar proveedor</button>
          )}
        </div>
      ) : (
        <div className="card">
          {lista.map((p) => (
            <div key={p.id} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row-title" style={{ fontWeight: 600 }}>{p.nombre}</div>
                {p.ruc && <div className="row-meta num">RUC: {p.ruc}</div>}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                  {p.telefono && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-ink-2)' }}>
                      <Phone size={11} /> {p.telefono}
                    </span>
                  )}
                  {p.email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-ink-2)' }}>
                      <Mail size={11} /> {p.email}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.15rem' }}>
                {p.activo === false ? (
                  <button className="icon-btn" onClick={() => handleReactivar(p)} aria-label="Reactivar" title="Reactivar">
                    <RotateCcw size={15} />
                  </button>
                ) : (
                  <>
                    <button className="icon-btn" onClick={() => abrirEdicion(p)} aria-label="Editar"><Edit3 size={15} /></button>
                    <button className="icon-btn is-danger" onClick={() => handleDesactivar(p)} aria-label="Desactivar"><Trash2 size={15} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: '0.875rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-ink-3)' }}>
        {lista.length} proveedor{lista.length !== 1 ? 'es' : ''}
      </p>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <button className="icon-btn" onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleGuardar}>
              <div className="field">
                <label className="label">Nombre *</label>
                <input className="input" placeholder="Nombre del proveedor" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
              </div>
              <div className="field">
                <label className="label">RUC / cédula</label>
                <input className="input" placeholder="1234567890001" value={form.ruc} onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Teléfono</label>
                <input className="input" inputMode="tel" placeholder="09xxxxxxxx" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="email@ejemplo.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={guardando} style={{ marginTop: '0.5rem' }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
