import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { posAPI } from '../lib/posApi';
import { getCachedProducts, getCachedProductByBarcode } from '../db/posDB';
import type { POSProduct } from '../db/posDB';
import { usePOS } from '../context/POSContext';
import { useBarcode } from '../hooks/useBarcode';

interface Props {
  onProductSelect: (product: POSProduct) => void;
}

export function ProductSearch({ onProductSelect }: Props) {
  const { state } = usePOS();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      if (state.isOnline) {
        const data = await posAPI.getProducts(q);
        setResults(data);
      } else {
        const all = await getCachedProducts();
        const lower = q.toLowerCase();
        setResults(all.filter(p =>
          p.name.toLowerCase().includes(lower) || p.barcode === q
        ).slice(0, 20));
      }
    } catch {
      // Fallback to cache
      const all = await getCachedProducts();
      const lower = q.toLowerCase();
      setResults(all.filter(p => p.name.toLowerCase().includes(lower)).slice(0, 20));
    } finally {
      setLoading(false);
    }
  }, [state.isOnline]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Barcode scanner callback
  const handleBarcode = useCallback(async (code: string) => {
    setQuery(code);
    try {
      let product: POSProduct | undefined;
      if (state.isOnline) {
        product = await posAPI.getProductByBarcode(code);
      } else {
        product = await getCachedProductByBarcode(code);
      }
      if (product) {
        onProductSelect(product);
        setQuery('');
        setResults([]);
      }
    } catch { /* not found */ }
  }, [state.isOnline, onProductSelect]);

  useBarcode(handleBarcode);

  const handleSelect = (product: POSProduct) => {
    onProductSelect(product);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou scanner le code-barres..."
          className="pl-9 pr-9 h-12 text-base"
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 h-8 w-8"
            onClick={() => { setQuery(''); setResults([]); }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {results.map(product => (
            <button
              key={product.id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left border-b last:border-0 transition-colors"
              onClick={() => handleSelect(product)}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.price.toLocaleString()} XOF — Stock: {product.stock}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
