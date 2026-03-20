import { useState, useEffect, useCallback } from 'react';
import {
  obtenerTodosProductos,
  agregarProducto,
  actualizarProducto,
  buscarProductos,
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
      const todos = await obtenerTodosProductos();
      setProductos(todos.filter((p) => p.activo !== false));
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

  const productosFiltrados = productos.filter((p) => {
    const matchCategoria = filtroCategoria === 'Todas' || p.categoria === filtroCategoria;
    const matchBusqueda =
      !busqueda ||
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  return {
    productos: productosFiltrados,
    todosProductos: productos,
    productosBajoStock,
    filtroCategoria,
    busqueda,
    loading,
    setFiltroCategoria,
    setBusqueda,
    guardarProducto,
    desactivarProducto,
    cargarProductos,
  };
}
