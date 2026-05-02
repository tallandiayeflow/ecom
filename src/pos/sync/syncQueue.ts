import { getPendingTransactions, clearSyncedTransactions, addSyncLog } from '../db/posDB';
import { posAPI } from '../lib/posApi';

export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingTransactions();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const syncedIds: string[] = [];

  try {
    const result = await posAPI.batchSync(pending);
    for (const r of result.results || []) {
      if (r.status === 'synced' || r.status === 'already_synced') {
        syncedIds.push(r.id);
        synced++;
      } else {
        failed++;
      }
    }
    await clearSyncedTransactions(syncedIds);
  } catch (err) {
    failed = pending.length;
    await addSyncLog({
      ts: new Date().toISOString(),
      status: 'error',
      count: 0,
      detail: String(err),
    });
    return { synced: 0, failed };
  }

  await addSyncLog({
    ts: new Date().toISOString(),
    status: 'ok',
    count: synced,
    detail: failed > 0 ? `${failed} echecs` : undefined,
  });

  // Update local pending count
  const remaining = await getPendingTransactions();
  localStorage.setItem('pos_pending_count', String(remaining.length));

  return { synced, failed };
}
