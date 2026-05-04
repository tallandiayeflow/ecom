import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { POSProduct } from '../db/posDB';
import { posAPI } from '../lib/posApi';
import { getCachedProducts, cacheProducts } from '../db/posDB';
import { usePOS } from '../context/POSContext';
import { sounds } from '../utils/sound';

interface Props {
  onProductSelect: (product: POSProduct) => void;
}

export function ProductGrid({ onProductSelect }: Props) {
  const { state } = usePOS();
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (state.isOnline) {
          const data = await posAPI.getProducts();
          if (mounted) { setProducts(data); await cacheProducts(data); }
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

  const handleSelect = (product: POSProduct) => {
    if (product.stock === 0) return;
    sounds.addItem();
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 400);
    onProductSelect(product);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
        <p className="text-sm">Aucun produit disponible</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      <AnimatePresence>
        {products.map(product => {
          const outOfStock = product.stock === 0;
          const lowStock = product.stock > 0 && product.stock <= 3;
          const isAdded = addedId === product.id;

          return (
            <motion.button
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: isAdded ? 1.04 : 1 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleSelect(product)}
              disabled={outOfStock}
              className={`group flex flex-col bg-card border rounded-xl overflow-hidden text-left transition-all
                ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-primary/60 active:scale-95 cursor-pointer'}
                ${isAdded ? 'border-primary shadow-md shadow-primary/20' : ''}
              `}
            >
              <div className="relative aspect-square bg-muted overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-3xl font-bold bg-gradient-to-br from-muted to-muted/50">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="absolute top-1.5 right-1.5">
                  {outOfStock ? (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0">Rupture</Badge>
                  ) : lowStock ? (
                    <Badge className="text-[9px] px-1 py-0 bg-orange-500 hover:bg-orange-500">{product.stock} restants</Badge>
                  ) : null}
                </div>

                {!outOfStock && (
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2 flex flex-col gap-1">
                <p className="text-xs font-medium line-clamp-2 leading-tight">{product.name}</p>
                <p className="text-sm font-bold text-primary">
                  {product.price.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">XOF</span>
                </p>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
