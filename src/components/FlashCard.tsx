import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl } from '@/lib/api';
import { FlashSale, Product } from '@/types';
import { motion } from 'framer-motion';
import { Clock, Eye, Flame, ShoppingCart, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FlashCardProps {
  flashSale?: FlashSale;
  showQuickView?: boolean;
  index?: number;
}

const fmt = (n: number) => String(n).padStart(2, '0');

export const FlashCard = ({
  flashSale,
  showQuickView = true,
  index = 0,
}: FlashCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!flashSale?.endDate) return;
    const tick = () => {
      const diff = new Date(flashSale.endDate).getTime() - Date.now();
      if (diff <= 0) { setIsExpired(true); return; }
      setT({ h: Math.floor(diff / 3_600_000), m: Math.floor((diff / 60_000) % 60), s: Math.floor((diff / 1_000) % 60) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [flashSale?.endDate]);

  if (!flashSale) {
    return (
      <div className="rounded-2xl overflow-hidden border-2 border-border bg-card">
        <Skeleton className="h-52 w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-8 w-1/2 mt-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!flashSale.product) return null;

  const product = flashSale.product;
  const discountPrice = flashSale.discountPrice;
  const originalPrice = product.price;
  const pct = flashSale.discountPercentage || 0;
  const stock = flashSale.stock || 0;
  const sold = flashSale.soldCount || 0;
  const remaining = Math.max(stock - sold, 0);
  const progress = stock ? Math.min((sold / stock) * 100, 100) : 0;
  const urgencyLevel = remaining <= 5 ? 'critical' : remaining <= 15 ? 'urgent' : 'normal';
  const imageSrc = imageError ? '/placeholder-product.png' : getImageUrl(product.images?.[0] || '/placeholder-product.png');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) { toast.error('Ce produit est en rupture de stock'); return; }
    if (isExpired) { toast.error('Cette vente flash est terminée'); return; }
    try {
      const flashProduct: Product = { ...product, price: discountPrice, originalPrice };
      await addToCart(flashProduct, 1, product.colors?.[0], product.sizes?.[0]);
      toast.success(`${product.name} ajouté au panier !`);
    } catch {
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="h-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`h-full flex flex-col rounded-2xl overflow-hidden bg-card border-2 transition-all duration-300 cursor-pointer ${
          isExpired
            ? 'border-border opacity-60 grayscale'
            : 'border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10'
        }`}
        onClick={() => navigate(`/flash/${flashSale.id}`)}
      >
        {/* Urgency top strip — stays red, it signals time pressure */}
        {!isExpired && urgencyLevel !== 'normal' && (
          <div className={`h-1 w-full ${urgencyLevel === 'critical' ? 'bg-gradient-to-r from-red-600 to-orange-500 animate-pulse' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`} />
        )}

        {/* Image zone */}
        <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
          {!imageLoaded && <Skeleton className="absolute inset-0" />}

          <img
            src={imageSrc}
            alt={product.name}
            className={`w-full h-full object-contain p-3 transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => { setImageError(true); setImageLoaded(true); }}
          />

          {/* Badges top-left — discount stays red */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-lg ${urgencyLevel === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-700 animate-bounce' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}>
              <Zap className="h-3 w-3 fill-white" />-{pct}%
            </span>
            {product.featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-bold shadow">
                <Star className="h-3 w-3 fill-yellow-900" /> Vedette
              </span>
            )}
          </div>

          {/* Timer top-right */}
          {!isExpired && (
            <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold shadow-lg ${urgencyLevel === 'critical' ? 'bg-red-600 text-white animate-pulse' : urgencyLevel === 'urgent' ? 'bg-orange-600 text-white' : 'bg-black/70 text-white backdrop-blur-sm'}`}>
              <Clock className="h-3 w-3 shrink-0" />
              {t.h > 0 ? `${fmt(t.h)}h${fmt(t.m)}` : `${fmt(t.m)}:${fmt(t.s)}`}
            </div>
          )}

          {/* Quick view overlay */}
          {showQuickView && !isExpired && (
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-900 text-sm font-semibold shadow-xl hover:bg-gray-50 transition active:scale-95"
                onClick={(e) => { e.stopPropagation(); navigate(`/flash/${flashSale.id}`); }}
              >
                <Eye className="h-4 w-4" /> Voir détails
              </button>
            </div>
          )}

          {/* Expired overlay */}
          {isExpired && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-base px-4 py-2">Vente terminée</Badge>
            </div>
          )}

          {/* Stock bar */}
          {stock > 0 && !isExpired && (
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-4 bg-gradient-to-t from-black/30 to-transparent">
              <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progress > 75 ? 'bg-red-400' : progress > 40 ? 'bg-amber-400' : 'bg-primary/70'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          {/* Category & Brand — use primary like ProductCard */}
          {(product.category || product.brand) && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              {product.category && (
                <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">{product.category}</span>
              )}
              {product.brand && (
                <span className="font-semibold text-primary">{product.brand}</span>
              )}
            </div>
          )}

          <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Urgency stock warning — stays orange/red */}
          {urgencyLevel !== 'normal' && remaining > 0 && !isExpired && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${urgencyLevel === 'critical' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-800/40 animate-pulse' : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 border border-orange-200 dark:border-orange-800/40'}`}>
              <Flame className="h-3.5 w-3.5 fill-current shrink-0" />
              Plus que {remaining} en stock !
            </div>
          )}

          {/* Price — use primary like ProductCard */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {discountPrice.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {originalPrice.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">
              −{(originalPrice - discountPrice).toLocaleString('fr-FR')} F
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-border hover:border-primary/50 text-muted-foreground hover:text-primary text-sm font-semibold transition active:scale-95"
              onClick={(e) => { e.stopPropagation(); navigate(`/flash/${flashSale.id}`); }}
            >
              <Eye className="h-4 w-4" /> Voir
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${!product.inStock || isExpired ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20'}`}
              onClick={handleAddToCart}
              disabled={!product.inStock || isExpired}
            >
              <ShoppingCart className="h-4 w-4" />
              {isExpired ? 'Terminée' : product.inStock ? 'Ajouter' : 'Épuisé'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
