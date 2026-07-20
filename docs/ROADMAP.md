# Roadmap — a dónde queremos llegar

**Visión**: que Tienda Cielo sea el sistema completo de una tienda de barrio — al nivel de apps como **Treinta** (la referencia de UX que seguimos) — funcionando offline-first, sincronizado con la nube y usable con una sola mano detrás del mostrador.

## Prioridad 1 — Seguridad (bloqueante para producción)

- [ ] **Supabase Auth + políticas RLS restrictivas.** Hoy las políticas son "Allow all" con la anon key: cualquiera con la URL puede leer/escribir toda la base. Hay que coordinar con el bot que escribe en esas tablas (probablemente con una service role key propia).
- [ ] Revisar las 9 vulnerabilidades que reporta `npm audit` (mayormente dependencias de desarrollo).

## Prioridad 2 — Integridad de datos

- [ ] **Tombstones para eliminaciones.** Borrar un registro local no se propaga a la nube; al hacer pull el registro "revive". Se necesita borrado lógico (`deleted_at`) sincronizado.
- [ ] Resolución de conflictos multi-dispositivo (última escritura gana está bien para empezar, pero documentarlo y probarlo).
- [ ] Respaldo/exportación de datos (CSV o JSON descargable) para que la tienda no dependa solo de la nube.

## Prioridad 3 — Funcionalidad de negocio

- [x] Escáner de código de barras con la cámara (alta de productos con autocompletado desde Open Food Facts + cobro en el punto de venta). *Hecho 2026-07-16.*
- [x] Importación masiva de productos por CSV con plantilla. *Hecho 2026-07-16.*
- [ ] **Estadísticas / reportes** (lo que Treinta hace muy bien): ventas por día/semana/mes, productos más vendidos, margen de ganancia real, comparativas. Gráficas simples y legibles.
- [ ] Cierre de caja con desglose por método de pago (efectivo vs. transferencia vs. fiado).
- [ ] Recordatorios de cobro de fiados (lista de deudores con antigüedad de la deuda; compartir recordatorio por WhatsApp).
- [ ] Compras a proveedores que alimenten el stock (hoy los proveedores son solo un directorio).
- [ ] **Reconocimiento de productos por foto con IA**: cuando el código de barras no está en los catálogos abiertos (frecuente en productos ecuatorianos), tomar foto del empaque → un modelo de visión (Gemini tiene capa gratuita; Claude cuesta centavos) devuelve nombre, marca y presentación. Requiere una mini-función en la nube que guarde la API key — nunca ponerla en el frontend.
- [ ] **Factura de compra con IA**: foto de la factura del proveedor → el modelo de visión extrae productos, cantidades y costos → vista previa (reutilizar la de la importación CSV) → crea/actualiza stock de golpe. Mismo backend que el punto anterior.

## Prioridad 4 — Pulido

- [ ] Modo oscuro (el sistema de diseño ya usa tokens; falta definir la paleta oscura y validarla).
- [ ] Página de estadísticas en la barra inferior (posible reemplazo de una pestaña actual).
- [ ] Deploy público (Cloudflare Pages / Vercel / VPS con el Docker existente) con dominio propio.
- [ ] Tests automatizados del flujo crítico (venta, fiado, sync) — hoy la verificación es manual con Playwright.

## Decisiones tomadas (no reabrir sin motivo)

- **Referencia de UX: Treinta** — botón central de venta, hub de módulos en hoja inferior, lenguaje simple de tendero (fiados, caja, vender).
- **Offline-first con Dexie + Supabase** como espejo en la nube; la fuente de verdad del día a día es el dispositivo.
- **Sistema de diseño sobrio** (ver [DISENO.md](DISENO.md)): un acento, color solo con significado, sin adornos.
