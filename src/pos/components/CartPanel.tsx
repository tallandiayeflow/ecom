import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem } from '../context/POSContext';

interface Props {
  cart: CartItem[];
  total: number;
  onQtyChange: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartPanel({ cart, total, onQtyChange, onRemove, onClear, onCheckout }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const startEdit = (item: CartItem) => {
    setEditingId(item.productId);
    setEditVal(String(item.quantity));
  };

  const commitEdit = (productId: string) => {
    const qty = parseInt(editVal);
    if (!isNaN(qty) && qty >= 0) onQtyChange(productId, qty);
    setEditingId(null);
  };

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <ShoppingCart className="w-14 h-14 opacity-20" />
        <div className="text-center">
          <p className="text-sm font-medium">Panier vide</p>
          <p className="text-xs opacity-70 mt-1">Cliquer sur un produit pour ajouter</p>
        </div>
        <div className="text-xs opacity-50 text-center mt-2 space-y-0.5">
          <p>F2 → Encaisser</p>
          <p>Suppr → Vider panier</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        <AnimatePresence initial={false}>
          {cart.map(item => (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-muted/40 border border-border/50 rounded-lg p-2.5"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  {item.image && (
                    <img src={item.image} alt={item.productName} className="w-8 h-8 rounded object-cover float-left mr-2 mb-1 border" />
                  )}
                  <p className="text-xs font-medium leading-tight">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.unitPrice.toLocaleString()} XOF / unité</p>
                </div>
                <button
                  onClick={() => onRemove(item.productId)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 mt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => onQtyChange(item.productId, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>

                  {editingId === item.productId ? (
                    <Input
                      className="h-7 w-12 text-center text-sm font-bold p-0"
                      value={editVal}
                      autoFocus
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={() => commitEdit(item.productId)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(item.productId); if (e.key === 'Escape') setEditingId(null); }}
                    />
                  ) : (
                    <button
                      className="h-7 w-10 text-center text-sm font-bold bg-background border rounded-lg hover:bg-accent transition-colors"
                      onClick={() => startEdit(item)}
                      title="Cliquer pour modifier la quantité"
                    >
                      {item.quantity}
                    </button>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => onQtyChange(item.productId, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <p className="font-bold text-sm tabular-nums">
                  {item.lineTotal.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">XOF</span>
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {cart.reduce((s, i) => s + i.quantity, 0)} article{cart.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold tabular-nums">{total.toLocaleString()}</span>
            <span className="text-sm font-medium text-muted-foreground ml-1">XOF</span>
          </div>
        </div>

        <Button
          className="w-full h-14 text-base font-bold shadow-lg gap-2"
          onClick={onCheckout}
        >
          <ShoppingCart className="w-5 h-5" />
          Encaisser
          <span className="ml-auto text-xs font-normal opacity-70">F2</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-destructive"
          onClick={onClear}
        >
          Vider le panier
        </Button>
      </div>
    </div>
  );
}
