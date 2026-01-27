import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getFlashSales } from '@/lib/api';
import type { FlashSale } from '@/types';

export const FlashSaleSection = () => {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  const sliderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /* ================= FETCH ================= */
  useEffect(() => {
    getFlashSales()
      .then((res) => setSales(res.flashSales || []))
      .finally(() => setLoading(false));
  }, []);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!sales.length) return;

    const end = new Date(sales[0].endDate).getTime();

    const id = setInterval(() => {
      const diff = end - Date.now();
      if (diff <= 0) return clearInterval(id);

      setTime({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff / 60_000) % 60),
        s: Math.floor((diff / 1_000) % 60),
      });
    }, 1000);

    return () => clearInterval(id);
  }, [sales]);

  const scroll = (x: number) =>
    sliderRef.current?.scrollBy({ left: x, behavior: 'smooth' });

  const fmt = (n: number) => String(n).padStart(2, '0');

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <section className="py-10 bg-orange-50">
        <div className="max-w-6xl mx-auto px-4 flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-64 h-80 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!sales.length) return null;

  /* ================= UI ================= */
  return (
    <section className="py-12 light:bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-600">
                Ventes flash
              </span>
            </div>
            <h2 className="text-2xl font-extrabold">
              Offres à durée limitée
            </h2>
          </div>

          <div className="flex items-center gap-3 light:bg-white dark:bg-secondary px-4 py-2 rounded-xl shadow-sm">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="font-mono text-sm font-bold">
              {fmt(time.h)}:{fmt(time.m)}:{fmt(time.s)}
            </span>
          </div>
        </div>

        {/* SLIDER */}
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2"
            onClick={() => scroll(-300)}
          >
            <ChevronLeft />
          </Button>

          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
          >
            {sales.map((sale) => {
              const stock = sale.stock || 0;
              const sold = sale.soldCount || 0;
              const remaining = Math.max(stock - sold, 0);
              const progress = stock ? (sold / stock) * 100 : 0;

              return (
                <Card
                  key={sale.id}
                  className="w-64 shrink-0 rounded-2xl overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/flash/${sale.id}`)}
                >
                  {/* IMAGE */}
                  <div className="relative h-40 bg-orange-100">
                    <Badge className="absolute top-2 left-2 bg-red-600">
                      -{sale.discountPercentage}%
                    </Badge>

                    <img
                      src={sale.product?.images?.[0] || '/placeholder-product.png'}
                      alt={sale.product?.name}
                      className="w-full h-full object-cover"
                    />

                    {stock > 0 && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="h-1 bg-white/70 rounded-full">
                          <div
                            className="h-1 bg-red-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-white text-center mt-1">
                          {remaining} restants
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {sale.product?.name}
                    </h3>

                    <div>
                      <span className="text-lg font-bold text-red-600">
                        {sale.discountPrice.toLocaleString()} FCFA
                      </span>
                      <span className="ml-2 text-xs line-through text-muted-foreground">
                        {sale.product?.price.toLocaleString()} FCFA
                      </span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-red-500 hover:bg-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/flash/${sale.id}`);
                      }}
                    >
                      Voir l’offre
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2"
            onClick={() => scroll(300)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
};
