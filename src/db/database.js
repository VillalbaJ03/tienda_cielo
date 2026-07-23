import Dexie from 'dexie';

const db = new Dexie('TiendaCieloDB');

db.version(1).stores({
  productos: '++id, nombre, codigo, categoria, proveedor_id, activo',
  ventas: '++id, fecha, metodo_pago, estado',
  detalle_venta: '++id, venta_id, producto_id',
  clientes: '++id, nombre, telefono',
  fiados: '++id, cliente_id, fecha, estado',
  pagos_fiado: '++id, fiado_id, fecha',
  gastos: '++id, categoria, fecha',
  caja_diaria: '++id, fecha',
  proveedores: '++id, nombre, ruc',
});

// Version 2: add sync tracking fields
db.version(2).stores({
  productos: '++id, nombre, codigo, categoria, proveedor_id, activo, synced',
  ventas: '++id, fecha, metodo_pago, estado, synced',
  detalle_venta: '++id, venta_id, producto_id, synced',
  clientes: '++id, nombre, telefono, synced',
  fiados: '++id, cliente_id, fecha, estado, synced',
  pagos_fiado: '++id, fiado_id, fecha, synced',
  gastos: '++id, categoria, fecha, synced',
  caja_diaria: '++id, fecha, synced',
  proveedores: '++id, nombre, ruc, synced',
}).upgrade(tx => {
  // Mark all existing records as unsynced
  const tables = ['productos', 'ventas', 'detalle_venta', 'clientes', 'fiados', 'pagos_fiado', 'gastos', 'caja_diaria', 'proveedores'];
  return Promise.all(
    tables.map(t => tx.table(t).toCollection().modify({ synced: 0 }))
  );
});

// Version 3: index cloud_id (Realtime lo consulta con where()) y tablas del bot
db.version(3).stores({
  productos: '++id, nombre, codigo, categoria, proveedor_id, activo, synced, cloud_id',
  ventas: '++id, fecha, metodo_pago, estado, synced, cloud_id',
  detalle_venta: '++id, venta_id, producto_id, synced, cloud_id',
  clientes: '++id, nombre, telefono, synced, cloud_id',
  fiados: '++id, cliente_id, fecha, estado, synced, cloud_id',
  pagos_fiado: '++id, fiado_id, fecha, synced, cloud_id',
  gastos: '++id, categoria, fecha, synced, cloud_id',
  caja_diaria: '++id, fecha, synced, cloud_id',
  proveedores: '++id, nombre, ruc, synced, cloud_id',
  movimientos_clientes: '++id, synced, cloud_id',
  registro_ganancias_bot: '++id, synced, cloud_id',
});

// Notifica al hook de sync que hubo un cambio local (push inmediato con debounce)
export function notificarCambioLocal() {
  window.dispatchEvent(new Event('local-db-changed'));
}

// ─── Productos ───────────────────────────────────────────
export async function agregarProducto(producto) {
  try {
    const id = await db.productos.add({
      ...producto,
      activo: true,
      stock: producto.stock || 0,
      stock_minimo: producto.stock_minimo || 5,
      synced: 0,
    });
    notificarCambioLocal();
    return id;
  } catch (error) {
    console.error('Error al agregar producto:', error);
    throw error;
  }
}

export async function actualizarProducto(id, cambios) {
  try {
    await db.productos.update(id, { ...cambios, synced: 0 });
    notificarCambioLocal();
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    throw error;
  }
}

