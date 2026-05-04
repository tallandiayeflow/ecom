import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { History, RotateCcw, LogOut, ChevronDown, DollarSign } from 'lucide-react';
import { ProductSearch } from '../components/ProductSearch';
import { ProductGrid } from '../components/ProductGrid';
import { CartPanel } from '../components/CartPanel';
import { SessionBadge } from '../components/SessionBadge';
import { POSPayment, type PaymentData } from './POSPayment';
import { usePOS } from '../context/POSContext';
import type { POSProduct } from '../db/posDB';
import { savePendingTransaction, decrementCachedStock, generateOfflineTxnNumber } from '../db/posDB';
import { posAPI } from '../lib/posApi';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function POSMain() {
  const navigate = useNavigate();
  const { state, addToCart, removeFromCart, setQuantity, clearCart, setOnline, setPendingCount, cartSubtotal, cartTotal } = usePOS();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Start offline sync
  useOfflineSync();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'F2') { e.preventDefault(); if (state.cart.length > 0 && state.session) setPaymentOpen(true); }
      if (e.key === 'Delete') { e.preventDefault(); clearCart(); }
      if (e.key === 'F3') { e.preventDefault(); navigate('/pos/return'); }
      if (e.key === 'F4') { e.preventDefault(); navigate('/pos/history'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.cart, state.session, clearCart, navigate]);

  // Online/offline listener
  useEffect(() => {
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  const handleProductSelect = useCallback((product: POSProduct) => {
    addToCart(product);
  }, [addToCart]);

  const handleCheckout = useCallback(() => {
    if (state.cart.length === 0) return;
    if (!state.session) {
      toast.error('Aucune session ouverte');
      return;
    }
    setPaymentOpen(true);
  }, [state.cart, state.session]);

  const handlePaymentConfirm = useCallback(async (paymentData: PaymentData) => {
    const session = state.session!;
    const cart    = state.cart;
    const subtotal = cartSubtotal;
    const total    = cartTotal;

    const txnId = crypto.randomUUID();
    const txnNumber = state.isOnline
      ? undefined
      : generateOfflineTxnNumber(state.user?.name || 'CASH');

    const txnPayload = {
      id: txnId,
      sessionId: session.id,
      transactionNumber: txnNumber,
      items: cart.map(item => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        productBarcode: item.productBarcode,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discount: item.discount,
        lineTotal: item.lineTotal,
      })),
      subtotal,
      discount: 0,
      total,
      paymentMethod: paymentData.paymentMethod,
      cashTendered: paymentData.cashTendered,
      mobileTendered: paymentData.mobileTendered,
      mobileReference: paymentData.mobileReference || null,
      changeGiven: paymentData.changeGiven,
      customerName: paymentData.customerName || null,
      customerPhone: paymentData.customerPhone || null,
      clientCreatedAt: new Date().toISOString(),
      synced: state.isOnline,
    };

    if (state.isOnline) {
      try {
        const result = await posAPI.createTransaction(txnPayload);
        setLastTransaction(result.transaction);
        clearCart();
        setPaymentOpen(false);
        navigate('/pos/receipt', { state: { transaction: result.transaction, cart } });
      } catch (err: any) {
        toast.error(err.message || 'Erreur encaissement');
        throw err;
      }
    } else {
      // Offline path
      await savePendingTransaction({ ...txnPayload, synced: false } as any);
      for (const item of cart) {
        await decrementCachedStock(item.productId, item.quantity);
      }
      const pending = JSON.parse(localStorage.getItem('pos_pending_count') || '0');
      const newCount = pending + 1;
      localStorage.setItem('pos_pending_count', String(newCount));
      setPendingCount(newCount);

      setLastTransaction(txnPayload);
      clearCart();
      setPaymentOpen(false);
      navigate('/pos/receipt', { state: { transaction: txnPayload, cart, offline: true } });
    }
  }, [state, clearCart, navigate, setPendingCount]);

  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    navigate('/pos/login');
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-card px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.png" alt="NOOR" className="h-8 w-8 rounded-lg object-contain bg-white border" />
          <span className="font-bold text-sm hidden sm:block">NOOR POS</span>
        </div>

        <div className="flex-1" />

        <SessionBadge />

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pos/history')} title="Historique">
            <History className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/pos/return')} title="Retour">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/pos/close-session')} title="Fermer caisse">
            <DollarSign className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} title="Déconnexion">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col overflow-hidden border-r">
          <div className="p-3 border-b flex-shrink-0">
            <ProductSearch onProductSelect={handleProductSelect} />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ProductGrid onProductSelect={handleProductSelect} />
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-80 xl:w-96 flex-shrink-0 p-4 flex flex-col">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            Panier
            {state.cart.length > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                {state.cart.length}
              </span>
            )}
          </h2>
          <div className="flex-1 overflow-hidden">
            <CartPanel
              cart={state.cart}
              total={cartTotal}
              onQtyChange={setQuantity}
              onRemove={removeFromCart}
              onClear={clearCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <POSPayment
        open={paymentOpen}
        total={cartTotal}
        cart={state.cart}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
}
