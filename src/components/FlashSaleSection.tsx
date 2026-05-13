import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getFlashSales, getImageUrl } from '@/lib/api';
import type { FlashSale } from '@/types';

const fmt = (n: number) => String(n).padStart(2, '0');

const Digit = ({ value }: { value: string }) => (
  <span className="inline-flex flex-col items-center justify-center w-8 h-9 rounded-md bg-black/80 text-white font-mono font-bold text-lg leading-none shadow-inner">
    {value}
  </span>
);

const Timer = ({ endDate }: { endDate: string }) => {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return;
      setT({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff / 60_000) % 60),
        s: Math.floor((diff / 1_000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <div className="flex items-center gap-1">
      <Digit value={fmt(t.h)} />
      <span className="text-white/70 font-bold text-sm">:</span>
      <Digit value={fmt(t.m)} />
      <span className="text-white/70 font-bold text-sm">:</span>
      <Digit value={fmt(t.s)} />
    </div>
  );
};

const SaleCard = ({ sale }: { sale: FlashSale }) => {
  const navigate = useNavigate();
  const stock = sale.stock || 0;
  const sold = sale.soldCount || 0;
  const remaining = Math.max(stock - sold, 0);
  const progress = stock ? Math.min((sold / stock) * 100, 100) : 0;
  const pct = sale.discountPercentage || 0;
  const urgent = remaining <= 5 && remaining > 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="w-56 shrink-0 cursor-pointer"
      onClick={() => navigate(`/flash/${sale.id}`)}
    >
      <div className="rounded-2xl overflow-hidden bg-white dark:bg-card border border-orange-100 dark:border-orange-900/40 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 overflow-hidden">
          {/* Discount badge */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold shadow-lg">
              <Zap className="h-3 w-3 fill-white" />
              -{pct}%
            </span>
            {urgent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse shadow">
                <Flame className="h-3 w-3 fill-white" />
                {remaining} restants
              </span>
            )}
          </div>

          <img
            src={getImageUrl(sale.product?.images?.[0] || '/placeholder-product.png')}
            alt={sale.product?.name}
            className="w-full h-full object-contain p-2 transition-transform duration-500 hover:scale-110"
            onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
          />

          {/* Stock bar overlay */}
          {stock > 0 && (
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-4 bg-gradient-to-t from-black/40 to-transparent">
              <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progress > 75 ? 'bg-red-400' : progress > 50 ? 'bg-orange-400' : 'bg-green-400'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {!urgent && remaining > 0 && (
                <p className="text-[10px] text-white/90 mt-1 font-medium">
                  {remaining} restants sur {stock}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
            {sale.product?.name}
          </h3>

          <div className="mt-auto space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-red-600">
                {sale.discountPrice.toLocaleString()} FCFA
              </span>
            </div>
            <span className="text-xs line-through text-muted-foreground">
              {sale.product?.price.toLocaleString()} FCFA
            </span>
          </div>

          <button
            className="w-full py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-sm font-semibold shadow transition-all active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/flash/${sale.id}`);
            }}
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-56 h-80 rounded-2xl shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!sales.length) return null;

  return (
    <section className="py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/60 via-orange-50/40 to-transparent dark:from-red-950/20 dark:via-orange-950/10 dark:to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-400/20">
              <Flame className="h-4 w-4 text-red-500 fill-red-500" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                Offres limitées
              </span>
            </div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
              Ventes Flash
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-orange-500/20">
              <Flame className="h-4 w-4 text-white/80 fill-white/50" />
              <Timer endDate={sales[0].endDate} />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 font-semibold gap-1.5"
              onClick={() => navigate('/flash')}
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* SLIDER */}
        <div className="relative group/slider">
          {/* Left arrow */}
          <button
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white dark:bg-card shadow-lg border items-center justify-center text-gray-600 hover:text-orange-600 hover:border-orange-300 transition opacity-0 group-hover/slider:opacity-100"
            onClick={() => scroll(-280)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {sales.map((sale) => (
              <SaleCard key={sale.id} sale={sale} />
            ))}
          </div>

          {/* Right arrow */}
          <button
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white dark:bg-card shadow-lg border items-center justify-center text-gray-600 hover:text-orange-600 hover:border-orange-300 transition opacity-0 group-hover/slider:opacity-100"
            onClick={() => scroll(280)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