export async function obtenerProductos() {
  try {
    // activo se guarda como boolean; no se puede consultar por índice con equals(1)
    return await db.productos.filter((p) => p.activo !== false).toArray();
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
}

export async function obtenerTodosProductos() {
  try {
    return await db.productos.toArray();
  } catch (error) {
    console.error('Error al obtener todos los productos:', error);
    throw error;
  }
}

export async function buscarProductos(termino) {
  try {
    const todos = await db.productos.toArray();
    const term = termino.toLowerCase();
    return todos.filter(
      (p) =>
        p.activo !== false &&
        (p.nombre?.toLowerCase().includes(term) ||
          p.codigo?.toLowerCase().includes(term))
    );
  } catch (error) {
    console.error('Error al buscar productos:', error);
    throw error;
  }
}

export async function obtenerProductosBajoStock() {
  try {
    const todos = await db.productos.toArray();
    return todos.filter((p) => p.activo !== false && p.stock <= p.stock_minimo);
  } catch (error) {
    console.error('Error al obtener productos con bajo stock:', error);
    throw error;
  }
}

// ─── Ventas ──────────────────────────────────────────────
export async function crearVenta(venta, detalles, clienteFiadoId = null) {
  try {
    const ventaId = await db.transaction('rw', db.ventas, db.detalle_venta, db.productos, db.fiados, db.clientes, async () => {
      const nuevaVentaId = await db.ventas.add({
        fecha: venta.fecha || new Date().toISOString(),
        total: venta.total,
        metodo_pago: venta.metodo_pago,
        estado: 'completada',
        notas: venta.notas || '',
        synced: 0,
      });

      for (const item of detalles) {
        await db.detalle_venta.add({
          venta_id: nuevaVentaId,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.cantidad * item.precio_unitario,
          synced: 0,
        });

        // Descontar stock
        const producto = await db.productos.get(item.producto_id);
        if (producto) {
          await db.productos.update(item.producto_id, {
            stock: producto.stock - item.cantidad,
            synced: 0,
          });
        }
      }

      // Venta fiada: registrar la deuda en la misma transacción
      if (venta.metodo_pago === 'fiado' && clienteFiadoId) {
        await db.fiados.add({
          cliente_id: clienteFiadoId,
          fecha: new Date().toISOString(),
          total: venta.total,
          saldo_pendiente: venta.total,
          estado: 'pendiente',
          synced: 0,
        });

        const cliente = await db.clientes.get(clienteFiadoId);
        if (cliente) {
          await db.clientes.update(clienteFiadoId, {
            deuda_total: (cliente.deuda_total || 0) + venta.total,
            synced: 0,
          });
        }
      }

      return nuevaVentaId;
    });
    notificarCambioLocal();
    return ventaId;
  } catch (error) {
    console.error('Error al crear venta:', error);
    throw error;
  }
}

export async function obtenerVentasDelDia(fecha) {
  try {
    const hoy = fecha || new Date().toISOString().split('T')[0];
    const ventas = await db.ventas.toArray();
    return ventas.filter((v) => v.fecha.startsWith(hoy));
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    throw error;
  }
}

export async function obtenerDetallesVenta(ventaId) {
  try {
    return await db.detalle_venta.where('venta_id').equals(ventaId).toArray();
  } catch (error) {
    console.error('Error al obtener detalles de venta:', error);
    throw error;
  }
}

// ─── Clientes ────────────────────────────────────────────
// Evita clientes duplicados: mismo nombre o mismo teléfono.
// Compara también contra inactivos para sugerir reactivarlos.
async function validarClienteUnico({ nombre, telefono, exceptoId = null }) {
  const nombreNorm = (nombre || '').trim().toLowerCase();
  const telNorm = (telefono || '').trim();
  const todos = await db.clientes.toArray();
  const dup = todos.find((c) => {
    if (exceptoId !== null && c.id === exceptoId) return false;
    const mismoNombre = nombreNorm && (c.nombre || '').trim().toLowerCase() === nombreNorm;
    const mismoTelefono = telNorm && (c.telefono || '').trim() === telNorm;
    return mismoNombre || mismoTelefono;
  });
  if (dup) {
    const motivo = (dup.nombre || '').trim().toLowerCase() === nombreNorm ? 'nombre' : 'teléfono';
    const estado = dup.activo === false ? ' Está inactivo: puedes reactivarlo en Clientes.' : '';
    throw new Error(`Ya existe un cliente con ese ${motivo}: ${dup.nombre}.${estado}`);
  }
}

export async function agregarCliente(cliente) {
  try {
    const nombre = (cliente.nombre || '').trim();
    const telefono = (cliente.telefono || '').trim();
    await validarClienteUnico({ nombre, telefono });
    const id = await db.clientes.add({
      nombre,
      telefono,
      limite_credito: cliente.limite_credito || 0,
      deuda_total: 0,
      synced: 0,
    });
    notificarCambioLocal();
    return id;
  } catch (error) {
    console.error('Error al agregar cliente:', error);
    throw error;
  }
}

export async function obtenerClientes() {
  try {
    // activo === false son clientes desactivados desde la nube/bot;
    // los creados localmente no traen el campo y deben mostrarse.
    return await db.clientes.filter((c) => c.activo !== false).toArray();
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
}

export async function obtenerClientesTodos() {
  try {
    return await db.clientes.toArray();
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
}

export async function actualizarCliente(id, cambios) {
  try {
    if (cambios.nombre !== undefined || cambios.telefono !== undefined) {
      const actual = await db.clientes.get(id);
      await validarClienteUnico({
        nombre: cambios.nombre !== undefined ? cambios.nombre : actual?.nombre,
        telefono: cambios.telefono !== undefined ? cambios.telefono : actual?.telefono,
        exceptoId: id,
      });
    }
    await db.clientes.update(id, { ...cambios, synced: 0 });
    notificarCambioLocal();
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
}

// ─── Fiados ──────────────────────────────────────────────
export async function crearFiado(fiado) {
  try {
    const fiadoId = await db.transaction('rw', db.fiados, db.clientes, async () => {
      const nuevoFiadoId = await db.fiados.add({
        cliente_id: fiado.cliente_id,
        fecha: new Date().toISOString(),
        total: fiado.total,
        saldo_pendiente: fiado.total,
        estado: 'pendiente',
        synced: 0,
      });

      const cliente = await db.clientes.get(fiado.cliente_id);
      if (cliente) {
        await db.clientes.update(fiado.cliente_id, {
          deuda_total: (cliente.deuda_total || 0) + fiado.total,
          synced: 0,
        });
      }

      return nuevoFiadoId;
    });
    notificarCambioLocal();
    return fiadoId;
  } catch (error) {
    console.error('Error al crear fiado:', error);
    throw error;
  }
}

export async function registrarPagoFiado(fiado_id, monto) {
  try {
    await db.transaction('rw', db.pagos_fiado, db.fiados, db.clientes, async () => {
      await db.pagos_fiado.add({
        fiado_id,
        fecha: new Date().toISOString(),
        monto,
        synced: 0,
      });

      const fiado = await db.fiados.get(fiado_id);
      if (fiado) {
        const nuevoSaldo = fiado.saldo_pendiente - monto;
        await db.fiados.update(fiado_id, {
          saldo_pendiente: nuevoSaldo,
          estado: nuevoSaldo <= 0 ? 'pagado' : 'pendiente',
          synced: 0,
        });

        const cliente = await db.clientes.get(fiado.cliente_id);
        if (cliente) {
          await db.clientes.update(fiado.cliente_id, {
            deuda_total: Math.max(0, (cliente.deuda_total || 0) - monto),
            synced: 0,
          });
        }
      }
    });
    notificarCambioLocal();
    return true;
  } catch (error) {
    console.error('Error al registrar pago de fiado:', error);
    throw error;
  }
}

export async function obtenerFiadosPendientes() {
  try {
    return await db.fiados.where('estado').equals('pendiente').toArray();
  } catch (error) {
    console.error('Error al obtener fiados pendientes:', error);
    throw error;
  }
}

export async function obtenerFiadosCliente(clienteId) {
  try {
    return await db.fiados.where('cliente_id').equals(clienteId).toArray();
  } catch (error) {
    console.error('Error al obtener fiados del cliente:', error);
    throw error;
  }
}

export async function obtenerPagosFiado(fiadoId) {
  try {
    return await db.pagos_fiado.where('fiado_id').equals(fiadoId).toArray();
  } catch (error) {
    console.error('Error al obtener pagos del fiado:', error);
    throw error;
  }
}

// ─── Gastos ──────────────────────────────────────────────
export async function agregarGasto(gasto) {
  try {
    const id = await db.gastos.add({
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: new Date().toISOString(),
      synced: 0,
    });
    notificarCambioLocal();
    return id;
  } catch (error) {
    console.error('Error al agregar gasto:', error);
    throw error;
  }
}

export async function obtenerGastosDelDia(fecha) {
  try {
    const hoy = fecha || new Date().toISOString().split('T')[0];
    const gastos = await db.gastos.toArray();
    return gastos.filter((g) => g.fecha.startsWith(hoy));
  } catch (error) {
    console.error('Error al obtener gastos del día:', error);
    throw error;
  }
}

export async function obtenerGastosDelMes(anio, mes) {
  try {
    const prefix = `${anio}-${String(mes).padStart(2, '0')}`;
    const gastos = await db.gastos.toArray();
    return gastos.filter((g) => g.fecha.startsWith(prefix));
  } catch (error) {
    console.error('Error al obtener gastos del mes:', error);
    throw error;
  }
}

// ─── Caja Diaria ─────────────────────────────────────────
export async function abrirCaja(montoApertura) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const cajaExistente = await db.caja_diaria.where('fecha').equals(hoy).first();
    if (cajaExistente) {
      throw new Error('Ya existe una caja abierta para hoy');
    }
    const id = await db.caja_diaria.add({
      fecha: hoy,
      apertura: montoApertura,
      cierre: null,
      total_ventas: 0,
      total_gastos: 0,
      synced: 0,
    });
    notificarCambioLocal();
    return id;
  } catch (error) {
    console.error('Error al abrir caja:', error);
    throw error;
  }
}

export async function cerrarCaja(totalVentas, totalGastos) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const caja = await db.caja_diaria.where('fecha').equals(hoy).first();
    if (!caja) throw new Error('No hay caja abierta para hoy');

    await db.caja_diaria.update(caja.id, {
      cierre: new Date().toISOString(),
      total_ventas: totalVentas,
      total_gastos: totalGastos,
      synced: 0,
    });
    notificarCambioLocal();
    return caja;
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    throw error;
  }
}

