import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getFlashSales } from '@/lib/api';
import type { FlashSale } from '@/types';

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  ShoppingCart,
  Star
} from 'lucide-react';

export const FlashSaleSection = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFlashSales();
  }, []);

  useEffect(() => {
    if (!flashSales.length) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const end = new Date(flashSales[0].endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(interval);
        loadFlashSales();
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSales]);

  const loadFlashSales = async () => {
    try {
      setLoading(true);
      const data = await getFlashSales();
      setFlashSales(data.flashSales || []);
    } catch (err) {
      console.error('Error loading flash sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const amount = dir === 'left' ? -320 : 320;
    sliderRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const fmt = (n: number) => String(n).padStart(2, '0');

  /* ====================== LOADING ====================== */

  if (loading) {
    return (
      <section className="py-8 sm:py-12 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
            </div>
            <Skeleton className="h-9 w-40 rounded-xl hidden xs:block" />
          </div>

          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="flex-shrink-0 w-64 sm:w-72 h-72 sm:h-80 rounded-2xl"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!flashSales.length) return null;

  /* ====================== CONTENT ====================== */

  return (
    <section className="py-8 sm:py-14 bg-gradient-to-br from-orange-50 via-red-50/30 to-orange-50 relative overflow-hidden">
      {/* simple background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-40 h-40 bg-red-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-6">
        {/* HEADER */}
        <div className="mb-6 sm:mb-10">
          <div className="flex flex-col items-start sm:items-center sm:text-center gap-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 px-3 py-1.5 rounded-xl shadow-md">
              <Flame className="h-4 w-4 text-white" />
              <span className="text-[11px] font-semibold text-orange-100 uppercase tracking-wide">
                Ventes flash
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight bg-gradient-to-r from-orange-700 to-red-600 bg-clip-text text-transparent">
              Offres limitées, stock en chute libre !
            </h2>

            {/* Timer & CTA – en colonne sur mobile, en ligne sur desktop */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-sm border border-orange-100">
                <Clock className="h-5 w-5 text-orange-600 shrink-0" />
                <div className="flex gap-2 text-xs sm:text-sm font-bold text-orange-700">
                  <span>{fmt(timeLeft.hours)}h</span>
                  <span>{fmt(timeLeft.minutes)}m</span>
                  <span>{fmt(timeLeft.seconds)}s</span>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full sm:w-auto h-9 sm:h-10 text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md rounded-xl"
                onClick={() => navigate('/flash')}
              >
                Voir toutes les offres
                <ShoppingCart className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* SLIDER */}
        <div className="relative">
          {/* Arrows only on ≥ md */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-10 w-10 absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 border border-orange-200 shadow-md hover:bg-orange-500 hover:text-white"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div
            ref={sliderRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {flashSales.map((sale) => {
              const stock = sale.stock || 0;
              const sold = sale.soldCount || 0;
              const remaining = Math.max(stock - sold, 0);
              const progress =
                stock > 0 ? Math.min((sold / stock) * 100, 100) : 0;

              return (
                <motion.div
                  key={sale.id}
                  className="flex-shrink-0 w-64 sm:w-72"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className="h-full rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                    onMouseEnter={() => setHoveredId(sale.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => navigate(`/flash/${sale.id}`)}
                  >
                    {/* IMAGE */}
                    <div className="relative h-40 sm:h-44 bg-gradient-to-br from-orange-50 to-red-50">
                      <Badge className="absolute top-2 left-2 z-10 bg-red-600 text-[11px] px-2 py-0.5">
                        -{sale.discountPercentage}%
                      </Badge>

                      {remaining > 0 && remaining <= 3 && (
                        <Badge
                          variant="destructive"
                          className="absolute top-2 right-2 z-10 text-[10px] px-2 py-0.5"
                        >
                          <Flame className="h-3 w-3 mr-1" />
                          {remaining} restant(s)
                        </Badge>
                      )}

                      <img
                        src={
                          sale.product?.images?.[0] ||
                          sale.product?.image_url ||
                          '/placeholder-product.png'
                        }
                        alt={sale.product?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.png';
                        }}
                      />

                      {stock > 0 && (
                        <div className="absolute bottom-2 left-3 right-3">
                          <div className="w-full bg-white/70 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-white mt-0.5 text-center drop-shadow">
                            {remaining} / {stock} restants
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="p-3 sm:p-4 space-y-2">
                      {(sale.product?.category || sale.product?.brand) && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {sale.product?.category && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200"
                            >
                              {sale.product.category}
                            </Badge>
                          )}
                          {sale.product?.brand && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {sale.product.brand}
                            </Badge>
                          )}
                        </div>
                      )}

                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 min-h-[2.5rem]">
                        {sale.product?.name}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-extrabold text-red-600">
                            {sale.discountPrice.toLocaleString('fr-FR')} FCFA
                          </span>
                          <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
                            {sale.product?.price.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-emerald-700 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                          Économisez{' '}
                          {(sale.product!.price - sale.discountPrice).toLocaleString(
                            'fr-FR',
                          )}{' '}
                          FCFA
                        </p>
                      </div>

                      <Button
                        className="w-full mt-1 h-9 text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/flash/${sale.id}`);
                        }}
                      >
                        Voir les détails
                      </Button>
                    </div>

                    {hoveredId === sale.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pointer-events-none absolute inset-0 bg-black/5"
                      />
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-10 w-10 absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 border border-orange-200 shadow-md hover:bg-orange-500 hover:text-white"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
