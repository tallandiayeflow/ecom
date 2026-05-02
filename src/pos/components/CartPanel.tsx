import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
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
  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <ShoppingCart className="w-12 h-12 opacity-30" />
        <p className="text-sm">Panier vide</p>
        <p className="text-xs">Cliquer sur un produit pour ajouter</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Items */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {cart.map(item => (
          <div key={item.productId} className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium leading-tight flex-1">{item.productName}</p>
              <button onClick={() => onRemove(item.productId)} className="text-destructive hover:opacity-70 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onQtyChange(item.productId, item.quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Badge variant="secondary" className="w-10 justify-center text-sm font-bold">
                  {item.quantity}
                </Badge>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onQtyChange(item.productId, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <p className="font-semibold text-sm">{item.lineTotal.toLocaleString()} <span className="text-xs text-muted-foreground">XOF</span></p>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-3" />

      {/* Total */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">{cart.length} article{cart.length > 1 ? 's' : ''}</span>
          <span className="text-2xl font-bold">{total.toLocaleString()} <span className="text-base font-medium">XOF</span></span>
        </div>

        <Button
          className="w-full h-14 text-lg font-bold shadow-lg"
          onClick={onCheckout}
        >
          Encaisser
        </Button>
        <Button
          variant="outline"
          className="w-full h-10"
          onClick={onClear}
        >
          Vider le panier
        </Button>
      </div>
    </div>
  );
}
