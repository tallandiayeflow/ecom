import { useEffect } from 'react';
import { toast } from 'sonner';
import { flushSyncQueue } from '../sync/syncQueue';
import { usePOS } from '../context/POSContext';
import { getPendingTransactions } from '../db/posDB';

export function useOfflineSync() {
  const { setOnline, setPendingCount } = usePOS();

  useEffect(() => {
    // Update pending count on mount
    getPendingTransactions().then(p => {
      setPendingCount(p.length);
      localStorage.setItem('pos_pending_count', String(p.length));
    });

    const handleOnline = async () => {
      setOnline(true);
      const pending = await getPendingTransactions();
      if (pending.length === 0) return;

      toast.info(`Synchronisation de ${pending.length} vente(s) hors ligne...`);
      try {
        const { synced, failed } = await flushSyncQueue();
        const remaining = await getPendingTransactions();
        setPendingCount(remaining.length);
        if (synced > 0) toast.success(`${synced} vente(s) synchronisée(s)`);
        if (failed > 0) toast.error(`${failed} vente(s) en échec`);
      } catch {
        toast.error('Échec de la synchronisation');
      }
    };

    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, setPendingCount]);
}
