import { Button } from '@/components/ui/button';
import { getBanners } from '@/lib/api';
import { BannerSlide } from '@/types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const BannerSlider = () => {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Charger les bannières au montage
  useEffect(() => {
    loadBanners();
  }, []);

  // Auto-play : changer de bannière toutes les 5 secondes
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
      // En cas d'erreur, on n'affiche rien (plutôt qu'un message d'erreur)
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="relative w-full h-[400px] md:h-[500px] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Ne rien afficher si aucune bannière
  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-xl group">
      {/* Slides */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${banner.imageUrl || banner.product?.images?.[0] || banner.images?.[0]})`,
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

            {/* Content */}
            <div className="relative h-full flex items-center px-8 md:px-16 lg:px-24">
              <div className="max-w-2xl text-white space-y-4">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  {banner.title}
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl text-gray-200">
                  {banner.subtitle}
                </p>
                <div className="flex items-center gap-4 mt-6">
                  <Button
                    size="lg"
                    onClick={() => navigate(`/products/${banner.productId}`)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Découvrir
                  </Button>
                  {banner.product?.price && (
                    <div className="text-white">
                      <span className="text-2xl font-bold">
                        {banner.product.price.toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="absolute inset-0 flex items-center justify-between px-4 z-20 pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="pointer-events-auto bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="pointer-events-auto bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
