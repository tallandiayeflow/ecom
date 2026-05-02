import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Printer, MessageSquare, ShoppingCart, CheckCircle, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { printReceipt } from '../components/receiptPrinter';
import { posAPI } from '../lib/posApi';
import { usePOS } from '../context/POSContext';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  mixed: 'Mixte',
};

export default function POSReceipt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = usePOS();
  const [sending, setSending] = useState(false);

  const { transaction, cart, offline } = (location.state || {}) as any;

  if (!transaction) {
    navigate('/pos/main');
    return null;
  }

  const items = transaction.items || cart?.map((i: any) => ({
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    lineTotal: i.lineTotal,
  })) || [];

  const handlePrint = () => {
    printReceipt({
      transactionNumber: transaction.transactionNumber || transaction.transaction_number,
      cashierName: state.user?.name || '',
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      items,
      subtotal: transaction.subtotal,
      discount: transaction.discount || 0,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      cashTendered: transaction.cashTendered || 0,
      changeGiven: transaction.changeGiven || 0,
      createdAt: transaction.clientCreatedAt || transaction.createdAt || new Date().toISOString(),
      offline,
    });
  };

  const handleSendSMS = async () => {
    if (!transaction.id) { toast.error('ID transaction manquant'); return; }
    setSending(true);
    try {
      await posAPI.sendReceipt(transaction.id);
      toast.success('Reçu envoyé par SMS');
    } catch (err: any) {
      toast.error(err.message || 'Erreur envoi SMS');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Success header */}
        <div className="text-center space-y-2">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Vente enregistrée !</h1>
          {offline && (
            <Badge variant="outline" className="gap-1">
              <WifiOff className="w-3 h-3" /> Hors ligne — sera synchronisé
            </Badge>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-sm text-center">
              {transaction.transactionNumber || transaction.transaction_number}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Items */}
            <div className="space-y-1">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="flex-1 truncate">{item.productName} × {item.quantity}</span>
                  <span className="font-medium ml-2">{item.lineTotal.toLocaleString()} XOF</span>
                </div>
              ))}
            </div>

            <Separator />

            {transaction.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Remise</span>
                <span>-{transaction.discount.toLocaleString()} XOF</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{transaction.total.toLocaleString()} XOF</span>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Paiement</span>
                <span>{METHOD_LABELS[transaction.paymentMethod] || transaction.paymentMethod}</span>
              </div>
              {transaction.changeGiven > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Monnaie rendue</span>
                  <span>{transaction.changeGiven.toLocaleString()} XOF</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Imprimer le reçu
          </Button>
          {transaction.customerPhone && !offline && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleSendSMS}
              disabled={sending}
            >
              <MessageSquare className="w-4 h-4" />
              {sending ? 'Envoi...' : 'Envoyer par SMS'}
            </Button>
          )}
          <Button className="w-full h-12 gap-2" onClick={() => navigate('/pos/main')}>
            <ShoppingCart className="w-4 h-4" /> Nouvelle vente
          </Button>
        </div>
      </div>
    </div>
  );
}
