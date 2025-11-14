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

  useEffect(() => {
    loadBanners();
  }, []);

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

  if (loading) {
    return (
      <div className="relative w-full h-[400px] md:h-[500px] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg group">
      {/* Slides */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${banner.imageUrl || banner.product?.images?.[0] || banner.images?.[0]})`,
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            {/* Content optimisé */}
            <div className="relative h-full flex items-center px-6 md:px-12">
              <div className="max-w-lg text-white space-y-2">
                <h2 className="text-xl md:text-3xl font-bold leading-tight">
                  {banner.title}
                </h2>
                <p className="text-sm md:text-lg text-gray-200">
                  {banner.subtitle}
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => navigate(`/products/${banner.productId}`)}
                  >
                    Découvrir
                  </Button>

                  {banner.product?.price && (
                    <span className="text-base md:text-xl font-bold">
                      {banner.product.price.toFixed(2)} Fcfa
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons (plus petits) */}
      <div className="absolute inset-0 flex items-center justify-between px-4 z-20 pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="pointer-events-auto bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="pointer-events-auto bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dots plus petits */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? 'w-5 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
