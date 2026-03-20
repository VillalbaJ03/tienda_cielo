import { useState, useEffect, useCallback } from 'react';
import {
  obtenerClientes,
  agregarCliente,
  crearFiado,
  registrarPagoFiado,
  obtenerFiadosPendientes,
  obtenerFiadosCliente,
  obtenerPagosFiado,
} from '../db/database';

export default function useFiados() {
  const [clientes, setClientes] = useState([]);
  const [fiadosPendientes, setFiadosPendientes] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const clientesList = await obtenerClientes();
      const fiados = await obtenerFiadosPendientes();

      // Enriquecer clientes con sus fiados pendientes
      const clientesConFiados = clientesList.map((c) => ({
        ...c,
        fiados: fiados.filter((f) => f.cliente_id === c.id),
      }));

      setClientes(clientesConFiados);
      setFiadosPendientes(fiados);
    } catch (error) {
      console.error('Error al cargar datos de fiados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const nuevoCliente = useCallback(async (cliente) => {
    try {
      const id = await agregarCliente(cliente);
      await cargarDatos();
      return id;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }, [cargarDatos]);

  const nuevoFiado = useCallback(async (clienteId, total) => {
    try {
      const id = await crearFiado({ cliente_id: clienteId, total });
      await cargarDatos();
      return id;
    } catch (error) {
      console.error('Error al crear fiado:', error);
      throw error;
    }
  }, [cargarDatos]);

  const registrarPago = useCallback(async (fiadoId, monto) => {
    try {
      await registrarPagoFiado(fiadoId, monto);
      await cargarDatos();
      return true;
    } catch (error) {
      console.error('Error al registrar pago:', error);
      throw error;
    }
  }, [cargarDatos]);

  const clientesConDeuda = clientes.filter((c) => c.deuda_total > 0);
  const totalDeudas = clientesConDeuda.reduce((sum, c) => sum + (c.deuda_total || 0), 0);

  return {
    clientes,
    clientesConDeuda,
    fiadosPendientes,
    totalDeudas,
    loading,
    nuevoCliente,
    nuevoFiado,
    registrarPago,
    cargarDatos,
  };
}
