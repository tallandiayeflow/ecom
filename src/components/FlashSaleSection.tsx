import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Flame, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getFlashSales, getImageUrl } from '@/lib/api';
import type { FlashSale } from '@/types';

const fmt = (n: number) => String(n).padStart(2, '0');

const Digit = ({ value }: { value: string }) => (
  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/20 text-white font-mono font-bold text-base leading-none">
    {value}
  </span>
);

const Timer = ({ endDate }: { endDate: string }) => {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return;
      setT({ h: Math.floor(diff / 3_600_000), m: Math.floor((diff / 60_000) % 60), s: Math.floor((diff / 1_000) % 60) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-3.5 w-3.5 text-white/70" />
      <div className="flex items-center gap-1">
        <Digit value={fmt(t.h)} />
        <span className="text-white/60 font-bold text-xs">:</span>
        <Digit value={fmt(t.m)} />
        <span className="text-white/60 font-bold text-xs">:</span>
        <Digit value={fmt(t.s)} />
      </div>
    </div>
  );
};

const SaleCard = ({ sale }: { sale: FlashSale }) => {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);
  const stock = sale.stock || 0;
  const sold = sale.soldCount || 0;
  const remaining = Math.max(stock - sold, 0);
  const progress = stock ? Math.min((sold / stock) * 100, 100) : 0;
  const pct = sale.discountPercentage || 0;
  const urgent = remaining <= 5 && remaining > 0;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="w-56 shrink-0 cursor-pointer group"
      onClick={() => navigate(`/flash/${sale.id}`)}
    >
      <div className="rounded-2xl overflow-hidden bg-card border-2 border-border hover:border-primary/50 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col h-full">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
          {/* Discount badge — keep red, it signals a deal */}
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold shadow-lg">
            <Zap className="h-3 w-3 fill-white" />-{pct}%
          </span>

          {urgent && (
            <span className="absolute top-10 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse shadow">
              <Flame className="h-3 w-3 fill-white" />{remaining} restants
            </span>
          )}

          <img
            src={imgErr ? '/placeholder-product.png' : getImageUrl(sale.product?.images?.[0] || '/placeholder-product.png')}
            alt={sale.product?.name}
            className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgErr(true)}
          />

          {/* Stock bar */}
          {stock > 0 && (
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-4 bg-gradient-to-t from-black/30 to-transparent">
              <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progress > 75 ? 'bg-red-400' : progress > 40 ? 'bg-amber-400' : 'bg-primary/70'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {!urgent && remaining > 0 && (
                <p className="text-[10px] text-white/80 mt-0.5 font-medium">{remaining} / {stock} restants</p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {sale.product?.brand && (
            <span className="text-xs font-semibold text-primary">{sale.product.brand}</span>
          )}

          <h3 className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {sale.product?.name}
          </h3>

          <div className="mt-auto space-y-0.5">
            <div className="text-xl font-extrabold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              {sale.discountPrice.toLocaleString()} FCFA
            </div>
            <span className="text-xs line-through text-muted-foreground">
              {sale.product?.price.toLocaleString()} FCFA
            </span>
          </div>

          <button
            className="w-full py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-md shadow-primary/20 transition-all active:scale-95"
            onClick={(e) => { e.stopPropagation(); navigate(`/flash/${sale.id}`); }}
          >
            Voir l'offre
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const FlashSaleSection = () => {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getFlashSales()
      .then((res) => setSales(res.flashSales || []))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (x: number) =>
    sliderRef.current?.scrollBy({ left: x, behavior: 'smooth' });

  if (loading) {
    return (
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-56 h-80 rounded-2xl shrink-0" />)}
        </div>
      </section>
    );
  }

  if (!sales.length) return null;

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-400/20">
              <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Offres limitées</span>
            </div>
            <h2 className="text-3xl font-extrabold">
              Ventes{' '}
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Flash
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20">
              <Timer endDate={sales[0].endDate} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 font-semibold gap-1"
              onClick={() => navigate('/flash')}
            >
              Voir tout <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Slider */}
        <div className="relative group/slider">
          <button
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card shadow-lg border border-border items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition opacity-0 group-hover/slider:opacity-100"
            onClick={() => scroll(-280)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {sales.map((sale) => <SaleCard key={sale.id} sale={sale} />)}
          </div>

          <button
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card shadow-lg border border-border items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition opacity-0 group-hover/slider:opacity-100"
            onClick={() => scroll(280)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
