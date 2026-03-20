import { useState, useCallback } from 'react';
import {
  buscarProductos,
  crearVenta,
  obtenerVentasDelDia,
  obtenerDetallesVenta,
  obtenerTodosProductos,
} from '../db/database';

export default function useVentas() {
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [loading, setLoading] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');

  const buscar = useCallback(async (termino) => {
    setBusqueda(termino);
    if (termino.length < 1) {
      setResultados([]);
      return;
    }
    try {
      const productos = await buscarProductos(termino);
      setResultados(productos.filter((p) => p.stock > 0));
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  }, []);

  const agregarAlCarrito = useCallback((producto) => {
    setCarrito((prev) => {
      const existente = prev.find((item) => item.producto_id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock) return prev;
        return prev.map((item) =>
          item.producto_id === producto.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario }
            : item
        );
      }
      return [
        ...prev,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio_unitario: producto.precio_venta,
          cantidad: 1,
          subtotal: producto.precio_venta,
          stock_disponible: producto.stock,
        },
      ];
    });
    setBusqueda('');
    setResultados([]);
  }, []);

  const quitarDelCarrito = useCallback((productoId) => {
    setCarrito((prev) => prev.filter((item) => item.producto_id !== productoId));
  }, []);

  const actualizarCantidad = useCallback((productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setCarrito((prev) =>
      prev.map((item) =>
        item.producto_id === productoId && nuevaCantidad <= item.stock_disponible
          ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precio_unitario }
          : item
      )
    );
  }, []);

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);
  const vuelto = montoPago ? parseFloat(montoPago) - total : 0;

  const completarVenta = useCallback(async (metodo, clienteId) => {
    if (carrito.length === 0) return null;
    setLoading(true);
    try {
      const ventaData = {
        total,
        metodo_pago: metodo || metodoPago,
        notas: '',
      };
      if (metodo === 'fiado' && clienteId) {
        ventaData.notas = `Fiado - Cliente ID: ${clienteId}`;
      }
      const detalles = carrito.map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      }));
      const ventaId = await crearVenta(ventaData, detalles);
      setCarrito([]);
      setMontoPago('');
      setBusqueda('');
      setResultados([]);
      return ventaId;
    } catch (error) {
      console.error('Error al completar venta:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [carrito, total, metodoPago]);

  const cargarVentasHoy = useCallback(async () => {
    try {
      const ventas = await obtenerVentasDelDia();
      const ventasConDetalles = await Promise.all(
        ventas.map(async (v) => {
          const detalles = await obtenerDetallesVenta(v.id);
          return { ...v, detalles };
        })
      );
      setVentasHoy(ventasConDetalles.reverse());
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  }, []);

  const limpiarCarrito = useCallback(() => {
    setCarrito([]);
    setMontoPago('');
  }, []);

  return {
    carrito,
    busqueda,
    resultados,
    ventasHoy,
    loading,
    montoPago,
    metodoPago,
    total,
    vuelto,
    buscar,
    agregarAlCarrito,
    quitarDelCarrito,
    actualizarCantidad,
    completarVenta,
    cargarVentasHoy,
    limpiarCarrito,
    setMontoPago,
    setMetodoPago,
  };
}
