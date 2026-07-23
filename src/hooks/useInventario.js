import { useState, useEffect, useCallback } from 'react';
import {
  obtenerTodosProductos,
  agregarProducto,
  actualizarProducto,
  obtenerProductosBajoStock,
} from '../db/database';

export default function useInventario() {
  const [productos, setProductos] = useState([]);
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);

  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      setProductos(await obtenerTodosProductos());
      const bajoStock = await obtenerProductosBajoStock();
      setProductosBajoStock(bajoStock);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const guardarProducto = useCallback(async (producto, id) => {
    try {
      if (id) {
        await actualizarProducto(id, producto);
      } else {
        await agregarProducto(producto);
      }
      await cargarProductos();
      return true;
    } catch (error) {
      console.error('Error al guardar producto:', error);
      return false;
    }
  }, [cargarProductos]);

  const desactivarProducto = useCallback(async (id) => {
    try {
      await actualizarProducto(id, { activo: false });
      await cargarProductos();
    } catch (error) {
      console.error('Error al desactivar producto:', error);
    }
  }, [cargarProductos]);

  const reactivarProducto = useCallback(async (id) => {
    try {
      await actualizarProducto(id, { activo: true });
      await cargarProductos();
    } catch (error) {
      console.error('Error al reactivar producto:', error);
    }
  }, [cargarProductos]);

  const filtrar = (lista) => lista.filter((p) => {
    const matchCategoria = filtroCategoria === 'Todas' || p.categoria === filtroCategoria;
    const matchBusqueda =
      !busqueda ||
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  const activos = productos.filter((p) => p.activo !== false);
  const inactivos = productos.filter((p) => p.activo === false);

  return {
    productos: filtrar(activos),
    productosInactivos: filtrar(inactivos),
    totalActivos: activos.length,
    totalInactivos: inactivos.length,
    todosProductos: productos,
    productosBajoStock,
    filtroCategoria,
    busqueda,
    loading,
    setFiltroCategoria,
    setBusqueda,
    guardarProducto,
    desactivarProducto,
    reactivarProducto,
    cargarProductos,
  };
}
