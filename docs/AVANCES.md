# Bitácora de avances

Registro cronológico de lo que se ha hecho en Tienda Cielo. La visión y lo que falta está en [ROADMAP.md](ROADMAP.md); las reglas visuales en [DISENO.md](DISENO.md).

## 2026-07-16 — Escáner de barras, importación CSV y vista de escritorio

- **Escáner de código de barras con la cámara** (`EscanerBarras.jsx`): usa la API nativa `BarcodeDetector` cuando existe y cae a ZXing (carga bajo demanda) en el resto. Requiere HTTPS o localhost.
  - En **Nuevo producto**: escanea el código y autocompleta el nombre consultando **Open Food Facts** (catálogo público y gratuito) — solo queda poner precio y stock.
  - En el **punto de venta**: escanea y el producto cae directo al carrito (busca por código en la base local).
  - En escritorio también sirve una pistola USB: escribe el código como si fuera teclado.
- **Importación masiva por CSV** (`/inventario/importar`): plantilla descargable (compatible con Excel, delimitador ; o ,), vista previa con validación por fila (nuevos / a actualizar / con errores) y carga de golpe. Si el producto ya existe (mismo código o nombre) se actualiza en lugar de duplicarse.
- **Vista de escritorio** (≥1024 px): la barra inferior se reemplaza por una **barra lateral** con la marca, **Vender como botón de acción principal** y los módulos agrupados por secciones (Catálogo / Personas / Finanzas). El contenido usa más ancho. El móvil no cambia en nada.

## 2026-07-16 — Adiós a los popups nativos del navegador

- Se reemplazaron **todos** los `alert()` y `confirm()` nativos ("localhost:8080 dice...") por UI propia: `src/ui/dialogos.js` expone `toast(mensaje, tipo)` (aviso flotante autodescartable, éxito/error) y `confirmar({...})` (diálogo centrado con Cancelar + acción, promesa booleana; Escape/Enter funcionan). `DialogHost` se monta una sola vez en el Layout.
- Confirmaciones destructivas (desactivar producto/cliente/proveedor, cerrar caja) usan el diálogo con botón rojo sólido; validaciones y errores usan toast de error; los éxitos (venta, gasto, abono, guardados) ahora dan feedback con toast de éxito.
- Verificado con Playwright (nube bloqueada): cero diálogos nativos del navegador en todos los flujos.

## 2026-07-16 — Inactivos en todo el catálogo + clientes sin duplicados

- **Patrón Activos/Inactivos extendido a todo el catálogo**: Inventario y Proveedores ahora tienen pestañas con conteo, badge "Inactivo" y botón Reactivar (Clientes ya lo tenía). Nada se pierde de vista.
- **Proveedores pasó de borrado físico a soft-delete** (`activo: false`): el borrado físico no se propagaba a la nube y el registro "revivía" en el siguiente pull. Requiere re-ejecutar `supabase-setup.sql` (agrega la columna `activo` a proveedores/clientes en la nube).
- **Validación de clientes duplicados**: no se puede crear ni editar un cliente con el mismo nombre o el mismo teléfono de otro existente; si el duplicado está inactivo, el mensaje sugiere reactivarlo. Aplica en el módulo Clientes y en el alta rápida de Fiados.
- Verificado con Playwright bloqueando la red hacia Supabase (mutaciones de prueba sin contaminar la base real): validaciones, desactivar/reactivar producto, cliente y proveedor — sin errores.

## 2026-07-16 — Sync completa verificada + módulo Clientes

- Con las políticas RLS aplicadas (el usuario ejecutó `supabase-setup.sql`), el pull baja **todo el contenido de la nube**: 25 productos, 11 clientes, 18 ventas, 20 detalles, 3 fiados, 7 pagos, gastos, proveedores y el registro del bot — verificado contra la base real sin errores de consola.
- **Nuevo módulo Clientes** (`/clientes`, en el hub "Más"): búsqueda por nombre/teléfono, pestañas Activos/Inactivos con conteo, edición (nombre, teléfono, límite de crédito) y activar/desactivar. Con esto se pueden depurar desde la app los duplicados y registros de prueba que existen en la nube (8 de los 11 clientes están `activo=false`; "Jenner Villalba" tiene 2 registros activos duplicados).
- El hub "Más" pasó a cuadrícula 3×3 con los 9 módulos.
- Las vistas de Clientes se refrescan al recibir `sync-completed` (cambios del bot aparecen sin recargar).

