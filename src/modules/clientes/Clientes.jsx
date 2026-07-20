import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, UserRound, X, Phone } from 'lucide-react';
import { obtenerClientesTodos, agregarCliente, actualizarCliente } from '../../db/database';
import { formatMoneda } from '../../utils/formatters';
import { toast, confirmar } from '../../ui/dialogos';

const formVacio = { nombre: '', telefono: '', limite_credito: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [vista, setVista] = useState('activos');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null); // cliente en edición o null
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try { setClientes(await obtenerClientesTodos()); }
    catch (error) { console.error('Error al cargar clientes:', error); }
  }, []);

  useEffect(() => {
    cargar();
    window.addEventListener('sync-completed', cargar);
    return () => window.removeEventListener('sync-completed', cargar);
  }, [cargar]);

  const activos = clientes.filter((c) => c.activo !== false);
  const inactivos = clientes.filter((c) => c.activo === false);
  const lista = (vista === 'activos' ? activos : inactivos).filter((c) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return c.nombre?.toLowerCase().includes(q) || c.telefono?.includes(q);
  });

  function abrirNuevo() {
    setEditando(null);
    setForm(formVacio);
    setShowForm(true);
  }

  function abrirEdicion(c) {
    setEditando(c);
    setForm({
      nombre: c.nombre || '',
      telefono: c.telefono || '',
      limite_credito: c.limite_credito ? String(c.limite_credito) : '',
    });
    setShowForm(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { toast('El nombre es obligatorio', 'error'); return; }
    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        limite_credito: parseFloat(form.limite_credito) || 0,
      };
      if (editando) await actualizarCliente(editando.id, datos);
      else await agregarCliente(datos);
      setShowForm(false);
      toast(editando ? 'Cliente actualizado' : 'Cliente registrado');
      await cargar();
    } catch (error) { toast(error.message || 'Error al guardar el cliente', 'error');
    } finally { setGuardando(false); }
  }

  async function handleCambiarEstado() {
    const desactivar = editando.activo !== false;
    if (desactivar) {
      const ok = await confirmar({
        titulo: `¿Desactivar a ${editando.nombre}?`,
        mensaje: 'Dejará de aparecer en fiados y en el punto de venta. Puedes reactivarlo cuando quieras.',
        textoConfirmar: 'Desactivar',
        peligro: true,
      });
      if (!ok) return;
    }
    setGuardando(true);
    try {
      await actualizarCliente(editando.id, { activo: !desactivar });
      setShowForm(false);
      toast(desactivar ? 'Cliente desactivado' : 'Cliente reactivado');
      await cargar();
    } catch { toast('Error al actualizar el cliente', 'error');
    } finally { setGuardando(false); }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <button className="btn btn-primary btn-sm" onClick={abrirNuevo}>
          <Plus size={14} /> Nuevo
        </button>
      </div>

      <div className="search-wrap" style={{ marginBottom: '0.75rem' }}>
        <Search size={15} />
        <input
          type="text"
          className="input"
          placeholder="Buscar por nombre o teléfono"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
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
          <UserRound size={32} strokeWidth={1.5} />
          <p>{busqueda ? 'Sin resultados para la búsqueda' : vista === 'activos' ? 'No hay clientes activos' : 'No hay clientes inactivos'}</p>
          {!busqueda && vista === 'activos' && (
            <button className="btn btn-primary btn-sm" onClick={abrirNuevo}>Registrar cliente</button>
          )}
        </div>
      ) : (
        <div className="card">
          {lista.map((c) => (
            <button key={c.id} className="list-row" onClick={() => abrirEdicion(c)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row-title">{c.nombre}</div>
                <div className="row-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {c.telefono
                    ? <><Phone size={11} /> {c.telefono}</>
                    : 'Sin teléfono'}
                  {c.limite_credito > 0 && <span className="num">· Límite {formatMoneda(c.limite_credito)}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="row-amount">{formatMoneda(c.deuda_total || 0)}</div>
                <span className={`badge ${c.activo === false ? 'badge-neutral' : c.deuda_total > 0 ? 'badge-warning' : 'badge-success'}`}>
                  {c.activo === false ? 'Inactivo' : c.deuda_total > 0 ? 'Debe' : 'Al día'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button className="icon-btn" onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleGuardar}>
              <div className="field">
                <label className="label">Nombre *</label>
                <input className="input" placeholder="Nombre del cliente" value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
              </div>
              <div className="field">
                <label className="label">Teléfono</label>
                <input className="input" inputMode="tel" placeholder="09xxxxxxxx" value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Límite de crédito ($)</label>
                <input type="number" step="0.01" inputMode="decimal" className="input num" placeholder="0.00"
                  value={form.limite_credito}
                  onChange={(e) => setForm((f) => ({ ...f, limite_credito: e.target.value }))} />
              </div>

              {editando && (editando.deuda_total || 0) > 0 && (
                <p className="form-hint num" style={{ marginBottom: '0.875rem' }}>
                  Deuda actual: {formatMoneda(editando.deuda_total)}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={guardando} style={{ marginTop: '0.5rem' }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>

              {editando && (
                <button
                  type="button"
                  className={`btn btn-block ${editando.activo === false ? 'btn-secondary' : 'btn-danger'}`}
                  onClick={handleCambiarEstado}
                  disabled={guardando}
                  style={{ marginTop: '0.5rem' }}
                >
                  {editando.activo === false ? 'Reactivar cliente' : 'Desactivar cliente'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