export async function obtenerCajaDelDia() {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    return await db.caja_diaria.where('fecha').equals(hoy).first();
  } catch (error) {
    console.error('Error al obtener caja del día:', error);
    throw error;
  }
}

// ─── Proveedores ─────────────────────────────────────────
export async function agregarProveedor(proveedor) {
  try {
    const id = await db.proveedores.add({
      nombre: proveedor.nombre,
      ruc: proveedor.ruc || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      synced: 0,
    });
    notificarCambioLocal();
    return id;
  } catch (error) {
    console.error('Error al agregar proveedor:', error);
    throw error;
  }
}

export async function obtenerProveedores() {
  try {
    return await db.proveedores.filter((p) => p.activo !== false).toArray();
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
}

export async function obtenerProveedoresTodos() {
  try {
    return await db.proveedores.toArray();
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
}

export async function actualizarProveedor(id, cambios) {
  try {
    await db.proveedores.update(id, { ...cambios, synced: 0 });
    notificarCambioLocal();
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    throw error;
  }
}

// Soft-delete: un borrado físico no se propaga a la nube y el registro
// "revive" en el siguiente pull. Desactivar sí se sincroniza.
export async function desactivarProveedor(id) {
  try {
    await db.proveedores.update(id, { activo: false, synced: 0 });
    notificarCambioLocal();
  } catch (error) {
    console.error('Error al desactivar proveedor:', error);
    throw error;
  }
}

export default db;
