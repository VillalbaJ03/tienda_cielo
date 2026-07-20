# Tienda Cielo ☁️

PWA de gestión para tiendas pequeñas: punto de venta, inventario, fiados (crédito a clientes), gastos, caja diaria y proveedores. Funciona **offline-first** con IndexedDB (Dexie) y se sincroniza con Supabase cuando hay conexión.

## Documentación

- [docs/AVANCES.md](docs/AVANCES.md) — bitácora de lo hecho
- [docs/ROADMAP.md](docs/ROADMAP.md) — visión y prioridades
- [docs/DISENO.md](docs/DISENO.md) — sistema de diseño (tokens, componentes, reglas)

## Stack

- **React 19** + **Vite** + **Tailwind CSS 4**
- **Dexie** (IndexedDB) como base de datos local offline
- **Supabase** (PostgreSQL + Realtime) como nube de sincronización
- **vite-plugin-pwa** (Workbox) para instalación y funcionamiento sin conexión

## Puesta en marcha

```bash
npm install
npm run dev
```

### Sincronización con Supabase (opcional)

Sin configurar Supabase la app funciona 100 % local. Para habilitar la nube:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ejecuta [`supabase-setup.sql`](supabase-setup.sql) en el SQL Editor del dashboard (crea tablas, columnas `updated_at`, triggers y habilita Realtime).
3. Copia `.env.example` a `.env` y completa tus credenciales:

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

> ⚠️ El SQL usa políticas RLS permisivas ("Allow all" con la anon key): cualquiera que tenga la URL y la key puede leer y escribir. Para producción, agrega Supabase Auth y políticas restrictivas.

## Docker

Para levantar la app sin instalar Node:

```bash
docker compose up -d --build
```

La app queda en [http://localhost:8080](http://localhost:8080). El build lee las variables `VITE_*` del `.env` en la raíz (si existe); como Vite las incrusta en el bundle, **hay que reconstruir la imagen** (`--build`) después de cambiarlas. Para detenerla: `docker compose down`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (genera el service worker) |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | ESLint |

## Cómo funciona la sincronización

- Cada escritura local marca el registro con `synced: 0` y dispara un push con debounce de 500 ms (`local-db-changed`).
- `pushToCloud` sube registros nuevos/modificados en orden de dependencias (padres antes que hijos) y mapea los IDs locales a IDs de la nube (`cloud_id`).
- `pullFromCloud` descarga cambios incrementales ordenados por `updated_at` (checkpoint por tabla en `localStorage`).
- Una suscripción Realtime aplica al instante los cambios hechos desde otros dispositivos o desde el bot.
- Fallback: sincronización completa cada 5 minutos y al recuperar la conexión.

## Estructura

```
src/
├── components/     # Layout, NavBar, menú
├── db/             # database.js (Dexie), syncService.js, supabase.js
├── hooks/          # useVentas, useInventario, useFiados, useSync
├── modules/        # dashboard, ventas, inventario, caja, fiados, gastos, proveedores
└── utils/          # formatters (moneda, fechas, categorías)
```
