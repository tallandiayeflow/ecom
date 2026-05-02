import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { posAPI } from '../lib/posApi';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  mixed: 'Mixte',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  completed: 'default',
  refunded: 'destructive',
  partially_refunded: 'secondary',
  voided: 'destructive',
};

export default function POSHistory() {
  const navigate = useNavigate();
  const { state } = usePOS();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const sessionId = state.session?.id;
      const data = await posAPI.listTransactions(sessionId);
      setTransactions(data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTransactions(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pos/main')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-lg flex-1">Historique des ventes</h1>
        <Button variant="ghost" size="icon" onClick={loadTransactions}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Aucune vente pour cette session</p>
        ) : (
          transactions.map(txn => (
            <Card key={txn.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold">{txn.transactionNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {txn.customerName || 'Client anonyme'}
                      {txn.customerPhone ? ` — ${txn.customerPhone}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(txn.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-lg">{txn.total.toLocaleString()} XOF</p>
                    <Badge variant={STATUS_VARIANTS[txn.status] || 'default'} className="text-xs">
                      {txn.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{METHOD_LABELS[txn.paymentMethod] || txn.paymentMethod}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
