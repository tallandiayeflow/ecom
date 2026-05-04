import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Printer, MessageSquare, ShoppingCart, WifiOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { printReceipt } from '../components/receiptPrinter';
import { posAPI } from '../lib/posApi';
import { usePOS } from '../context/POSContext';
import { sounds } from '../utils/sound';

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
  const [countdown, setCountdown] = useState(8);

  const { transaction, cart, offline } = (location.state || {}) as any;

  useEffect(() => {
    if (!transaction) return;
    sounds.success();
    // Auto-redirect after 8s
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); navigate('/pos/main'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center space-y-2"
        >
          <div className="relative mx-auto w-20 h-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto"
            >
              <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>

          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">Vente enregistrée !</h1>
            {transaction.customerName && (
              <p className="text-sm text-muted-foreground mt-1">Merci, {transaction.customerName}</p>
            )}
            {offline && (
              <Badge variant="outline" className="gap-1 mt-2">
                <WifiOff className="w-3 h-3" /> Hors ligne — sera synchronisé
              </Badge>
            )}
          </motion.div>
        </motion.div>

        {/* Receipt card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-lg border-green-200/50 dark:border-green-800/30">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-center text-muted-foreground">
                {transaction.transactionNumber || transaction.transaction_number}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="flex-1 truncate text-muted-foreground">
                      {item.productName} <span className="text-foreground font-medium">× {item.quantity}</span>
                    </span>
                    <span className="font-medium ml-2 tabular-nums">{item.lineTotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span className="tabular-nums">{transaction.total.toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Paiement</span>
                  <span>{METHOD_LABELS[transaction.paymentMethod] || transaction.paymentMethod}</span>
                </div>
                {transaction.changeGiven > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Monnaie rendue</span>
                    <span className="tabular-nums">{transaction.changeGiven.toLocaleString()} XOF</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-1.5 h-10" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> Imprimer
            </Button>
            {transaction.customerPhone && !offline ? (
              <Button variant="outline" className="gap-1.5 h-10" onClick={handleSendSMS} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                SMS
              </Button>
            ) : (
              <div />
            )}
          </div>

          <Button
            className="w-full h-12 gap-2 font-semibold"
            onClick={() => navigate('/pos/main')}
          >
            <ShoppingCart className="w-4 h-4" />
            Nouvelle vente
            <span className="ml-auto text-xs opacity-60 tabular-nums">{countdown}s</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
