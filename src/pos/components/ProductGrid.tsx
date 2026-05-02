import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { POSProduct } from '../db/posDB';
import { posAPI } from '../lib/posApi';
import { getCachedProducts, cacheProducts } from '../db/posDB';
import { usePOS } from '../context/POSContext';

interface Props {
  onProductSelect: (product: POSProduct) => void;
}

export function ProductGrid({ onProductSelect }: Props) {
  const { state } = usePOS();
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (state.isOnline) {
          const data = await posAPI.getProducts();
          if (mounted) {
            setProducts(data);
            await cacheProducts(data);
          }
        } else {
          const cached = await getCachedProducts();
          if (mounted) setProducts(cached);
        }
      } catch {
        const cached = await getCachedProducts();
        if (mounted) setProducts(cached);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [state.isOnline]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map(product => (
        <button
          key={product.id}
          onClick={() => onProductSelect(product)}
          disabled={product.stock === 0}
          className="group flex flex-col bg-card border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="aspect-square bg-muted overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-3xl font-bold">
                {product.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="p-2 flex-1 flex flex-col justify-between">
            <p className="text-xs font-medium line-clamp-2 mb-1">{product.name}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-primary">{product.price.toLocaleString()}</p>
              <Badge
                variant={product.stock > 5 ? 'secondary' : product.stock > 0 ? 'outline' : 'destructive'}
                className="text-[10px] px-1"
              >
                {product.stock}
              </Badge>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
