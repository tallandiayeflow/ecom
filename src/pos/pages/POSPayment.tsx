import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
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

export function POSPayment({ open, total, cart, onClose, onConfirm }: Props) {
  const [tab, setTab] = useState<'cash' | 'wave' | 'orange_money' | 'mixed'>('cash');
  const [cashInput, setCashInput] = useState(String(total));
  const [mobileRef, setMobileRef] = useState('');
  const [mobileAmount, setMobileAmount] = useState(String(total));
  const [cashPart, setCashPart] = useState('0');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const cashTendered = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashTendered - total);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      let paymentData: PaymentData;

      if (tab === 'cash') {
        paymentData = {
          paymentMethod: 'cash',
          cashTendered,
          mobileTendered: 0,
          mobileReference: '',
          changeGiven: change,
          customerName,
          customerPhone,
        };
      } else if (tab === 'wave' || tab === 'orange_money') {
        paymentData = {
          paymentMethod: tab,
          cashTendered: 0,
          mobileTendered: total,
          mobileReference: mobileRef,
          changeGiven: 0,
          customerName,
          customerPhone,
        };
      } else {
        // mixed
        const cashAmt = parseFloat(cashPart) || 0;
        const mobileAmt = parseFloat(mobileAmount) || 0;
        paymentData = {
          paymentMethod: 'mixed',
          cashTendered: cashAmt,
          mobileTendered: mobileAmt,
          mobileReference: mobileRef,
          changeGiven: Math.max(0, cashAmt + mobileAmt - total),
          customerName,
          customerPhone,
        };
      }

      await onConfirm(paymentData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Encaissement — <span className="text-primary">{total.toLocaleString()} XOF</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Nom client (opt.)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            <Input
              placeholder="Téléphone (opt.)"
              inputMode="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>

          {/* Payment method tabs */}
          <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="cash">Espèces</TabsTrigger>
              <TabsTrigger value="wave">Wave</TabsTrigger>
              <TabsTrigger value="orange_money">OM</TabsTrigger>
              <TabsTrigger value="mixed">Mixte</TabsTrigger>
            </TabsList>

            <TabsContent value="cash" className="space-y-3 pt-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Montant reçu (XOF)</p>
                <p className="text-3xl font-bold">{parseFloat(cashInput || '0').toLocaleString()}</p>
              </div>
              <NumPad value={cashInput} onChange={setCashInput} />
              {cashTendered >= total && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Monnaie à rendre</p>
                  <p className="text-2xl font-bold text-green-600">{change.toLocaleString()} XOF</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="wave" className="space-y-3 pt-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Montant Wave</p>
                <p className="text-3xl font-bold text-blue-600">{total.toLocaleString()} XOF</p>
              </div>
              <Input
                placeholder="Référence Wave (opt.)"
                value={mobileRef}
                onChange={e => setMobileRef(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="orange_money" className="space-y-3 pt-2">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Montant Orange Money</p>
                <p className="text-3xl font-bold text-orange-600">{total.toLocaleString()} XOF</p>
              </div>
              <Input
                placeholder="Référence OM (opt.)"
                value={mobileRef}
                onChange={e => setMobileRef(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="mixed" className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Espèces (XOF)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={cashPart}
                    onChange={e => setCashPart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Mobile (XOF)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={mobileAmount}
                    onChange={e => setMobileAmount(e.target.value)}
                  />
                </div>
              </div>
              <Input
                placeholder="Référence mobile (opt.)"
                value={mobileRef}
                onChange={e => setMobileRef(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button className="flex-1 h-12 font-bold" onClick={handleConfirm} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Valider
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
