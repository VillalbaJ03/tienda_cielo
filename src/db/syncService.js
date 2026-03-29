import { supabase, isSupabaseConfigured } from './supabase';
import db from './database';

// Order matters! Parents first so they get cloud_id before children are pushed.
const SYNC_TABLES = ['proveedores', 'productos', 'clientes', 'ventas', 'detalle_venta', 'fiados', 'pagos_fiado', 'gastos', 'caja_diaria', 'movimientos_clientes', 'registro_ganancias_bot'];

const FK_MAPPINGS = {
  productos: { proveedor_id: { cloud_col: 'proveedor_id', parent_table: 'proveedores' } },
  detalle_venta: { 
    venta_id: { cloud_col: 'venta_id', parent_table: 'ventas' },
    producto_id: { cloud_col: 'producto_id', parent_table: 'productos' }
  },
  fiados: { cliente_id: { cloud_col: 'cliente_id', parent_table: 'clientes' } },
  pagos_fiado: { fiado_id: { cloud_col: 'fiado_id', parent_table: 'fiados' } }
};

/**
 * Push all unsynced local records to Supabase.
 */
export async function pushToCloud() {
  console.log('[SYNC] Starting pushToCloud...');
  if (!isSupabaseConfigured() || !navigator.onLine) {
    console.log('[SYNC] pushToCloud Aborted: No config or offline.');
    return { pushed: 0 };
  }

  let totalPushed = 0;
  const errors = [];

  for (const tableName of SYNC_TABLES) {
    try {
      const table = db[tableName];
      const unsynced = await table.filter((r) => !r.synced).toArray();

      if (unsynced.length === 0) continue;

      const newRecords = [];
      const updatedRecords = [];

      for (const r of unsynced) {
        const { id, synced, cloud_id, isSyncing, ...data } = r;
        data.updated_at = new Date().toISOString();

        if (FK_MAPPINGS[tableName]) {
          for (const [localCol, mapping] of Object.entries(FK_MAPPINGS[tableName])) {
            const localVal = data[localCol];
            if (localVal) {
              const parentRecord = await db[mapping.parent_table].get(localVal);
              data[mapping.cloud_col] = parentRecord?.cloud_id || null;
            }
          }
        }

        if (cloud_id) {
          updatedRecords.push({ ...data, id: cloud_id, local_id: id });
        } else {
          newRecords.push({ ...data, local_id: id });
        }
      }

      // Push new
      if (newRecords.length > 0) {
        console.log(`[SYNC] Pushing ${newRecords.length} NEW records to ${tableName}:`, JSON.stringify(newRecords));
        const { data: inserted, error } = await supabase.from(tableName).insert(newRecords).select();
        if (error) {
          console.error(`[SYNC ERROR] failed to insert into ${tableName}:`, error);
          errors.push(`${tableName}: ${error.message}`);
          continue; // Seguir con la siguiente tabla, no abortar todo
        }
        for (const cloudRec of inserted) {
          if (cloudRec.id) {
             await table.update(cloudRec.local_id, { cloud_id: cloudRec.id, synced: 1 });
          }
        }
        totalPushed += newRecords.length;
      }

      // Push updates
      if (updatedRecords.length > 0) {
        console.log(`[SYNC] Pushing ${updatedRecords.length} UPDATED records to ${tableName}:`, JSON.stringify(updatedRecords));
        const { error } = await supabase.from(tableName).upsert(updatedRecords);
        if (error) {
          console.error(`[SYNC ERROR] failed to upsert into ${tableName}:`, error);
          errors.push(`${tableName}: ${error.message}`);
          continue;
        }
        for (const rec of updatedRecords) {
          await table.update(rec.local_id, { synced: 1 });
        }
        totalPushed += updatedRecords.length;
      }

      console.log(`✅ ${tableName}: ${unsynced.length} registros subidos`);
    } catch (err) {
      console.error(`Error en push de ${tableName}:`, err);
      errors.push(`${tableName}: ${err.message || JSON.stringify(err)}`);
      // Continuar con la siguiente tabla
    }
  }

  if (errors.length > 0) {
    return { pushed: totalPushed, error: errors.join(' | ') };
  }
  return { pushed: totalPushed };
}

