import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { NumPad } from '../components/NumPad';
import type { CartItem } from '../context/POSContext';

interface Props {
  open: boolean;
  total: number;
  cart: CartItem[];
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => Promise<void>;
}

export interface PaymentData {
  paymentMethod: 'cash' | 'wave' | 'orange_money' | 'mixed';
  cashTendered: number;
  mobileTendered: number;
  mobileReference: string;
  changeGiven: number;
  customerName: string;
  customerPhone: string;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

function getQuickAmounts(total: number): number[] {
  // Include the exact total + common denominations above it
  const rounded = [500, 1000, 2000, 5000, 10000, 20000, 50000];
  const above = rounded.filter(a => a >= total).slice(0, 4);
  return [total, ...above].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 5);
}

export function POSPayment({ open, total, cart, onClose, onConfirm }: Props) {
  const [tab, setTab] = useState<'cash' | 'wave' | 'orange_money' | 'mixed'>('cash');
  const [cashInput, setCashInput] = useState(String(total));
  const [mobileRef, setMobileRef] = useState('');
  const [mobileAmount, setMobileAmount] = useState(String(total));
  const [cashPart, setCashPart] = useState('0');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setCashInput(String(total));
      setMobileAmount(String(total));
      setCashPart('0');
      setMobileRef('');
      setCustomerName('');
      setCustomerPhone('');
      setTab('cash');
    }
  }, [open, total]);

  // Keyboard: Enter to confirm, Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) handleConfirm();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, loading, tab, cashInput, mobileRef, cashPart, mobileAmount]);

  const cashTendered = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashTendered - total);
  const canConfirmCash = cashTendered >= total;

  const quickAmounts = getQuickAmounts(total);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      let paymentData: PaymentData;
      if (tab === 'cash') {
        paymentData = {
          paymentMethod: 'cash', cashTendered, mobileTendered: 0,
          mobileReference: '', changeGiven: change, customerName, customerPhone,
        };
      } else if (tab === 'wave' || tab === 'orange_money') {
        paymentData = {
          paymentMethod: tab, cashTendered: 0, mobileTendered: total,
          mobileReference: mobileRef, changeGiven: 0, customerName, customerPhone,
        };
      } else {
        const cashAmt = parseFloat(cashPart) || 0;
        const mobileAmt = parseFloat(mobileAmount) || 0;
        paymentData = {
          paymentMethod: 'mixed', cashTendered: cashAmt, mobileTendered: mobileAmt,
          mobileReference: mobileRef, changeGiven: Math.max(0, cashAmt + mobileAmt - total),
          customerName, customerPhone,
        };
      }
      await onConfirm(paymentData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b bg-muted/30">
          <DialogTitle className="text-lg flex items-center justify-between">
            <span>Encaissement</span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {total.toLocaleString()} XOF
            </span>
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{cart.reduce((s, i) => s + i.quantity, 0)} article{cart.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{cart.length} référence{cart.length > 1 ? 's' : ''}</span>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Nom client (opt.)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              placeholder="Téléphone (opt.)"
              inputMode="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Payment tabs */}
          <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
            <TabsList className="w-full grid grid-cols-4 h-9">
              <TabsTrigger value="cash" className="text-xs">💵 Espèces</TabsTrigger>
              <TabsTrigger value="wave" className="text-xs">🔵 Wave</TabsTrigger>
              <TabsTrigger value="orange_money" className="text-xs">🟠 OM</TabsTrigger>
              <TabsTrigger value="mixed" className="text-xs">⚡ Mixte</TabsTrigger>
            </TabsList>

            {/* CASH */}
            <TabsContent value="cash" className="space-y-3 mt-3">
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground mb-1">Montant reçu</p>
                <p className="text-4xl font-bold tabular-nums text-foreground">
                  {parseFloat(cashInput || '0').toLocaleString()}
                  <span className="text-lg font-normal text-muted-foreground ml-1">XOF</span>
                </p>
              </div>
              <NumPad value={cashInput} onChange={setCashInput} quickAmounts={quickAmounts} />
              <div className={`rounded-xl p-3 text-center transition-all ${canConfirmCash ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted'}`}>
                <p className="text-xs text-muted-foreground">Monnaie à rendre</p>
                <p className={`text-3xl font-bold tabular-nums ${canConfirmCash ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {change.toLocaleString()} XOF
                </p>
              </div>
            </TabsContent>

            {/* WAVE */}
            <TabsContent value="wave" className="space-y-3 mt-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Montant Wave</p>
                <p className="text-4xl font-bold text-blue-600 tabular-nums">{total.toLocaleString()} XOF</p>
              </div>
              <Input
                placeholder="Référence Wave (optionnel)"
                value={mobileRef}
                onChange={e => setMobileRef(e.target.value)}
              />
            </TabsContent>

            {/* ORANGE MONEY */}
            <TabsContent value="orange_money" className="space-y-3 mt-3">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Montant Orange Money</p>
                <p className="text-4xl font-bold text-orange-600 tabular-nums">{total.toLocaleString()} XOF</p>
              </div>
              <Input
                placeholder="Référence OM (optionnel)"
                value={mobileRef}
                onChange={e => setMobileRef(e.target.value)}
              />
            </TabsContent>

            {/* MIXED */}
            <TabsContent value="mixed" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">💵 Espèces (XOF)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={cashPart}
                    onChange={e => setCashPart(e.target.value)}
                    className="text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">📱 Mobile (XOF)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={mobileAmount}
                    onChange={e => setMobileAmount(e.target.value)}
                    className="text-center font-bold"
                  />
                </div>
              </div>
              <Input
                placeholder="Référence mobile (optionnel)"
                value={mobileRef}
                onChange={e => setMobileRef(e.target.value)}
              />
              {(() => {
                const sum = (parseFloat(cashPart) || 0) + (parseFloat(mobileAmount) || 0);
                return (
                  <div className={`rounded-lg p-2 text-center text-sm ${sum >= total ? 'bg-green-50 dark:bg-green-900/20 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                    Total: {sum.toLocaleString()} XOF {sum < total ? `(manque ${(total - sum).toLocaleString()})` : `(rendu: ${(sum - total).toLocaleString()})`}
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              className="flex-1 h-11 font-bold gap-2"
              onClick={handleConfirm}
              disabled={loading || (tab === 'cash' && !canConfirmCash)}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />
              }
              Valider
              <span className="text-xs font-normal opacity-70 ml-auto">↵ Enter</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
