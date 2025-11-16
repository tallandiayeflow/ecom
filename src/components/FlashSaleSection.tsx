import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getFlashSales } from '@/lib/api';
import { FlashSale } from '@/types';
import { ChevronLeft, ChevronRight, Clock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const FlashSaleSection = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const navigate = useNavigate();
  const logo ="/logo.png"

  useEffect(() => {
    loadFlashSales();
  }, []);

  // Compte à rebours pour la prochaine fin de vente flash
  useEffect(() => {
    if (flashSales.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const endDate = new Date(flashSales[0].endDate).getTime();
      const distance = endDate - now;

      if (distance < 0) {
        clearInterval(interval);
        loadFlashSales(); // Recharger si la vente est terminée
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSales]);

  const loadFlashSales = async () => {
    try {
      setLoading(true);
      const data = await getFlashSales();
      setFlashSales(data);
    } catch (error) {
      console.error('Error loading flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('flash-sale-slider');
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Afficher un loader pendant le chargement
  if (loading) {
  return (
    <section className="py-8 opacity-40 animate-pulse pointer-events-none select-none">
      <div className="flex items-center justify-between mb-6">
        {/* En-tête skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-lg" />
          <div className="space-y-2">
            <div className="w-32 h-6 bg-gray-300 rounded" />
            <div className="w-48 h-4 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Timer Skeleton */}
        <div className="w-28 h-10 bg-gray-200 rounded-lg" />
      </div>

      {/* Slider skeleton */}
      <div className="flex gap-4 overflow-hidden py-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="w-[280px] h-80 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </section>
  );
}


  // Ne rien afficher si aucune vente flash
  if (flashSales.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        {/* En-tête */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Ventes Flash</h2>
            <p className="text-sm text-muted-foreground">Offres limitées - Dépêchez-vous !</p>
          </div>
        </div>

        {/* Compte à rebours */}
        {flashSales.length > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-2 rounded-lg">
            <Clock className="h-5 w-5 text-orange-600" />
            <div className="flex gap-1 text-lg font-bold text-orange-600">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span>:</span>
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span>:</span>
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Slider de produits en vente flash */}
      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          id="flash-sale-slider"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {flashSales.map((sale) => (
            <Card
              key={sale.id}
              className="flex-shrink-0 w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/product/${sale.productId}`)}
            >
              <div className="relative">
                {/* Badge de réduction */}
                <Badge className="absolute top-2 left-2 z-10 bg-red-600 hover:bg-red-700">
                  -{sale.discountPercentage}%
                </Badge>

                {/* Image du produit */}
                {sale.product?.images?.[0] && (
                  <img
                    src={sale.product.images[0]}
                    alt={logo}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}

                {/* Informations du produit */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-2 h-12">
                    {sale.product.name}
                  </h3>

                  {/* Prix */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-600">
                        {sale.discountPrice.toFixed(2)} Fcfa
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {sale.product.price.toFixed(2)} Fcfa
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Économisez {(sale.product.price - sale.discountPrice).toFixed(2)} Fcfa
                    </p>
                  </div>

                  {/* Barre de progression du stock */}
                  {sale.soldCount !== undefined && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((sale.soldCount / sale.stock) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sale.stock - sale.soldCount} restant(s)
                      </p>
                    </div>
                  )}

                  {/* Bouton d'action */}
                  <Button
                    className="w-full mt-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${sale.productId}`);
                    }}
                  >
                    Acheter maintenant
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};