/**
 * Pull data from Supabase updated since last sync.
 */
export async function pullFromCloud() {
  if (!isSupabaseConfigured() || !navigator.onLine) return { pulled: 0 };

  let totalPulled = 0;

  try {
    // Lanza todas las peticiones HTTP al mismo tiempo (Concurrencia masiva)
    const fetchPromises = SYNC_TABLES.map(async (tableName) => {
      const lastSyncKey = `sync_last_time_${tableName}`;
      const lastSyncTime = localStorage.getItem(lastSyncKey);
      
      const orderCol = ['movimientos_clientes', 'registro_ganancias_bot'].includes(tableName) ? 'created_at' : 'updated_at';
      
      let query = supabase.from(tableName).select('*').order(orderCol, { ascending: true });
      if (lastSyncTime) query = query.gt(orderCol, lastSyncTime);

      const { data, error } = await query;
      if (error) throw error;
      return { tableName, data, error, lastSyncKey, lastSyncTime, orderCol };
    });

    const responses = await Promise.all(fetchPromises);

    // Procesa las respuestas secuencialmente respetando las FK dependencies
    for (const tableName of SYNC_TABLES) {
      const response = responses.find(r => r.tableName === tableName);
      if (!response) continue;

      const { data, error, lastSyncKey, lastSyncTime, orderCol } = response;
      if (error) {
        console.error(`Error al descargar ${tableName}:`, error);
        continue;
      }
      if (!data || data.length === 0) continue;

      const table = db[tableName];
      let maxDate = lastSyncTime;

      for (const record of data) {
        const { id: cloudId, local_id, ...rest } = record;
        
        // Map cloud FKs back to local FKs
        if (FK_MAPPINGS[tableName]) {
          for (const [localCol, mapping] of Object.entries(FK_MAPPINGS[tableName])) {
            const cloudVal = rest[mapping.cloud_col];
            if (cloudVal) {
              const parentRecord = await db[mapping.parent_table].where('cloud_id').equals(cloudVal).first();
              if (parentRecord) {
                rest[localCol] = parentRecord.id;
              }
            }
          }
        }

        // Para tablas con UUID como PK, cloud_id es string; usar filter() para evitar mismatch de tipo
        const existing = await table.filter(r => String(r.cloud_id) === String(cloudId)).first();
        if (existing) {
          await table.update(existing.id, { ...rest, synced: 1, isSyncing: true });
        } else {
          const localRec = local_id ? await table.get(local_id).catch(() => null) : null;
          if (localRec && !localRec.cloud_id) {
            await table.update(local_id, { ...rest, cloud_id: cloudId, synced: 1, isSyncing: true });
          } else {
            await table.add({ ...rest, cloud_id: cloudId, synced: 1, isSyncing: true });
          }
        }

        const recordDate = record[orderCol];
        if (!maxDate || new Date(recordDate) > new Date(maxDate)) {
          maxDate = recordDate;
        }
      }

      if (maxDate) localStorage.setItem(lastSyncKey, maxDate);
      totalPulled += data.length;
      console.log(`📥 ${tableName}: ${data.length} registros descargados`);
    }
  } catch (err) {
    const detail = err?.message || err?.details || err?.hint || JSON.stringify(err);
    console.error('Error general en pullFromCloud:', detail, err);
  }

  return { pulled: totalPulled };
}

