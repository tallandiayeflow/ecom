import { useEffect, useState } from 'react';
import { FlashSale } from '@/types';
import { getFlashSales } from '@/lib/api';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FlashSaleSection = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadFlashSales();
    // Auto-scroll every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % flashSales.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [flashSales.length]);

  const loadFlashSales = async () => {
    try {
      const data = await getFlashSales();
      setFlashSales(data);
    } catch (error) {
      console.error('Error loading flash sales:', error);
    }
  };

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (flashSales.length === 0) return;

    const timer = setInterval(() => {
      const sale = flashSales[currentIndex];
      if (!sale) return;

      const now = new Date().getTime();
      const end = new Date(sale.endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSales, currentIndex]);

  if (flashSales.length === 0) return null;

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? flashSales.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % flashSales.length);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center animate-pulse-glow">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Ventes Flash</h2>
            <p className="text-muted-foreground">Offres limitées dans le temps</p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex gap-2">
          {[
            { label: 'H', value: timeLeft.hours },
            { label: 'M', value: timeLeft.minutes },
            { label: 'S', value: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 font-bold text-xl min-w-[50px] text-center">
                {String(item.value).padStart(2, '0')}
              </div>
              <span className="text-xs text-muted-foreground mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {flashSales.map((sale) => (
              <div key={sale.id} className="w-full flex-shrink-0 px-2">
                <div className="max-w-sm mx-auto">
                  <ProductCard product={sale.product} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={goToNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-4">
          {flashSales.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
