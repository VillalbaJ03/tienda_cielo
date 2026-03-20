import { useState, useEffect } from 'react';
import { Truck, Plus, Save, X, Edit3, Trash2, Phone, Mail } from 'lucide-react';
import { obtenerProveedores, agregarProveedor, actualizarProveedor, eliminarProveedor } from '../../db/database';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', ruc: '', telefono: '', email: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarProveedores(); }, []);

  async function cargarProveedores() {
    try { setProveedores(await obtenerProveedores()); }
    catch (error) { console.error('Error al cargar proveedores:', error); }
  }

  function abrirEdicion(p) {
    setEditando(p.id);
    setForm({ nombre: p.nombre, ruc: p.ruc || '', telefono: p.telefono || '', email: p.email || '' });
    setShowForm(true);
  }

  function abrirNuevo() { setEditando(null); setForm({ nombre: '', ruc: '', telefono: '', email: '' }); setShowForm(true); }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre) { alert('El nombre es obligatorio'); return; }
    setGuardando(true);
    try {
      if (editando) await actualizarProveedor(editando, form);
      else await agregarProveedor(form);
      setShowForm(false); setEditando(null); setForm({ nombre: '', ruc: '', telefono: '', email: '' }); await cargarProveedores();
    } catch (error) { alert('Error al guardar proveedor');
    } finally { setGuardando(false); }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Deseas eliminar este proveedor?')) return;
    try { await eliminarProveedor(id); await cargarProveedores(); }
    catch (error) { alert('Error al eliminar proveedor'); }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Proveedores</h1>
        <button className="btn btn-primary btn-sm" onClick={abrirNuevo}><Plus size={13} /> Nuevo</button>
      </div>

      {proveedores.length === 0 ? (
        <div className="empty-state">
          <Truck size={44} />
          <p>No hay proveedores registrados</p>
          <button className="btn btn-primary btn-sm" onClick={abrirNuevo}>Agregar proveedor</button>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {proveedores.map((p) => (
            <div key={p.id} className="card" style={{ padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.15rem' }}>{p.nombre}</div>
                  {p.ruc && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.1rem' }}>RUC: {p.ruc}</div>}
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    {p.telefono && <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}><Phone size={11} /> {p.telefono}</div>}
                    {p.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}><Mail size={11} /> {p.email}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={() => abrirEdicion(p)}><Edit3 size={14} /></button>
                  <button className="btn btn-ghost" style={{ padding: '0.3rem', color: 'var(--color-danger)' }} onClick={() => handleEliminar(p.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
        {proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleGuardar}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div><label className="label">Nombre *</label><input className="input" placeholder="Nombre del proveedor" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required /></div>
                <div><label className="label">RUC / Cédula</label><input className="input" placeholder="1234567890001" value={form.ruc} onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))} /></div>
                <div><label className="label">Teléfono</label><input className="input" placeholder="09xxxxxxxx" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} /></div>
                <div><label className="label">Email</label><input type="email" className="input" placeholder="email@ejemplo.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={guardando} style={{ marginTop: '1.25rem' }}>
                <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
