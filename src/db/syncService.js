import { supabase, isSupabaseConfigured } from './supabase';
import db from './database';

// Tables to sync
const SYNC_TABLES = ['productos', 'ventas', 'detalle_venta', 'clientes', 'fiados', 'pagos_fiado', 'gastos', 'caja_diaria', 'proveedores'];

/**
 * Push all unsynced local records to Supabase.
 * Marks them as synced (synced = 1) after successful upload.
 */
export async function pushToCloud() {
  if (!isSupabaseConfigured() || !navigator.onLine) return { pushed: 0 };

  let totalPushed = 0;

  for (const tableName of SYNC_TABLES) {
    try {
      const table = db[tableName];
      const unsynced = await table.filter((r) => !r.synced).toArray();

      if (unsynced.length === 0) continue;

      // Prepare records for Supabase (remove local-only fields, add local_id ref)
      const records = unsynced.map((r) => {
        const { id, synced, cloud_id, ...data } = r;
        return { ...data, local_id: id };
      });

      // Use insert (each unsynced record is only pushed once)
      const { error } = await supabase.from(tableName).insert(records);

      if (error) {
        console.error(`Error syncing ${tableName}:`, error.message);
        continue;
      }

      // Mark as synced locally
      for (const record of unsynced) {
        await table.update(record.id, { synced: 1 });
      }

      totalPushed += unsynced.length;
      console.log(`✅ ${tableName}: ${unsynced.length} registros sincronizados`);
    } catch (err) {
      console.error(`Error en sync de ${tableName}:`, err);
    }
  }

  return { pushed: totalPushed };
}

/**
 * Pull data from Supabase (for restoring on a new device).
 * Only pulls if local table is empty.
 */
export async function pullFromCloud() {
  if (!isSupabaseConfigured() || !navigator.onLine) return { pulled: 0 };

  let totalPulled = 0;

  for (const tableName of SYNC_TABLES) {
    try {
      const table = db[tableName];
      const localCount = await table.count();

      // Only pull if local table is empty (fresh device)
      if (localCount > 0) continue;

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });

      if (error || !data || data.length === 0) continue;

      // Insert pulled records locally
      for (const record of data) {
        const { id: cloudId, local_id, created_at, updated_at, ...rest } = record;
        await table.add({
          ...rest,
          cloud_id: cloudId,
          synced: 1,
        });
      }

      totalPulled += data.length;
      console.log(`📥 ${tableName}: ${data.length} registros descargados`);
    } catch (err) {
      console.error(`Error al descargar ${tableName}:`, err);
    }
  }

  return { pulled: totalPulled };
}

/**
 * Full sync: pull first (if fresh), then push.
 */
export async function syncAll() {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase no configurado' };
  }

  if (!navigator.onLine) {
    return { success: false, message: 'Sin conexión' };
  }

  try {
    const pullResult = await pullFromCloud();
    const pushResult = await pushToCloud();

    return {
      success: true,
      pulled: pullResult.pulled,
      pushed: pushResult.pushed,
      message: `Sincronizado: ${pushResult.pushed} subidos, ${pullResult.pulled} descargados`,
    };
  } catch (error) {
    console.error('Error en sincronización:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Check how many records are pending sync.
 */
export async function getPendingCount() {
  if (!isSupabaseConfigured()) return 0;

  let total = 0;
  for (const tableName of SYNC_TABLES) {
    try {
      const count = await db[tableName].filter((r) => !r.synced).count();
      total += count;
    } catch (e) {
      // ignore
    }
  }
  return total;
}
