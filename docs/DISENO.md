# Sistema de diseño

Reglas visuales de Tienda Cielo. Todo vive en `src/index.css` como clases reutilizables; los módulos no deberían inventar estilos nuevos. **Referencia de UX: Treinta** (app para tiendas de barrio) — simple, directa, usable con una mano.

## Principios

1. **Un solo acento.** Esmeralda `#047857` para acciones primarias y estado activo. Nada de arcoíris decorativo.
2. **El color comunica significado, no decora.** Rojo = negativo/peligro, ámbar = advertencia, verde = positivo/activo. Un icono no lleva color "porque se ve bonito".
3. **El dinero siempre en números tabulares** (clase `.num` o componentes que ya la incluyen), alineado a la derecha en listas.
4. **Prohibido**: emojis en la UI, degradados, animaciones escalonadas, iconos en cajitas pastel multicolor, MAYÚSCULAS con tracking, pesos tipográficos > 700.
5. **Superficies planas**: borde fino `#e4e4e7`, radio 12px en tarjetas / 8px en controles, sombra casi nula.

## Tokens (en `@theme`)

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#f4f4f5` | Fondo de página |
| `--color-surface` | `#ffffff` | Tarjetas, barras, modales |
| `--color-border` / `-strong` | `#e4e4e7` / `#d4d4d8` | Bordes / bordes de inputs |
| `--color-ink` … `-4` | `#18181b` → `#a1a1aa` | Texto: primario → tenue |
| `--color-accent` / `-strong` / `-soft` | `#047857` / `#065f46` / `#ecfdf5` | Acento, hover, fondos suaves |
| `--color-danger` / `-soft` | `#b91c1c` / `#fef2f2` | Negativo/destructivo |
| `--color-warning` / `-soft` | `#b45309` / `#fffbeb` | Advertencias (stock bajo) |

Tipografía: **Inter variable 400–700** (Google Fonts). Título de página 20px/600, cuerpo 14px, metadatos 12px, número héroe 30px/650.

## Componentes (clases)

- **Estructura**: `.app-header` (marca + `.sync-chip`), `.page`, `.page-header`, `.section` + `.section-header`.
- **Contenido**: `.card` (+ `.card-pad`), `.list-row` + `.row-title` / `.row-meta` / `.row-amount`, `.stat-tile` + `.stat-label` / `.stat-value` / `.stat-hero`.
- **Controles**: `.btn` (`-primary`, `-secondary`, `-danger`, `-ghost`, `-sm`, `-block`), `.icon-btn`, `.input` (+ `.input-amount` para montos), `.label`, `.field`, `.seg` + `.seg-item` (pestañas segmentadas), `.stepper` (cantidad).
- **Feedback**: `.badge` (`-neutral`, `-success`, `-warning`, `-danger`), `.notice` (ídem), `.empty-state`.
- **Navegación**: `.navbar` con `.nav-item` (píldora `.nav-icon` en activo) y `.nav-action` (botón central circular de Vender); hoja "Más" con `.module-grid` + `.module-tile`.
- **Modales**: `.modal-overlay` + `.modal-content` (hoja inferior con asa), `.modal-header` + `.modal-title`.

## Patrones

- **Pestañas** → control segmentado `.seg`, nunca botones sueltos.
- **Formularios** → dentro de `.card card-pad`; labels en sentence case; montos con `.input-amount` (sin flechitas de número).
- **Listas de dinero** → `.list-row` con `.row-amount` a la derecha; el signo negativo se escribe `−` (U+2212) antes del formato de moneda.
- **KPI** → una tarjeta con número héroe + fila de secundarios, no cuatro tarjetas de colores.
- **Verificación visual** → cualquier cambio de UI se comprueba con capturas reales (Playwright + Edge headless, ver `AVANCES.md`).