## 2026-07-16 — Conexión real con Supabase (diagnóstico RLS)

- Se configuró el `.env` con la **publishable key** (`sb_publishable_…`, el formato nuevo que reemplaza a la anon key). La secret key NO va en el frontend: es solo para el bot.
- **Diagnóstico de "no trae los datos"**: la key funcionaba (Realtime suscribía, REST respondía 200) pero devolvía lista vacía → **RLS activado sin políticas para el rol anónimo**. Con la secret key (salta RLS) los datos sí aparecían: la base tiene los datos, las políticas "Allow all" nunca se aplicaron.
- `supabase-setup.sql` ahora es **idempotente** (se puede re-ejecutar sobre la base existente) y cubre también las tablas del bot (`movimientos_clientes`, `registro_ganancias_bot`) en políticas y Realtime. **Pendiente: ejecutarlo en el SQL Editor.**
- `pullFromCloud` ya no aborta la descarga completa si una sola tabla falla (p. ej. columna `updated_at` faltante).
- El chip del header muestra "Nube sin configurar" cuando faltan credenciales (antes decía "Conectado" y confundía).
- En la nube hay clientes de prueba con `activo=false`; `obtenerClientes()` ahora los filtra.
- MCP de Supabase agregado en `.mcp.json` (pendiente autenticación con `/mcp` en terminal normal).

## 2026-07-16 — Navegación estilo Treinta + documentación

- **Barra inferior rediseñada tomando Treinta como referencia**: botón central circular destacado para **Vender** (la acción más frecuente de la tienda) y pestaña **Más** que ya no navega a una página aparte, sino que despliega una **hoja inferior con la cuadrícula de todos los módulos** (Inicio, Vender, Inventario, Fiados, Caja, Gastos, Historial, Proveedores), resaltando el módulo activo.
- Se eliminó la página `/mas` (reemplazada por la hoja desplegable).
- Se creó esta carpeta `docs/` para documentar avances, roadmap y sistema de diseño.

## 2026-07-16 — Rediseño visual completo (v2)

- Nuevo sistema de diseño en `src/index.css`: paleta neutral (zinc) con **un solo acento esmeralda**, dinero con números tabulares alineados a la derecha, superficies planas con borde fino, radio contenido y sombra mínima.
- Eliminado el look "plantilla de IA": emojis en badges, degradados, iconos en cajitas pastel multicolor, animaciones escalonadas, pesos tipográficos 800/900 y etiquetas en mayúsculas.
- Header de aplicación con la marca y **chip de estado de sincronización** (reemplaza la franja de color a todo lo ancho).
- Dashboard con **número héroe** (Ventas de hoy) + KPI secundarios en la misma tarjeta; controles segmentados para pestañas (Hoy/Mes, método de pago, Cliente/Fiado); Caja como tabla de arqueo.
- El color solo comunica significado: balance negativo en rojo, stock agotado en rojo, stock bajo en ámbar.
- Verificado con recorrido end-to-end en Playwright (crear producto → vender → gasto → caja) sin errores de consola.

## 2026-07-16 — Docker

- `Dockerfile` multi-etapa (Node 22 compila, nginx 1.27 sirve) + `docker-compose.yml`. La app corre en `http://localhost:8080` con `docker compose up -d --build`.
- nginx configurado para PWA: fallback de SPA, `sw.js`/manifest sin caché, assets con hash cacheados 1 año.
- Las variables `VITE_*` se incrustan en el build: tras cambiar el `.env` hay que reconstruir la imagen.

## 2026-07-16 — Correcciones de sincronización y PWA (v1)

- **Sync reparada**: tablas `movimientos_clientes` y `registro_ganancias_bot` faltaban en Dexie (TypeError en cada ciclo); `cloud_id` sin indexar rompía los handlers de Realtime; las mutaciones locales no marcaban `synced: 0` ni disparaban `local-db-changed`, así que los cambios nunca subían.
- **Venta fiada corregida**: ahora crea el fiado y actualiza `deuda_total` del cliente en la misma transacción (antes solo guardaba una nota).
- **SQL de Supabase actualizado**: columnas `updated_at` + triggers en las 9 tablas, inscripción en la publicación Realtime.
- **PWA real**: manifest, service worker (vite-plugin-pwa) e íconos generados; funciona offline e instalable.
- ESLint de 25 errores a 0; `obtenerProductos` corregido (consultaba `activo === 1` sobre un boolean).
