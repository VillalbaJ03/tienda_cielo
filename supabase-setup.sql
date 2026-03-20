-- =============================================
-- Tienda Cielo — Supabase Tables
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  nombre TEXT NOT NULL,
  codigo TEXT,
  precio_compra DECIMAL(10,2) DEFAULT 0,
  precio_venta DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 5,
  categoria TEXT DEFAULT 'General',
  proveedor_id INTEGER,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ventas
CREATE TABLE IF NOT EXISTS ventas (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  fecha TIMESTAMPTZ NOT NULL,
  total DECIMAL(10,2) DEFAULT 0,
  metodo_pago TEXT DEFAULT 'efectivo',
  estado TEXT DEFAULT 'completada',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detalle de venta
CREATE TABLE IF NOT EXISTS detalle_venta (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  venta_id INTEGER,
  venta_cloud_id BIGINT REFERENCES ventas(id),
  producto_id INTEGER,
  cantidad INTEGER DEFAULT 1,
  precio_unitario DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  nombre TEXT NOT NULL,
  telefono TEXT,
  limite_credito DECIMAL(10,2) DEFAULT 0,
  deuda_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fiados
CREATE TABLE IF NOT EXISTS fiados (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  cliente_id INTEGER,
  fecha TIMESTAMPTZ NOT NULL,
  total DECIMAL(10,2) DEFAULT 0,
  saldo_pendiente DECIMAL(10,2) DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos de fiado
CREATE TABLE IF NOT EXISTS pagos_fiado (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  fiado_id INTEGER,
  fecha TIMESTAMPTZ NOT NULL,
  monto DECIMAL(10,2) DEFAULT 0
);

-- Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  categoria TEXT DEFAULT 'Otros',
  descripcion TEXT,
  monto DECIMAL(10,2) DEFAULT 0,
  fecha TIMESTAMPTZ NOT NULL
);

-- Caja diaria
CREATE TABLE IF NOT EXISTS caja_diaria (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  fecha TEXT NOT NULL,
  apertura DECIMAL(10,2) DEFAULT 0,
  cierre TIMESTAMPTZ,
  total_ventas DECIMAL(10,2) DEFAULT 0,
  total_gastos DECIMAL(10,2) DEFAULT 0
);

-- Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  nombre TEXT NOT NULL,
  ruc TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) - PERMISIVO para inicio
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiados ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_fiado ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_diaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (acceso completo con anon key)
CREATE POLICY "Allow all" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON detalle_venta FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON fiados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON pagos_fiado FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON gastos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON caja_diaria FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON proveedores FOR ALL USING (true) WITH CHECK (true);
