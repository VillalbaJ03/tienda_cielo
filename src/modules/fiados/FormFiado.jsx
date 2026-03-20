import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Save, CreditCard } from 'lucide-react';
import useFiados from '../../hooks/useFiados';

export default function FormFiado() {
  const navigate = useNavigate();
  const { clientes, nuevoCliente, nuevoFiado } = useFiados();

  const [modo, setModo] = useState('cliente'); // 'cliente' o 'fiado'
  const [guardando, setGuardando] = useState(false);

  // Form cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('');

  // Form fiado
  const [clienteId, setClienteId] = useState('');
  const [montoFiado, setMontoFiado] = useState('');

  async function handleCrearCliente(e) {
    e.preventDefault();
    if (!nombre) {
      alert('El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    try {
      await nuevoCliente({
        nombre,
        telefono,
        limite_credito: parseFloat(limiteCredito) || 0,
      });
      setNombre('');
      setTelefono('');
      setLimiteCredito('');
      alert('Cliente registrado con éxito');
      setModo('fiado');
    } catch (error) {
      alert('Error al registrar cliente');
    } finally {
      setGuardando(false);
    }
  }

  async function handleCrearFiado(e) {
    e.preventDefault();
    if (!clienteId || !montoFiado) {
      alert('Selecciona un cliente e ingresa el monto');
      return;
    }
    setGuardando(true);
    try {
      await nuevoFiado(parseInt(clienteId), parseFloat(montoFiado));
      navigate('/fiados');
    } catch (error) {
      alert('Error al crear fiado');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/fiados"
            style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">Nuevo Registro</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          className={`btn ${modo === 'cliente' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setModo('cliente')}
          style={{ flex: 1 }}
        >
          <UserPlus size={14} /> Nuevo Cliente
        </button>
        <button
          className={`btn ${modo === 'fiado' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setModo('fiado')}
          style={{ flex: 1 }}
        >
          <CreditCard size={14} /> Nuevo Fiado
        </button>
      </div>

      {/* Form nuevo cliente */}
      {modo === 'cliente' && (
        <form onSubmit={handleCrearCliente} className="animate-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label className="label">Nombre *</label>
              <input
                className="input"
                placeholder="Nombre del cliente"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                className="input"
                placeholder="09xxxxxxxx"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Límite de crédito ($)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
                value={limiteCredito}
                onChange={(e) => setLimiteCredito(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={guardando}
            style={{ marginTop: '1.5rem', opacity: guardando ? 0.5 : 1 }}
          >
            <Save size={16} /> {guardando ? 'Guardando...' : 'Registrar Cliente'}
          </button>
        </form>
      )}

      {/* Form nuevo fiado */}
      {modo === 'fiado' && (
        <form onSubmit={handleCrearFiado} className="animate-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label className="label">Cliente *</label>
              <select
                className="input"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.deuda_total > 0 ? `(Deuda: $${c.deuda_total.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Monto del fiado ($) *</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
                value={montoFiado}
                onChange={(e) => setMontoFiado(e.target.value)}
                style={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={guardando}
            style={{ marginTop: '1.5rem', opacity: guardando ? 0.5 : 1 }}
          >
            <Save size={16} /> {guardando ? 'Guardando...' : 'Crear Fiado'}
          </button>
        </form>
      )}
    </div>
  );
}