export async function syncAll() {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase no configurado' };
  if (!navigator.onLine) return { success: false, message: 'Sin conexión' };

  try {
    // Push primero asegura que los cambios locales lleguen a la nube en tiempo minimo
    const pushResult = await pushToCloud();
    if (pushResult.error) {
      return { success: false, message: `Error Subiendo: ${pushResult.error}` };
    }
    
    const pullResult = await pullFromCloud();

    if (pullResult.pulled > 0) {
      window.dispatchEvent(new Event('sync-completed'));
    }

    return {
      success: true,
      pulled: pullResult.pulled,
      pushed: pushResult.pushed,
      message: `Sincronizado: ${pushResult.pushed} subidos, ${pullResult.pulled} descargados`,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function getPendingCount() {
  if (!isSupabaseConfigured()) return 0;
  let total = 0;
  for (const tableName of SYNC_TABLES) {
    try {
      total += await db[tableName].filter((r) => !r.synced).count();
    } catch (e) {}
  }
  return total;
}

export function initRealtimeSubscription() {
  if (!isSupabaseConfigured()) return;
  if (window.__supabaseRealtimeChannel) return;

  const channel = supabase.channel('schema-db-changes');
  window.__supabaseRealtimeChannel = channel;

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public' },
    async (payload) => {
      console.log('🔄 Cambios detectados en Supabase:', payload);
      
      const { table: tableName, eventType, new: newRecord, old: oldRecord } = payload;
      if (!SYNC_TABLES.includes(tableName)) return;
      
      const table = db[tableName];

      try {
        if (eventType === 'INSERT') {
          const existing = await table.where('cloud_id').equals(newRecord.id).first();
          if (!existing) {
             const mappedRecord = { ...newRecord };
             if (FK_MAPPINGS[tableName]) {
               for (const [localCol, mapping] of Object.entries(FK_MAPPINGS[tableName])) {
                 const cloudVal = newRecord[mapping.cloud_col];
                 if (cloudVal) {
                   const parentRecord = await db[mapping.parent_table].where('cloud_id').equals(cloudVal).first();
                   if (parentRecord) mappedRecord[localCol] = parentRecord.id;
                 }
               }
             }

             if (mappedRecord.local_id) {
               const pendingLocal = await table.get(mappedRecord.local_id).catch(()=>null);
               if (pendingLocal && !pendingLocal.cloud_id) {
                 await table.update(mappedRecord.local_id, { ...mappedRecord, cloud_id: newRecord.id, synced: 1, isSyncing: true });
                 window.dispatchEvent(new Event('local-db-changed'));
                 return;
               }
             }

             const { id: cloudId, local_id, ...rest } = mappedRecord;
             await table.add({ ...rest, cloud_id: newRecord.id, synced: 1, isSyncing: true });
          }
        }
        else if (eventType === 'UPDATE') {
          const localRec = await table.where('cloud_id').equals(newRecord.id).first();
          if (localRec) {
             const mappedRecord = { ...newRecord };
             if (FK_MAPPINGS[tableName]) {
               for (const [localCol, mapping] of Object.entries(FK_MAPPINGS[tableName])) {
                 const cloudVal = newRecord[mapping.cloud_col];
                 if (cloudVal) {
                   const parentRecord = await db[mapping.parent_table].where('cloud_id').equals(cloudVal).first();
                   if (parentRecord) mappedRecord[localCol] = parentRecord.id;
                 }
               }
             }
             const { id: cloudId, local_id, ...rest } = mappedRecord;
             await table.update(localRec.id, { ...rest, synced: 1, isSyncing: true });
          }
        }
        else if (eventType === 'DELETE') {
          const localRec = await table.where('cloud_id').equals(oldRecord.id).first();
          if (localRec) {
             await table.delete(localRec.id);
          }
        }
        window.dispatchEvent(new Event('local-db-changed'));
        window.dispatchEvent(new Event('sync-completed'));
      } catch (err) {
        console.error('Error aplicando cambio Realtime en Dexie:', err);
      }
    }
  ).subscribe((status) => {
    console.log('📡 Realtime Status:', status);
  });
}
