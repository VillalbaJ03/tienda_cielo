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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  subtotal DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  nombre TEXT NOT NULL,
  telefono TEXT,
  limite_credito DECIMAL(10,2) DEFAULT 0,
  deuda_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos de fiado
CREATE TABLE IF NOT EXISTS pagos_fiado (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  fiado_id INTEGER,
  fecha TIMESTAMPTZ NOT NULL,
  monto DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  categoria TEXT DEFAULT 'Otros',
  descripcion TEXT,
  monto DECIMAL(10,2) DEFAULT 0,
  fecha TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caja diaria
CREATE TABLE IF NOT EXISTS caja_diaria (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  fecha TEXT NOT NULL,
  apertura DECIMAL(10,2) DEFAULT 0,
  cierre TIMESTAMPTZ,
  total_ventas DECIMAL(10,2) DEFAULT 0,
  total_gastos DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id BIGSERIAL PRIMARY KEY,
  local_id INTEGER,
  nombre TEXT NOT NULL,
  ruc TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RLS con políticas permisivas (idempotente).
-- ⚠️ "Allow all" = cualquiera con la publishable key lee y escribe.
-- Suficiente para arrancar; endurecer con Auth (ver docs/ROADMAP.md).
-- Incluye las tablas del bot si existen.
-- =============================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['productos','ventas','detalle_venta','clientes','fiados','pagos_fiado','gastos','caja_diaria','proveedores','movimientos_clientes','registro_ganancias_bot']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I', t);
      EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;

-- =============================================
-- Migración para bases existentes:
-- la app ordena el pull por updated_at en TODAS las tablas
-- =============================================
ALTER TABLE productos     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE ventas        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE detalle_venta ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE detalle_venta ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE clientes      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fiados        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pagos_fiado   ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pagos_fiado   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE gastos        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE gastos        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE caja_diaria   ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE caja_diaria   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE proveedores   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Soft-delete: la app desactiva registros en lugar de borrarlos
ALTER TABLE proveedores   ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE clientes      ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Mantener updated_at al día aunque escriba otro cliente (ej. el bot)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['productos','ventas','detalle_venta','clientes','fiados','pagos_fiado','gastos','caja_diaria','proveedores']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

-- =============================================
-- Realtime: las tablas deben estar en la publicación
-- para que la app reciba cambios en vivo
-- =============================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['productos','ventas','detalle_venta','clientes','fiados','pagos_fiado','gastos','caja_diaria','proveedores','movimientos_clientes','registro_ganancias_bot']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;
