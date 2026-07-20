import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, CreditCard } from 'lucide-react';
import useFiados from '../../hooks/useFiados';
import { formatMoneda } from '../../utils/formatters';
import { toast } from '../../ui/dialogos';

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
      toast('El nombre es obligatorio', 'error');
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
      toast('Cliente registrado con éxito');
      setModo('fiado');
    } catch (error) {
      toast(error.message || 'Error al registrar cliente', 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function handleCrearFiado(e) {
    e.preventDefault();
    if (!clienteId || !montoFiado) {
      toast('Selecciona un cliente e ingresa el monto', 'error');
      return;
    }
    setGuardando(true);
    try {
      await nuevoFiado(parseInt(clienteId), parseFloat(montoFiado));
      toast('Fiado registrado');
      navigate('/fiados');
    } catch {
      toast('Error al crear fiado', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to="/fiados" className="icon-btn" aria-label="Volver">
            <ArrowLeft size={19} />
          </Link>
          <h1 className="page-title">Nuevo registro</h1>
        </div>
      </div>

      {/* Selector de modo */}
      <div className="seg" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className={`seg-item ${modo === 'cliente' ? 'is-active' : ''}`}
          onClick={() => setModo('cliente')}
        >
          <UserPlus size={14} /> Cliente
        </button>
        <button
          type="button"
          className={`seg-item ${modo === 'fiado' ? 'is-active' : ''}`}
          onClick={() => setModo('fiado')}
        >
          <CreditCard size={14} /> Fiado
        </button>
      </div>

      {/* Form nuevo cliente */}
      {modo === 'cliente' && (
        <form onSubmit={handleCrearCliente} className="card card-pad animate-fade-in">
          <div className="field">
            <label className="label">Nombre *</label>
            <input
              className="input"
              placeholder="Nombre del cliente"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Teléfono</label>
            <input
              className="input"
              placeholder="09xxxxxxxx"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Límite de crédito ($)</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              className="input num"
              placeholder="0.00"
              value={limiteCredito}
              onChange={(e) => setLimiteCredito(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={guardando}
            style={{ marginTop: '0.5rem' }}
          >
            {guardando ? 'Guardando...' : 'Registrar cliente'}
          </button>
        </form>
      )}

      {/* Form nuevo fiado */}
      {modo === 'fiado' && (
        <form onSubmit={handleCrearFiado} className="card card-pad animate-fade-in">
          <div className="field">
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
                  {c.nombre} {c.deuda_total > 0 ? `(Deuda: ${formatMoneda(c.deuda_total)})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Monto del fiado ($) *</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              className="input input-amount"
              placeholder="0.00"
              value={montoFiado}
              onChange={(e) => setMontoFiado(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={guardando}
            style={{ marginTop: '0.5rem' }}
          >
            {guardando ? 'Guardando...' : 'Crear fiado'}
          </button>
        </form>
      )}
    </div>
  );
}
