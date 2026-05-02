import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Search, RotateCcw } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { posAPI } from '../lib/posApi';

interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  maxQuantity: number;
  unitPrice: number;
  quantityReturned: number;
}

export default function POSReturn() {
  const navigate = useNavigate();
  const { state } = usePOS();
  const [txnNumber, setTxnNumber] = useState('');
  const [transaction, setTransaction] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'wave' | 'orange_money'>('cash');
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchTransaction = async () => {
    if (!txnNumber.trim()) return;
    setSearching(true);
    try {
      // Search by transaction number — list transactions and find match
      const txns = await posAPI.listTransactions();
      const found = txns.find((t: any) => t.transactionNumber === txnNumber.trim());
      if (!found) { toast.error('Transaction introuvable'); return; }

      const detail = await posAPI.getTransaction(found.id);
      setTransaction(detail.transaction || detail);

      const items = detail.items || [];
      setReturnItems(items.map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        maxQuantity: i.quantity,
        unitPrice: i.unitPrice,
        quantityReturned: 0,
      })));
    } catch (err: any) {
      toast.error(err.message || 'Erreur recherche');
    } finally {
      setSearching(false);
    }
  };

  const handleQtyChange = (productId: string, qty: number) => {
    setReturnItems(prev => prev.map(i =>
      i.productId === productId
        ? { ...i, quantityReturned: Math.min(Math.max(0, qty), i.maxQuantity) }
        : i
    ));
  };

  const totalRefunded = returnItems.reduce(
    (acc, i) => acc + i.unitPrice * i.quantityReturned, 0
  );
  const hasItems = returnItems.some(i => i.quantityReturned > 0);

  const handleSubmit = async () => {
    if (!hasItems) { toast.error('Sélectionnez au moins un article'); return; }
    if (!state.session) { toast.error('Aucune session ouverte'); return; }
    setSubmitting(true);
    try {
      await posAPI.createReturn({
        originalTransactionId: transaction.id,
        sessionId: state.session.id,
        refundMethod,
        reason,
        items: returnItems
          .filter(i => i.quantityReturned > 0)
          .map(i => ({
            productId: i.productId,
            quantityReturned: i.quantityReturned,
          })),
      });
      toast.success('Retour enregistré');
      navigate('/pos/main');
    } catch (err: any) {
      toast.error(err.message || 'Erreur retour');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pos/main')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-lg">Retour / Remboursement</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Search */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <label className="text-sm font-medium">Numéro de transaction</label>
            <div className="flex gap-2">
              <Input
                placeholder="POS-20260501-TALL-0001"
                value={txnNumber}
                onChange={e => setTxnNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchTransaction()}
              />
              <Button onClick={searchTransaction} disabled={searching} className="flex-shrink-0">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {transaction && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {transaction.transactionNumber}
                  <Badge className="ml-2" variant="secondary">{transaction.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {returnItems.map(item => (
                  <div key={item.productId} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.unitPrice.toLocaleString()} XOF × max {item.maxQuantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => handleQtyChange(item.productId, item.quantityReturned - 1)}
                      >-</Button>
                      <span className="w-8 text-center font-bold">{item.quantityReturned}</span>
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => handleQtyChange(item.productId, item.quantityReturned + 1)}
                        disabled={item.quantityReturned >= item.maxQuantity}
                      >+</Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between font-bold">
                  <span>À rembourser</span>
                  <span className="text-red-600">{totalRefunded.toLocaleString()} XOF</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mode de remboursement</label>
                  <div className="flex gap-2">
                    {(['cash', 'wave', 'orange_money'] as const).map(m => (
                      <Button
                        key={m}
                        variant={refundMethod === m ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRefundMethod(m)}
                      >
                        {m === 'cash' ? 'Espèces' : m === 'wave' ? 'Wave' : 'OM'}
                      </Button>
                    ))}
                  </div>
                </div>

                <Input
                  placeholder="Motif du retour (optionnel)"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />

                <Button
                  className="w-full h-12 gap-2"
                  onClick={handleSubmit}
                  disabled={!hasItems || submitting}
                >
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RotateCcw className="w-4 h-4" />
                  }
                  Confirmer le retour
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
